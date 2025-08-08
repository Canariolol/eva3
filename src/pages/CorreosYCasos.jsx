
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
  
  const [accessToken, setAccessToken] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [debugData, setDebugData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });
  
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const functionUrl = '/api'; 

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
    onSuccess: tokenResponse => {
        setAccessToken(tokenResponse.access_token);
        setError(null);
    },
    onError: () => {
        setError('Falló la conexión con Google.');
    },
    // --- MODIFICACIÓN CLAVE ---
    // Le pedimos explícitamente a Google el permiso para leer correos.
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    flow: 'implicit',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const fetchEmails = async () => {
    if (!filters.startDate || !filters.endDate) {
        setError("Por favor, selecciona una fecha de inicio y de fin.");
        return;
    }
    if (!accessToken) {
        setError("La sesión de Google ha expirado o no es válida. Por favor, conéctate de nuevo.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);
    setDebugData(null);
    
    const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
    });
    const requestUrl = `${functionUrl}/emails?${params.toString()}`;

    try {
      const response = await fetch(requestUrl, { 
          headers: {
              'Authorization': `Bearer ${accessToken}`
          }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
            setAccessToken(null);
        }
        throw new Error(data.error || 'No se pudieron cargar los datos.');
      }
      
      // La API ahora devuelve un objeto 'data' que contiene 'details' y 'debug_data'
      if(data.data) {
        data.data.details.sort((a, b) => new Date(b.received_date) - new Date(a.received_date));
        setReportData(data.data);
        setDebugData(data.data.debug_data);
      } else {
        setReportData({ details: [] });
        setDebugData(null);
      }

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

  const handleVerifyReply = async (thread_id, sender, subject, received_date) => {
    if (!accessToken) {
        setError("La sesión de Google ha expirado. Por favor, conéctate de nuevo.");
        return;
    }
    setIsVerifying(thread_id);
    setError(null);
    try {
        const response = await fetch(`${functionUrl}/verify_reply`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ sender, subject, endDate: filters.endDate }),
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) setAccessToken(null);
            throw new Error(data.error || "Error en la verificación");
        }

        if (data.found && data.reply_date) {
            setReportData(prevData => {
                const newDetails = prevData.details.map(d => 
                    d.thread_id === thread_id ? { ...d, is_answered: true, verified: true, first_reply_time: data.reply_date, response_time_str: formatTimeDiff((new Date(data.reply_date) - new Date(received_date)) / 1000) } : d
                );
                return { ...prevData, details: newDetails };
            });
        } else {
            alert("No se encontró una respuesta coincidente para este correo (ni en el día siguiente).");
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setIsVerifying(null);
    }
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
        const reportId = `${currentUser.email}_${filters.startDate}_${filters.endDate}`;
        const reportRef = doc(db, "email_reports", reportId);
        await setDoc(reportRef, {
            createdBy: currentUser.email,
            filters: filters,
            metrics: metrics,
            updatedAt: serverTimestamp(),
        }, { merge: true });

        const detailsCollectionRef = collection(db, "unique_email_details");
        const detailsPromises = reportData.details.map(detail => {
            const detailRef = doc(detailsCollectionRef, detail.thread_id);
            const { body, ...detailToSave } = detail;
            detailToSave.last_processed_at = serverTimestamp();
            return setDoc(detailRef, detailToSave, { merge: true });
        });
        await Promise.all(detailsPromises);

        alert("¡Reporte y casos individuales guardados/actualizados con éxito!");
    } catch (error) {
        console.error("Error saving report: ", error);
        setError("No se pudo guardar el reporte en la base de datos.");
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteCase = (thread_id) => {
    setReportData(prevData => ({
        ...prevData,
        details: prevData.details.filter(d => d.thread_id !== thread_id)
    }));
  };
  
  const handleToggleRow = (thread_id) => {
      setExpandedRow(prev => (prev === thread_id ? null : thread_id));
  }
  
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="correos-casos-container card">
      <h4 className="card-title card-title-primary">Análisis de Correos</h4>
      
      {error && <p className="error-message">{error}</p>}
      
      {!accessToken ? (
        <div className="login-box">
            <p>Concede permiso para acceder a tu cuenta de Gmail (solo lectura).</p>
            <button onClick={() => connectGmail()} disabled={isLoading} className="button primary">{isLoading ? 'Conectando...' : 'Conectar con Google'}</button>
        </div>
      ) : (
        <div>
          <form onSubmit={handleFilterSubmit} className="filter-form">
            <div className="form-group"><label>Fecha Inicio</label><input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-control"/></div>
            <div className="form-group"><label>Fecha Fin</label><input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-control"/></div>
            <div className="form-group"><button type="submit" disabled={isLoading} className="button primary full-width">{isLoading ? 'Buscando...' : 'Buscar'}</button></div>
          </form>
          
          {isLoading && <p className="loading-text">Cargando métricas...</p>}
          
          {reportData && metrics && (
                <div className="metrics-container">
                    <div className="metrics-summary">
                        <MetricCard title="Casos Recibidos" value={metrics.total_received} />
                        <MetricCard title="Respondidos" value={metrics.answered_emails} />
                        <MetricCard title="Sin Respuesta" value={metrics.not_answered_count} className="metric-red" />
                        <MetricCard title="Tiempo Medio Resp." value={metrics.average_response_time} />
                        <button onClick={handleSaveReport} disabled={isSaving} className="button success">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>

                    <div className="info-box">
                        <p><b>Nota sobre el botón "Verificar":</b> Úsalo en los casos marcados como "No" para realizar una búsqueda profunda de la respuesta (incluyendo el día siguiente). Ideal para encontrar respuestas enviadas fuera del hilo original.</p>
                    </div>

                    {debugData && (
                        <div className="debug-section">
                            <button onClick={() => setShowDebug(!showDebug)} className="button text-button">
                                {showDebug ? 'Ocultar' : 'Mostrar'} Detalles de Depuración
                            </button>
                            {showDebug && (
                                <div>
                                    <pre style={{backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap'}}>
                                        {JSON.stringify(debugData, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}


                    <h4>Detalle de Conversaciones Iniciadas en el Período</h4>
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
                                        <tr className={`main-row ${detail.is_duplicate ? 'is-duplicate' : ''} ${detail.verified ? 'is-verified' : ''}`} onClick={() => handleToggleRow(detail.thread_id)}>
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
                                    <tr><td colSpan="6">No se encontraron conversaciones iniciadas en este período.</td></tr>
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
