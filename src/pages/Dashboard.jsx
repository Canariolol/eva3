import React, { useState, useContext, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';

function Dashboard() {
  const { evaluations, evaluationCriteria, executives } = useContext(GlobalContext);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getExecutiveName = (id) => {
    const executive = executives.find(exec => exec.id === parseInt(id));
    return executive ? executive.name : 'Desconocido';
  };

  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations;
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(evalItem => {
        const evalDate = evalItem.managementDate !== 'N/A' ? new Date(evalItem.managementDate) : new Date(evalItem.evaluationDate);
        return evalDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); 
      filtered = filtered.filter(evalItem => {
        const evalDate = evalItem.managementDate !== 'N/A' ? new Date(evalItem.managementDate) : new Date(evalItem.evaluationDate);
        return evalDate < end;
      });
    }
    return filtered.sort((a, b) => {
        const dateA = a.managementDate !== 'N/A' ? new Date(a.managementDate) : new Date(a.evaluationDate);
        const dateB = b.managementDate !== 'N/A' ? new Date(b.managementDate) : new Date(b.evaluationDate);
        return dateA - dateB;
    });
  }, [evaluations, startDate, endDate]);

  return (
    <div>
      <h1>Dashboard de Desempeño</h1>

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
        <label htmlFor="start-date">Desde:</label>
        <input
          type="date"
          id="start-date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor="end-date">Hasta:</label>
        <input
          type="date"
          id="end-date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '20px' }}>
        <div style={{ flex: '1 1 45%', minWidth: '350px' }}>
          <h2>Progreso General por Criterio</h2>
        </div>

        <div style={{ flex: '1 1 45%', minWidth: '350px' }}>
          <h2>Comparativa de Ejecutivos en el Tiempo</h2>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
