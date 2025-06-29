import React, { useState, useContext, useEffect, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';

function ExecutiveEvaluations({ executiveId, onClose }) {
  const { executives, evaluations, evaluationCriteria, isManagementDateEnabled } = useContext(GlobalContext);

  const executive = useMemo(() => {
    // Ensure executiveId is treated as a number for consistent lookup
    return executives.find(exec => exec.id === Number(executiveId));
  }, [executives, executiveId]);

  const evaluationsForExecutive = useMemo(() => {
    // Explicitly convert evalItem.executiveId to a number for comparison
    return evaluations.filter(evalItem => Number(evalItem.executiveId) === Number(executiveId));
  }, [evaluations, executiveId]);

  if (!executive) {
    return <p>Ejecutivo no encontrado.</p>;
  }

  return (
    <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
      <h2>Historial de Evaluaciones para {executive.name}</h2>
      {evaluationsForExecutive.length === 0 ? (
        <p>No hay evaluaciones previas para este ejecutivo.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Fecha Evaluación</th>
              {isManagementDateEnabled && <th>Fecha Gestión</th>}
              <th>Tipo de Evaluación</th>
              {evaluationCriteria.map((criterion) => (
                <th key={`${criterion.name}-${criterion.type}`}>{criterion.name}</th>
              ))}
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {evaluationsForExecutive.map(evalItem => (
              <tr key={evalItem.id}>
                <td>{evalItem.evaluationDate}</td>
                {isManagementDateEnabled && <td>{evalItem.managementDate || 'N/A'}</td>}
                <td>{evalItem.evaluationType || 'N/A'}</td>
                {evaluationCriteria.map((criterion) => (
                  <td key={`${evalItem.id}-${criterion.name}-${criterion.type}`}>{evalItem.evaluationData[criterion.name] || 'N/A'}</td>
                ))}
                <td>{evalItem.comment || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>Cerrar Evaluaciones</button>
    </div>
  );
}

export default ExecutiveEvaluations;
