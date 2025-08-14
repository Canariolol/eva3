import React, { useContext, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';

function ExecutiveEvaluations({ executiveId, onClose }) {
  const { executives, evaluations, evaluationCriteria, sections } = useContext(GlobalContext);

  const executive = useMemo(() => {
    return executives.find(exec => exec.id === Number(executiveId));
  }, [executives, executiveId]);

  const evaluationsForExecutive = useMemo(() => {
    return evaluations.filter(evalItem => Number(evalItem.executiveId) === Number(executiveId));
  }, [evaluations, executiveId]);

  const hasManagementDate = useMemo(() => 
    evaluationsForExecutive.some(e => e.managementDate),
    [evaluationsForExecutive]
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const getSectionForCriterion = (criterionName) => {
    return sections.find(section => section.criteria?.includes(criterionName)) || null;
  };

  const calculateFinalScore = (evalItem) => {
    const scores = [];
    let isBinary = false;
    let isNumeric = false;

    // Use only the criteria present in the evaluationData
    const evaluatedCriteriaNames = Object.keys(evalItem.evaluationData);

    for (const criterionName of evaluatedCriteriaNames) {
      const score = evalItem.evaluationData[criterionName];
      if (score !== undefined && score !== null) {
        const section = getSectionForCriterion(criterionName);
        if (section) {
          if (section.scaleType === 'binary') {
            isBinary = true;
            scores.push(Number(score));
          } else if (section.scaleType === 'numeric' || !section.scaleType) { // Default to numeric
            isNumeric = true;
            scores.push(Number(score));
          }
        }
      }
    }

    if (scores.length === 0) {
      return 'N/A';
    }

    // Determine the scale type of the evaluation based on its section
    const evalSection = sections.find(s => s.name === evalItem.evaluationType);

    if (evalSection?.scaleType === 'binary') {
      const compliantCount = scores.filter(s => s === 10).length;
      const percentage = (compliantCount / scores.length) * 100;
      return `${percentage.toFixed(0)}%`;
    }

    // Default to average for numeric or mixed scales
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;
    return average.toFixed(2);
  };


  if (!executive) {
    return <p>Ejecutivo no encontrado.</p>;
  }

  // Get the unique criteria for the selected executive's evaluations
  const uniqueCriteriaForExecutive = useMemo(() => {
    const criteriaSet = new Set();
    evaluationsForExecutive.forEach(ev => {
        Object.keys(ev.evaluationData).forEach(criterion => criteriaSet.add(criterion));
    });
    return Array.from(criteriaSet);
  }, [evaluationsForExecutive]);

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
              {hasManagementDate && <th>Fecha Gestión</th>}
              <th>Tipo de Evaluación</th>
              {uniqueCriteriaForExecutive.map((criterionName) => (
                <th key={criterionName}>{criterionName}</th>
              ))}
              <th>Nota Final</th>
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {evaluationsForExecutive.map(evalItem => (
              <tr key={evalItem.id}>
                <td>{formatDate(evalItem.evaluationDate)}</td>
                {hasManagementDate && <td>{formatDate(evalItem.managementDate)}</td>}
                <td>{evalItem.evaluationType || 'N/A'}</td>
                {uniqueCriteriaForExecutive.map((criterionName) => {
                  const score = evalItem.evaluationData[criterionName];
                  const section = getSectionForCriterion(criterionName);
                  const isBinary = section?.scaleType === 'binary';

                  let displayValue;
                  if (score === undefined || score === null) {
                    displayValue = 'N/A';
                  } else if (isBinary) {
                    displayValue = Number(score) === 10 ? 'Cumple' : 'No Cumple';
                  } else {
                    displayValue = score;
                  }

                  return (
                    <td key={`${evalItem.id}-${criterionName}`}>
                      {displayValue}
                    </td>
                  );
                })}
                <td>{calculateFinalScore(evalItem)}</td>
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