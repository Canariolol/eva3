
import React, { useState, useContext, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { db } from '../firebase';
import { getAuth } from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import './CorreosYCasos.css'; 

const MetricCard = ({ title, value, description, className = '' }) => (
    <div className={`metric-box ${className}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {description && <p>{description}</p>}
    </div>
  );

function CorreosYCasos() {
  const { user } = useContext(AuthContext); 
  
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [lateReplies, setLateReplies] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [subject, setSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [expandedRow, setExpandedRow] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [showLateIncorrect, setShowLateIncorrect] = useState(false);
  const [showLateCorrect, setShowLateCorrect] = useState(false);

  const functionUrl = 'https://gmail-api-handler-7r5ppdbuya-tl.a.run.app';

  const formatTimeDiff = (seconds) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  useEffect(() => {
    if (!reportData || !reportData.details) {
      setMetrics(null);
      return;
    }
    const total_received = reportData.details.length;
    const answered_emails = reportData.details.filter(d => d.is_answered).length;
    const not_answered_count = total_received - answered_emails;
    
    const valid_response_times = reportData.details
      .filter(d => d.is_answered && d.first_reply_time && d.received_date)
      .map(d => (new Date(d.first_reply_time) - new Date(d.received_date)) / 1000);
    
    let average_response_time = "N/A";
    if(valid_response_times.length > 0) {
        const avg_seconds = valid_response_times.reduce((a, b) => a + b, 0) / valid_response_times.length;
        average_response_time = formatTimeDiff(avg_seconds);
    }

    setMetrics({ total_received, answered_emails, average_response_time, not_answered_count });
  }, [reportData]);

  const connectGmail = useGoogleLogin({
    onSuccess: codeResponse => handleGmailConnectSuccess(codeResponse),
    onError: errorResponse => setError('Falló la conexión con Google.'),
    flow: 'auth-code',
  });

  const handleGmailConnectSuccess = async (codeResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${functionUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeResponse.code }),
        credentials: 'include', 
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'La autenticación falló.');
      setIsGmailConnected(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    setReportData(null); 
    setLateReplies(null); 
    
    const params = new URLSearchParams({ subject, start_date: startDate, end_date: endDate });
    const requestUrl = `${functionUrl}/api/emails?${params.toString()}`;

    try {
      const response = await fetch(requestUrl, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok || data.error) {
         if (response.status === 401) {
          setIsGmailConnected(false);
          throw new Error("Autorización expirada. Conéctate de nuevo.");
        }
        throw new Error(data.details || data.error || 'No se pudieron cargar los datos.');
      }
      
      const { details, late_replies } = data.data;

      const lateFirstReplies = (late_replies.incorrect_details || []).map(item => ({
        ...item,
        from: `(Caso Antiguo) ${item.subject}`,
        received_date: item.original_date,
        is_answered: true,
        is_late_first_reply: true,
        response_time_str: 'N/A'
      }));

      const combinedDetails = [...details, ...lateFirstReplies];
      combinedDetails.sort((a, b) => new Date(b.received_date) - new Date(a.received_date));
      
      setReportData({ details: combinedDetails, raw_data: data.data.raw_data });
      setLateReplies(late_replies);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchEmails();
  };

  const handleDeleteCase = (thread_id) => {
    setReportData(prevData => ({
        ...prevData,
        details: prevData.details.filter(d => d.thread_id !== thread_id)
    }));
  };

  const handleSaveReport = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!reportData || !metrics || !currentUser) {
        setError("No hay datos para guardar o el usuario no está autenticado.");
        return;
    }

    setIsSaving(true);
    setError(null);

    try {
        // Step 1: Save or update each individual email case in a central collection
        const detailsCollectionRef = collection(db, "unique_email_details");
        
        const detailsPromises = reportData.details.map(detail => {
            const detailRef = doc(detailsCollectionRef, detail.thread_id);
            const { body, ...detailToSave } = detail;
            // Add a timestamp to know when this case was last seen in a report
            detailToSave.last_processed_at = serverTimestamp();
            return setDoc(detailRef, detailToSave, { merge: true });
        });
        
        await Promise.all(detailsPromises);

        // Step 2: Create or update the lightweight summary report
        const summaryReportId = `${currentUser.email}_${startDate}_${endDate}_${subject || 'no-subject'}`;
        const summaryReportRef = doc(db, "email_reports", summaryReportId);
        
        const summaryReport = {
            createdBy: currentUser.email,
            filters: { subject, startDate, endDate },
            metrics: metrics,
            updatedAt: serverTimestamp(),
            // We no longer store the bulky details here
            ...(lateReplies && { late_replies_metrics: lateReplies })
        };
        
        await setDoc(summaryReportRef, summaryReport, { merge: true });

        alert("¡Reporte y casos individuales guardados/actualizados con éxito!");

    } catch (error) {
        console.error("Error saving report: ", error);
        setError("No se pudo guardar el reporte en la base de datos.");
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleToggleRow = (thread_id) => {
      setExpandedRow(prev => (prev === thread_id ? null : thread_id));
  }
  
  const handleVerifyReply = async (thread_id, sender, subject, received_date) => {
    setIsVerifying(thread_id);
    setError(null);
    try {
        const response = await fetch(`${functionUrl}/api/verify_reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, subject }),
            credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error en la verificación");

        if (data.found && data.reply_date) {
            setReportData(prevData => {
                const newDetails = prevData.details.map(d => {
                    if (d.thread_id === thread_id) {
                        const replyDate = new Date(data.reply_date);
                        const receivedDate = new Date(received_date);
                        const timeDiffSeconds = (replyDate - receivedDate) / 1000;
                        
                        return { 
                            ...d, 
                            is_answered: true, 
                            verified: true,
                            first_reply_time: data.reply_date,
                            response_time_str: formatTimeDiff(timeDiffSeconds)
                        };
                    }
                    return d;
                });
                return { ...prevData, details: newDetails };
            });
        } else {
            alert("No se encontró una respuesta coincidente para este correo.");
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setIsVerifying(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="correos-casos-container card">
      <h4 className="card-title card-title-primary">Análisis de Correos</h4>
      
      {error && <p className="error-message">{error}</p>}
      
      {!isGmailConnected ? (
        <div className="login-box">
            <p>Concede permiso para acceder a tu cuenta de Gmail (solo lectura).</p>
            <button onClick={() => connectGmail()} disabled={isLoading} className="button primary">{isLoading ? 'Conectando...' : 'Conectar con Google'}</button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleFilterSubmit} className="filter-form">
            <div className="form-group"><label htmlFor="subject">Asunto</label><input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="form-control"/></div>
            <div className="form-group"><label htmlFor="startDate">Fecha Inicio</label><input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control"/></div>
            <div className="form-group"><label htmlFor="endDate">Fecha Fin</label><input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control"/></div>
            <div className="form-group"><button type="submit" disabled={isLoading} className="button primary full-width">{isLoading ? 'Buscando...' : 'Buscar'}</button></div>
          </form>
          
          {isLoading && <p className="loading-text">Cargando métricas...</p>}
          
          {!isLoading && (
            <>
              {lateReplies && (lateReplies.incorrect_first_reply > 0 || lateReplies.correct_continued_reply > 0) && (
                <div className="late-replies-section">
                    <h4 className="card-title">Respuestas a Casos Antiguos</h4>
                    <div className="metrics-summary">
                        <MetricCard title="Seguimiento Correcto" value={lateReplies.correct_continued_reply} className="metric-green" />
                        <MetricCard title="Primera Respuesta Tardía" value={lateReplies.incorrect_first_reply} className="metric-red" />
                    </div>
                    {lateReplies.correct_details && lateReplies.correct_details.length > 0 && (
                        <div className="late-replies-details">
                            <button onClick={() => setShowLateCorrect(!showLateCorrect)} className="button small text-button">
                                {showLateCorrect ? 'Ocultar' : 'Mostrar'} Detalles de Seguimientos Correctos
                            </button>
                            {showLateCorrect && (
                                <div className="table-responsive">
                                    <table>
                                        <thead><tr><th>Asunto</th><th>Fecha Original</th><th>Fecha Respuesta en Periodo</th></tr></thead>
                                        <tbody>
                                            {lateReplies.correct_details.map(item => (
                                                <tr key={item.thread_id}><td>{item.subject}</td><td>{formatDate(item.original_date)}</td><td>{formatDate(item.first_reply_date)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {lateReplies.incorrect_details && lateReplies.incorrect_details.length > 0 && (
                        <div className="late-replies-details">
                            <button onClick={() => setShowLateIncorrect(!showLateIncorrect)} className="button small text-button">
                                {showLateIncorrect ? 'Ocultar' : 'Mostrar'} Detalles de Respuestas Tardías
                            </button>
                            {showLateIncorrect && (
                                <div className="table-responsive">
                                    <table>
                                        <thead><tr><th>Asunto</th><th>Fecha Original</th><th>Fecha 1ra Respuesta</th></tr></thead>
                                        <tbody>
                                            {lateReplies.incorrect_details.map(item => (
                                                <tr key={item.thread_id}><td>{item.subject}</td><td>{formatDate(item.original_date)}</td><td>{formatDate(item.first_reply_date)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              )}

              {metrics && reportData && (
                <div className="metrics-container">
                    <div className="metrics-summary">
                        <MetricCard title="Casos Recibidos" value={metrics.total_received} />
                        <MetricCard title="Respondidos" value={metrics.answered_emails} />
                        <MetricCard title="Sin Respuesta" value={metrics.not_answered_count} className="metric-red" />
                        <MetricCard title="Tiempo Medio Resp." value={metrics.average_response_time} />
                        <button onClick={handleSaveReport} disabled={isSaving} className="button success">{isSaving ? 'Guardando...' : 'Guardar Reporte'}</button>
                    </div>

                    <div className="info-box">
                        <p><b>Nota sobre el botón "Verificar":</b> Úsalo en los casos marcados como "No" para realizar una búsqueda profunda en la carpeta 'Enviados'. Esto permite encontrar respuestas que se hayan enviado fuera del hilo de conversación original, solucionando posibles "falsos negativos".</p>
                    </div>

                    <h4>Detalle de Conversaciones Recibidas</h4>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Asunto y Remitente</th>
                                    <th>Fecha Recibido</th>
                                    <th>Respondido</th>
                                    <th>Hora Primera Resp.</th>
                                    <th>Tiempo de Respuesta</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.details.length > 0 ? reportData.details.map(detail => (
                                    <React.Fragment key={detail.thread_id}>
                                        <tr className={`main-row ${detail.is_duplicate ? 'is-duplicate' : ''} ${detail.verified ? 'is-verified' : ''} ${detail.is_late_first_reply ? 'is-late-first-reply' : ''}`} onClick={() => handleToggleRow(detail.thread_id)}>
                                            <td className="subject-cell">
                                                <span>{detail.subject}</span>
                                                <span className="sender-email">{detail.from}</span>
                                            </td>
                                            <td>{formatDate(detail.received_date)}</td>
                                            <td>{detail.verified ? 'Sí (Verificado)' : (detail.is_answered ? 'Sí' : 'No')}</td>
                                            <td>{detail.first_reply_time ? formatDate(detail.first_reply_time) : 'N/A'}</td>
                                            <td>{detail.response_time_str}</td>
                                            <td className="actions-cell">
                                                {!detail.is_answered && !detail.verified && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleVerifyReply(detail.thread_id, detail.from, detail.subject, detail.received_date); }} disabled={isVerifying === detail.thread_id} className="button primary small">
                                                        {isVerifying === detail.thread_id ? '...' : 'Verificar'}
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCase(detail.thread_id); }} className="button danger small">Eliminar</button>
                                            </td>
                                        </tr>
                                        {expandedRow === detail.thread_id && (
                                            <tr className="expanded-row"><td colSpan="6"><div className="email-body-preview"><pre>{detail.body || "Cuerpo vacío."}</pre></div></td></tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr><td colSpan="6">No se encontraron correos con los filtros seleccionados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CorreosYCasos;
