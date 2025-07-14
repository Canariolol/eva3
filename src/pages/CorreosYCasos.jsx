import React, { useState, useContext, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import './CorreosYCasos.css'; 

function CorreosYCasos() {
  const { user } = useContext(AuthContext); 
  
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [subject, setSubject] = useState('evaluacion de calidad de la gestion');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [expandedRow, setExpandedRow] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  const functionUrl = 'https://gmail-api-handler-7r5ppdbuya-tl.a.run.app';

  useEffect(() => {
    if (!reportData) {
      setMetrics(null);
      return;
    }
    const total_received = reportData.details.length;
    const answered_emails = reportData.details.filter(d => d.is_answered).length;
    
    const valid_response_times = reportData.details
      .filter(d => d.is_answered && d.first_reply_time && d.received_date)
      .map(d => new Date(d.first_reply_time) - new Date(d.received_date));
    
    let average_response_time = "N/A";
    if(valid_response_times.length > 0) {
        const avg_ms = valid_response_times.reduce((a, b) => a + b, 0) / valid_response_times.length;
        const days = Math.floor(avg_ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((avg_ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((avg_ms % (1000 * 60 * 60)) / (1000 * 60));
        average_response_time = `${days}d ${hours}h ${minutes}m`;
    }

    setMetrics({ total_received, answered_emails, average_response_time });
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
      setReportData(data.data);
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
    if (!reportData || !metrics) {
        setError("No hay datos para guardar.");
        return;
    }
    setIsSaving(true);
    setError(null);
    try {
        const detailsToSave = reportData.details.map(({ body, ...rest }) => rest);
        await addDoc(collection(db, "email_reports"), {
            createdAt: serverTimestamp(),
            createdBy: user.email,
            filters: { subject, startDate, endDate },
            metrics: metrics,
            corrected_details: detailsToSave
        });
        alert("¡Reporte guardado con éxito!");
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

  //if (!user) return <div className="correos-casos-container card"><p>Inicia sesión para usar esta herramienta.</p></div>;

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

          {metrics && (
            <div className="metrics-container">
                <div className="metrics-summary">
                    <div className="metric-box"><span>Casos Recibidos</span><strong>{metrics.total_received}</strong></div>
                    <div className="metric-box"><span>Respondidos</span><strong>{metrics.answered_emails}</strong></div>
                    <div className="metric-box"><span>Tiempo Medio Resp.</span><strong>{metrics.average_response_time}</strong></div>
                    <button onClick={handleSaveReport} disabled={isSaving} className="button success">{isSaving ? 'Guardando...' : 'Guardar Reporte'}</button>
                </div>

                <div className="raw-data-container">
                    <button onClick={() => setShowRawData(!showRawData)} className="button small text-button">
                        {showRawData ? 'Ocultar' : 'Mostrar'} Asuntos Recuperados para Verificación
                    </button>
                    {showRawData && reportData.raw_data && (
                        <div className="raw-data-box">
                            <div>
                                <h4>Asuntos en Bandeja de Entrada ({reportData.raw_data.received_subjects.length})</h4>
                                <pre>{JSON.stringify(reportData.raw_data.received_subjects, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                <h4>Detalle de Conversaciones Recibidas</h4>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Asunto</th>
                                <th>Fecha Recibido</th>
                                <th>Respondido</th>
                                <th>Hora Primera Resp.</th>
                                <th>Tiempo de Respuesta</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.details.length > 0 ? reportData.details.map(detail => (
                                <React.Fragment key={detail.thread_id}>
                                    <tr className="main-row" onClick={() => handleToggleRow(detail.thread_id)}>
                                        <td>{detail.subject}</td>
                                        <td>{new Date(detail.received_date).toLocaleString()}</td>
                                        <td>{detail.is_answered ? 'Sí' : 'No'}</td>
                                        <td>{detail.first_reply_time ? new Date(detail.first_reply_time).toLocaleString() : 'N/A'}</td>
                                        <td>{detail.response_time_str}</td>
                                        <td><button onClick={(e) => { e.stopPropagation(); handleDeleteCase(detail.thread_id); }} className="button danger small">Eliminar</button></td>
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
        </div>
      )}
    </div>
  );
}

export default CorreosYCasos;
