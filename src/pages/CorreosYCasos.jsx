import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import './CorreosYCasos.css'; // Asegúrate de que este archivo de estilos exista y dale el estilo que quieras

function CorreosYCasos() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // La URL base de tu Cloud Function. La he tomado del código original.
  const functionUrl = 'https://gmail-api-handler-7r5ppdbuya-tl.a.run.app';

  const login = useGoogleLogin({
    onSuccess: codeResponse => handleLoginSuccess(codeResponse),
    onError: errorResponse => {
        console.error('Google Login Failed:', errorResponse);
        setError('Falló el inicio de sesión con Google. Por favor, intente de nuevo.');
    },
    // ¡Crucial! Pedimos un código de autorización para enviarlo al backend de forma segura.
    flow: 'auth-code',
  });

  const handleLoginSuccess = async (codeResponse) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${functionUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeResponse.code }),
      });
      
      if (!response.ok) {
        throw new Error('La autenticación en el servidor falló.');
      }

      const data = await response.json();
      console.log('Login en backend exitoso:', data);
      setIsLoggedIn(true);
      fetchEmails(); // Llama a buscar los correos justo después del login
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      // "credentials: 'include'" es necesario para que el navegador envíe las cookies de sesión a tu backend
      const response = await fetch(`${functionUrl}/api/emails`, { credentials: 'include' });

      if (!response.ok) {
        if (response.status === 401) {
          setIsLoggedIn(false);
          setError("Sesión expirada. Por favor, inicie sesión de nuevo.");
        } else {
          throw new Error('No se pudieron cargar los datos de los correos.');
        }
      } else {
        const data = await response.json();
        setEmailData(data.data); // Accedemos a la propiedad "data" de nuestra respuesta del API
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="correos-casos-container card">
      <h2>Análisis de Correos de Soporte</h2>
      <p>Conéctate a tu cuenta de Google para analizar los correos, verificar respuestas y medir tiempos de gestión.</p>
      
      {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}

      {!isLoggedIn ? (
        <button onClick={() => login()} disabled={isLoading} className="button primary">
          {isLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
        </button>
      ) : (
        <div>
          <button onClick={fetchEmails} disabled={isLoading} className="button secondary">
            {isLoading ? 'Actualizando...' : 'Actualizar Correos'}
          </button>
          
          <div className="email-results">
            {isLoading && !emailData && <p>Cargando datos...</p>}
            {emailData && (
              <ul>
                {emailData.map(msg => (
                  <li key={msg.id}>ID del Mensaje: {msg.id}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CorreosYCasos;
