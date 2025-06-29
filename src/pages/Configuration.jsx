import React, { useState, useContext } from 'react';
import { GlobalContext } from '../context/GlobalContext';

function Configuration() {
  const { evaluationCriteria, setEvaluationCriteria, executiveFields, setExecutiveFields, isManagementDateEnabled, setIsManagementDateEnabled } = useContext(GlobalContext);
  const [newCriterion, setNewCriterion] = useState('');
  const [newCriterionType, setNewCriterionType] = useState('Calidad de Desempeño'); // New state for criterion type
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const handleAddCriterion = (e) => {
    e.preventDefault();
    if (newCriterion.trim() !== '') {
      const criterionExists = evaluationCriteria.some(
        (criterion) =>
          criterion.name.toLowerCase() === newCriterion.trim().toLowerCase() &&
          criterion.type === newCriterionType
      );

      if (criterionExists) {
        alert('Este criterio ya existe para el tipo de evaluación seleccionado.');
        return;
      }

      setEvaluationCriteria([...evaluationCriteria, { name: newCriterion.trim(), type: newCriterionType }]);
      setNewCriterion('');
      setNewCriterionType('Calidad de Desempeño'); // Reset to default
    }
  };

  const handleRemoveCriterion = (criterionToRemove) => {
    setEvaluationCriteria(evaluationCriteria.filter(criterion => criterion.name !== criterionToRemove.name || criterion.type !== criterionToRemove.type));
  };

  const handleAddField = (e) => {
    e.preventDefault();
    if (newFieldLabel.trim() !== '') {
      const newField = {
        id: newFieldLabel.trim().toLowerCase().replace(/\s/g, '-'),
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: newFieldRequired,
      };
      setExecutiveFields([...executiveFields, newField]);
      setNewFieldLabel('');
      setNewFieldType('text');
      setNewFieldRequired(false);
    }
  };

  const handleRemoveField = (id) => {
    // Prevent removing default fields (name, position, area)
    if (['name', 'position', 'area'].includes(id)) {
      alert('No puedes eliminar los campos por defecto (Nombre, Cargo, Área).');
      return;
    }
    setExecutiveFields(executiveFields.filter(field => field.id !== id));
  };

  const handleToggleManagementDate = () => {
    setIsManagementDateEnabled(!isManagementDateEnabled);
  };

  // Filter criteria by type
  const calidadDesempenoCriteria = evaluationCriteria.filter(c => c.type === 'Calidad de Desempeño');
  const aptitudesTransversalesCriteria = evaluationCriteria.filter(c => c.type === 'Aptitudes Transversales');

  return (
    <div>
      <h1>Configuración de la Plataforma</h1>

      <h2>Criterios de Evaluación</h2>
      <form onSubmit={handleAddCriterion} className="config-form">
        <input
          type="text"
          value={newCriterion}
          onChange={(e) => setNewCriterion(e.target.value)}
          placeholder="Nuevo criterio de evaluación"
        />
        <select value={newCriterionType} onChange={(e) => setNewCriterionType(e.target.value)}>
          <option value="Calidad de Desempeño">Calidad de Desempeño</option>
          <option value="Aptitudes Transversales">Aptitudes Transversales</option>
        </select>
        <button type="submit" className="small-button">Agregar Criterio</button>
      </form>

      <h3 className="config-section">Criterios de Calidad de Desempeño:</h3>
      {calidadDesempenoCriteria.length === 0 ? (
        <p>No hay criterios de Calidad de Desempeño agregados aún.</p>
      ) : (
        <ul className="config-section-list">
          {calidadDesempenoCriteria.map((criterion, index) => (
            <li key={index} className="config-list-item">
              {criterion.name}
              <button onClick={() => handleRemoveCriterion(criterion)} className="icon-button">
                &times; {/* Times symbol for a simple close/delete icon */}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="config-section">Criterios de Aptitudes Transversales:</h3>
      {aptitudesTransversalesCriteria.length === 0 ? (
        <p>No hay criterios de Aptitudes Transversales agregados aún.</p>
      ) : (
        <ul className="config-section-list">
          {aptitudesTransversalesCriteria.map((criterion, index) => (
            <li key={index} className="config-list-item">
              {criterion.name}
              <button onClick={() => handleRemoveCriterion(criterion)} className="icon-button">
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Campos para Ejecutivos</h2>
      <form onSubmit={handleAddField} className="config-form">
        <input
          type="text"
          value={newFieldLabel}
          onChange={(e) => setNewFieldLabel(e.target.value)}
          placeholder="Etiqueta del campo (ej. Edad)"
        />
        <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="date">Fecha</option>
        </select>
        <label className="small-checkbox-label">
          <input
            type="checkbox"
            checked={newFieldRequired}
            onChange={(e) => setNewFieldRequired(e.target.checked)}
          />
          Requerido
        </label>
        <button type="submit" className="small-button">Agregar Campo</button>
      </form>

      <h3 className="config-section">Campos Configurados:</h3>
      {executiveFields.length === 0 ? (
        <p>No hay campos configurados aún.</p>
      ) : (
        <ul className="config-section-list">
          {executiveFields.map((field) => (
            <li key={field.id} className="config-list-item">
              {field.label} ({field.type}) {field.required && '(Requerido)'}
              {(field.id !== 'name' && field.id !== 'position' && field.id !== 'area') && (
                <button onClick={() => handleRemoveField(field.id)} className="icon-button">
                  &times;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2>Opciones de Evaluación</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <label htmlFor="management-date-toggle">Activar Campo de Fecha de Gestión:</label>
        <input
          type="checkbox"
          id="management-date-toggle"
          checked={isManagementDateEnabled}
          onChange={handleToggleManagementDate}
        />
      </div>
    </div>
  );
}

export default Configuration;
