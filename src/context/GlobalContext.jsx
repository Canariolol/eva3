import React, { createContext, useState, useEffect } from 'react';

export const GlobalContext = createContext();

const getInitialState = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

export const GlobalProvider = ({ children }) => {
  const [evaluationCriteria, setEvaluationCriteria] = useState(() => {
    const savedCriteria = getInitialState('evaluationCriteria', []);
    return savedCriteria.map(criterion => {
      if (typeof criterion === 'string') {
        // Convert old string format to new object format with a default type
        return { name: criterion, type: 'Calidad de Desempeño' };
      } else {
        // Ensure existing objects have a type, defaulting if missing
        return { ...criterion, type: criterion.type || 'Calidad de Desempeño' };
      }
    });
  });

  const [executiveFields, setExecutiveFields] = useState(() =>
    getInitialState('executiveFields', [
      { id: 'name', label: 'Nombre', type: 'text', required: true },
      { id: 'position', label: 'Cargo', type: 'text', required: true },
      { id: 'area', label: 'Área', type: 'text', required: true },
    ])
  );

  const [executives, setExecutives] = useState(() =>
    getInitialState('executives', [])
  );

  const [evaluations, setEvaluations] = useState(() =>
    getInitialState('evaluations', [])
  );

  const [isManagementDateEnabled, setIsManagementDateEnabled] = useState(() =>
    getInitialState('isManagementDateEnabled', false) // New state, default to false
  );

  useEffect(() => {
    localStorage.setItem('evaluationCriteria', JSON.stringify(evaluationCriteria));
  }, [evaluationCriteria]);

  useEffect(() => {
    localStorage.setItem('executiveFields', JSON.stringify(executiveFields));
  }, [executiveFields]);

  useEffect(() => {
    localStorage.setItem('executives', JSON.stringify(executives));
  }, [executives]);

  useEffect(() => {
    localStorage.setItem('evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('isManagementDateEnabled', JSON.stringify(isManagementDateEnabled));
  }, [isManagementDateEnabled]);

  return (
    <GlobalContext.Provider
      value={{
        evaluationCriteria,
        setEvaluationCriteria,
        executiveFields,
        setExecutiveFields,
        executives,
        setExecutives,
        evaluations,
        setEvaluations,
        isManagementDateEnabled,
        setIsManagementDateEnabled,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};