import React from 'react';
import './CorreosYCasos.css';

const CorreosYCasos = () => {
  // Esta es la URL de producción correcta y definitiva para tu función.
  const cloudFunctionUrl = "https://gmail-api-handler-7r5ppdbuya-tl.a.run.app/"; 

  return (
    <div className="correos-casos-container">
      <header className="page-header">
        <h1>Bandeja de Entrada y Análisis de Casos</h1>
        <p>
          Esta sección se conecta a tu backend de Python para analizar correos de Gmail.
        </p>
      </header>
      
      <iframe
        src={cloudFunctionUrl}
        title="Correos y Casos"
        className="correos-iframe"
      ></iframe>
    </div>
  );
};

export default CorreosYCasos;
