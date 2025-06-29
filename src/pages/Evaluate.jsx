import React, { useState, useContext, useEffect, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { useLocation } from 'react-router-dom';

function Evaluate() {
  const { executives, evaluationCriteria, evaluations, setEvaluations, isManagementDateEnabled } = useContext(GlobalContext);
  const location = useLocation();
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [evaluationType, setEvaluationType] = useState(null); // New state for evaluation type
  const [evaluationData, setEvaluationData] = useState({});
  const [comment, setComment] = useState('');
  const [managementDate, setManagementDate] = useState('');

  // Filter criteria based on selected evaluation type
  const filteredEvaluationCriteria = useMemo(() => {
    return evaluationCriteria.filter(
      (criterion) => criterion.type === evaluationType
    );
  }, [evaluationCriteria, evaluationType]);

  useEffect(() => {
    if (location.state && location.state.executiveId) {
      setSelectedExecutiveId(location.state.executiveId);
      // Removed: window.history.replaceState({}, document.title); // This was clearing the state
    }
    // Check for evaluationType in location.state and set it
    if (location.state && location.state.evaluationType) {
      setEvaluationType(location.state.evaluationType);
      // Optionally, clear evaluationType from state if it's meant for a single use
      // window.history.replaceState({}, document.title); // This would clear all state, maybe not desired if executiveId is also there
    }
  }, [location.state]);

  useEffect(() => {
    // Initialize evaluationData when selectedExecutiveId or filteredEvaluationCriteria change
    const initialEvaluation = {};
    filteredEvaluationCriteria.forEach(criterion => {
      initialEvaluation[criterion.name] = '1'; // Initialize with '1' for number input/slider
    });
    setEvaluationData(initialEvaluation);
    setComment('');
    setManagementDate('');
  }, [selectedExecutiveId, filteredEvaluationCriteria, evaluationType]); // Added evaluationType to dependencies

  const handleExecutiveChange = (e) => {
    setSelectedExecutiveId(parseInt(e.target.value)); // Convert to integer here
    setEvaluationType(null); // Reset evaluation type when executive changes
  };

  const handleCriterionChange = (criterionName, value) => {
    setEvaluationData(prevData => ({
      ...prevData,
      [criterionName]: value,
    }));
  };

  const handleSubmitEvaluation = (e) => {
    e.preventDefault();
    if (!selectedExecutiveId) {
      alert('Por favor, selecciona un ejecutivo para evaluar.');
      return;
    }
    if (!evaluationType) {
      alert('Por favor, selecciona un tipo de evaluación.');
      return;
    }
    if (filteredEvaluationCriteria.length === 0) {
      alert(`No hay criterios de evaluación configurados para '${evaluationType}'. Por favor, ve a la pestaña de Configuración.`);
      return;
    }
    if (isManagementDateEnabled && !managementDate) {
      alert('Por favor, selecciona la Fecha de Gestión.');
      return;
    }

    for (const criterion of filteredEvaluationCriteria) {
      const score = parseFloat(evaluationData[criterion.name]);
      if (isNaN(score) || score < 1 || score > 10) {
        alert(`Por favor, ingresa una puntuación válida entre 1 y 10 para el criterio '${criterion.name}'.`);
        return;
      }
    }

    const newEvaluation = {
      id: Date.now(),
      executiveId: selectedExecutiveId, // selectedExecutiveId is now always a number
      evaluationDate: new Date().toLocaleDateString(),
      managementDate: isManagementDateEnabled ? managementDate : 'N/A',
      evaluationType: evaluationType, // Store the evaluation type
      evaluationData: evaluationData,
      comment: comment,
    };

    setEvaluations(prevEvaluations => [...prevEvaluations, newEvaluation]);
    alert('Evaluación guardada exitosamente!');

    if (!location.state || !location.state.executiveId) {
        setSelectedExecutiveId('');
    }
    setEvaluationType(null); // Reset evaluation type after submission
    setEvaluationData({});
    setComment('');
    setManagementDate('');
  };

  const getExecutiveName = (id) => {
    const executive = executives.find(exec => exec.id === parseInt(id));
    return executive ? executive.name : 'Desconocido';
  };

  const evaluationsForSelectedExecutive = evaluations.filter(evalItem => parseInt(evalItem.executiveId) === selectedExecutiveId);

  return (
    <div>
      <h1>Evaluar Ejecutivos</h1>

      <form onSubmit={handleSubmitEvaluation}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="executive-select">Seleccionar Ejecutivo:</label>
          <select
            id="executive-select"
            value={selectedExecutiveId}
            onChange={handleExecutiveChange}
            required
          >
            <option value="">-- Selecciona un ejecutivo --</option>
            {executives.map(executive => (
              <option key={executive.id} value={executive.id}>
                {executive.name}
              </option>
            ))}
          </select>
        </div>

        {selectedExecutiveId && !evaluationType && (
          <div style={{ marginBottom: '20px' }}>
            <h2>Selecciona el Tipo de Evaluación:</h2>
            <button type="button" onClick={() => setEvaluationType('Calidad de Desempeño')}
                    style={{ marginRight: '10px', padding: '10px 20px', fontSize: '16px' }}>
              Calidad de Desempeño
            </button>
            <button type="button" onClick={() => setEvaluationType('Aptitudes Transversales')}
                    style={{ padding: '10px 20px', fontSize: '16px' }}>
              Aptitudes Transversales
            </button>
          </div>
        )}

        {selectedExecutiveId && evaluationType && (filteredEvaluationCriteria.length > 0 || isManagementDateEnabled) && (
          <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Evaluación de {evaluationType} para {getExecutiveName(selectedExecutiveId)}</h3>
            
            {isManagementDateEnabled && (
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <label htmlFor="management-date" style={{ marginRight: '10px', minWidth: '150px', textAlign: 'left' }}>Fecha de Gestión:</label>
                <input
                  type="date"
                  id="management-date"
                  value={managementDate}
                  onChange={(e) => setManagementDate(e.target.value)}
                  required={isManagementDateEnabled}
                  style={{ flexGrow: 1 }}
                />
              </div>
            )}

            {filteredEvaluationCriteria.map(criterion => (
              <div key={criterion.name} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '10px', minWidth: '150px', textAlign: 'left' }}>{criterion.name}:</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={evaluationData[criterion.name] || '1'}
                  onChange={(e) => handleCriterionChange(criterion.name, e.target.value)}
                  style={{ flexGrow: 1, marginRight: '10px' }}
                />
                <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{evaluationData[criterion.name] || '1'}</span>
              </div>
            ))}
            {filteredEvaluationCriteria.length === 0 && !isManagementDateEnabled && (
                <p>No hay criterios de evaluación para este tipo. Por favor, ve a la pestaña de Configuración para añadir criterios.</p>
            )}
            <div style={{ marginTop: '15px' }}>
              <label htmlFor="comment">Comentarios Adicionales:</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                cols="50"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              ></textarea>
            </div>
            <button type="submit" style={{ marginTop: '20px' }}>Guardar Evaluación</button>
          </div>
        )}

        {selectedExecutiveId && evaluationType && filteredEvaluationCriteria.length === 0 && !isManagementDateEnabled && (
          <p>No hay criterios de evaluación configurados para este tipo. Por favor, ve a la pestaña de Configuración para añadir criterios.</p>
        )}
      </form>

      {selectedExecutiveId && evaluationsForSelectedExecutive.length > 0 && (
        <div>
          <h2>Historial de Evaluaciones para {getExecutiveName(selectedExecutiveId)}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr>
                <th>Fecha Evaluación</th>
                {isManagementDateEnabled && <th>Fecha Gestión</th>}
                <th>Tipo de Evaluación</th>
                {evaluationCriteria.map((criterion, index) => (
                  <th key={`${criterion.name}-${criterion.type}`}>{criterion.name}</th>
                ))}
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              {evaluationsForSelectedExecutive.map(evalItem => (
                <tr key={evalItem.id}>
                  <td>{evalItem.evaluationDate}</td>
                  {isManagementDateEnabled && <td>{evalItem.managementDate || 'N/A'}</td>}
                  <td>{evalItem.evaluationType || 'N/A'}</td>
                  {evaluationCriteria.map((criterion, index) => (
                    <td key={`${evalItem.id}-${criterion.name}-${criterion.type}`}>{evalItem.evaluationData[criterion.name] || 'N/A'}</td>
                  ))}
                  <td>{evalItem.comment || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedExecutiveId && evaluationsForSelectedExecutive.length === 0 && (
        <p>No hay evaluaciones previas para este ejecutivo.</p>
      )}
    </div>
  );
}

export default Evaluate;
