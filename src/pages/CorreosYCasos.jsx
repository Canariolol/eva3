import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import './CorreosYCasos.css'; 

function CorreosYCasos() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailMetrics, setEmailMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- INICIO DE NUEVOS ESTADOS PARA FILTROS ---
  const [subject, setSubject] = useState('evaluacion de calidad de la gestion');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // --- FIN DE NUEVOS ESTADOS ---

  const functionUrl = 'https://gmail-api-handler-7r5ppdbuya-tl.a.run.app';

  const login = useGoogleLogin({
    onSuccess: codeResponse => handleLoginSuccess(codeResponse),
    onError: errorResponse => {
        console.error('Google Login Failed:', errorResponse);
        setError('Falló el inicio de sesión con Google. Por favor, intente de nuevo.');
    },
    flow: 'auth-code',
  });

  const handleLoginSuccess = async (codeResponse) => {
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
      if (!response.ok || data.error) {
        throw new Error(data.error || 'La autenticación en el servidor falló.');
      }

      setIsLoggedIn(true);
      fetchEmails();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);
    
    // --- INICIO DE LÓGICA DE FILTROS ---
    // Construir la URL con los parámetros de búsqueda
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const requestUrl = `${functionUrl}/api/emails?${queryString}`;
    // --- FIN DE LÓGICA DE FILTROS ---

    try {
      const response = await fetch(requestUrl, { credentials: 'include' });
      
      const data = await response.json();
      if (!response.ok || data.error) {
         if (response.status === 401) {
          setIsLoggedIn(false);
          throw new Error("Sesión expirada o no autorizado. Por favor, inicie sesión de nuevo.");
        }
        throw new Error(data.details || data.error || 'No se pudieron cargar los datos de los correos.');
      }
      
      setEmailMetrics(data.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el envío del formulario de filtros
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      fetchEmails();
    }
  };

  return (
    <div className="correos-casos-container card">
      <h2>Análisis de Correos</h2>
      <p>Conéctate y filtra correos para analizar casos, verificar respuestas y medir tiempos de gestión.</p>
      
      {error && <p className="error-message">{error}</p>}

      {!isLoggedIn ? (
        <div className="login-box">
            <button onClick={() => login()} disabled={isLoading} className="button primary">
            {isLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
            </button>
        </div>
      ) : (
        <div>
          {/* --- INICIO DEL FORMULARIO DE FILTROS --- */}
          <form onSubmit={handleFilterSubmit} className="filter-form">
            <div className="form-group">
              <label htmlFor="subject">Asunto del Correo</label>
              <input 
                type="text" 
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: evaluacion de calidad"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="startDate">Fecha Inicio</label>
              <input 
                type="date" 
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Fecha Fin</label>
              <input 
                type="date" 
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <button type="submit" disabled={isLoading} className="button primary">
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
          {/* --- FIN DEL FORMULARIO DE FILTROS --- */}
          
          {isLoading && <p className="loading-text">Cargando métricas...</p>}

          {emailMetrics && (
            <div className="metrics-container">
              <div className="metrics-summary">
                <div className="metric-box"><span>Casos Únicos</span><strong>{emailMetrics.total_emails}</strong></div>
                <div className="metric-box"><span>Respondidos</span><strong>{emailMetrics.answered_emails}</strong></div>
                <div className="metric-box"><span>Tiempo Medio Resp.</span><strong>{emailMetrics.average_response_time}</strong></div>
              </div>

              <h4>Detalle de Conversaciones</h4>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Asunto</th>
                      <th>Fecha Recibido</th>
                      <th>Respondido</th>
                      <th>Tiempo de Respuesta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailMetrics.details.length > 0 ? emailMetrics.details.map(detail => (
                      <tr key={detail.thread_id}>
                        <td>{detail.subject}</td>
                        <td>{detail.received_date !== 'N/A' ? new Date(detail.received_date).toLocaleString() : 'N/A'}</td>
                        <td>{detail.is_answered ? 'Sí' : 'No'}</td>
                        <td>{detail.response_time_str}</td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="4">No se encontraron correos con los filtros seleccionados.</td>
                        </tr>
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
