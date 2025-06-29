import React, { useState, useContext, useEffect } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import ExecutiveEvaluations from '../components/ExecutiveEvaluations'; // Import the new component

function Team() {
  const { executiveFields, executives, setExecutives } = useContext(GlobalContext);
  const [showAddExecutiveForm, setShowAddExecutiveForm] = useState(false);
  const [selectedExecutiveForEvaluation, setSelectedExecutiveForEvaluation] = useState(null); // New state to hold executiveId for evaluation display
  const [newExecutiveData, setNewExecutiveData] = useState(() => {
    const initialData = {};
    executiveFields.forEach(field => {
      initialData[field.id] = '';
    });
    return initialData;
  });

  useEffect(() => {
    const resetData = {};
    executiveFields.forEach(field => {
      resetData[field.id] = '';
    });
    setNewExecutiveData(resetData);
  }, [executiveFields]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExecutiveData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddExecutive = (e) => {
    e.preventDefault();
    for (const field of executiveFields) {
      if (field.required && !newExecutiveData[field.id].trim()) {
        alert(`El campo '${field.label}' es requerido.`);
        return;
      }
    }

    setExecutives(prevExecutives => [...prevExecutives, { id: Date.now(), ...newExecutiveData }]);
    const resetData = {};
    executiveFields.forEach(field => {
      resetData[field.id] = '';
    });
    setNewExecutiveData(resetData);
    setShowAddExecutiveForm(false);
  };

  const handleViewEvaluations = (executiveId) => {
    setSelectedExecutiveForEvaluation(executiveId);
  };

  const handleCloseEvaluations = () => {
    setSelectedExecutiveForEvaluation(null);
  };

  return (
    <div>
      <h1>Equipo de Trabajo</h1>

      {!selectedExecutiveForEvaluation && (
        <>
          <h2>Ejecutivos Agregados:</h2>
          {executives.length === 0 ? (
            <p>No hay ejecutivos agregados aún.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', marginBottom: '20px' }}>
              <thead>
                <tr>
                  {executiveFields.map(field => (
                    <th key={field.id} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                      {field.label}
                    </th>
                  ))}
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {executives.map(executive => (
                  <tr key={executive.id}>
                    {executiveFields.map(field => (
                      <td key={`${executive.id}-${field.id}`} style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {executive[field.id]}
                      </td>
                    ))}
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button onClick={() => handleViewEvaluations(executive.id)}>
                        Ver Evaluaciones
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button onClick={() => setShowAddExecutiveForm(!showAddExecutiveForm)} style={{ marginBottom: '20px' }}>
            {showAddExecutiveForm ? 'Cancelar / Ocultar Formulario' : 'Agregar Nuevo Ejecutivo'}
          </button>

          {showAddExecutiveForm && (
            <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h2>Agregar Nuevo Ejecutivo</h2>
              <form onSubmit={handleAddExecutive}> 
                {executiveFields.map(field => (
                  <div key={field.id}> 
                    <label htmlFor={field.id} style={{ marginRight: '10px' }}>{field.label}:</label>
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      value={newExecutiveData[field.id]}
                      onChange={handleInputChange}
                      required={field.required}
                    />
                  </div>
                ))}
                <button type="submit" style={{ marginTop: '15px' }}>Guardar Ejecutivo</button>
              </form>
            </div>
          )}
        </>
      )}

      {selectedExecutiveForEvaluation && (
        <ExecutiveEvaluations executiveId={selectedExecutiveForEvaluation} onClose={handleCloseEvaluations} />
      )}
    </div>
  );
}

export default Team;
