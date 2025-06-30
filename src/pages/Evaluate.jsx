import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const Evaluate = () => {
  // Estado de los datos cargados desde Firestore
  const [executives, setExecutives] = useState([]);
  const [criteria, setCriteria] = useState([]);
  
  // Estado del formulario
  const [evaluationType, setEvaluationType] = useState('Aptitudes Transversales');
  const [filteredCriteria, setFilteredCriteria] = useState([]);
  
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [selectedCriterionName, setSelectedCriterionName] = useState('');
  const [score, setScore] = useState(5);
  
  // Estado de la UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar ejecutivos y criterios al montar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar Ejecutivos
        const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
        const executivesSnapshot = await getDocs(executivesQuery);
        const executivesList = executivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExecutives(executivesList);
        if (executivesList.length > 0) {
          // El valor del select debe ser el campo 'Nombre'
          setSelectedExecutive(executivesList[0].Nombre);
        }

        // Cargar Criterios
        const criteriaQuery = query(collection(db, 'criteria'), orderBy('section'), orderBy('name'));
        const criteriaSnapshot = await getDocs(criteriaQuery);
        const criteriaList = criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCriteria(criteriaList);

      } catch (err) {
        console.error(err);
        setError('Error al cargar los datos. Asegúrate de añadir ejecutivos y criterios en la pestaña de Configuración.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Filtrar criterios cuando el tipo de evaluación o la lista de criterios cambia
  useEffect(() => {
    const newFilteredCriteria = criteria.filter(c => c.section === evaluationType);
    setFilteredCriteria(newFilteredCriteria);
    if (newFilteredCriteria.length > 0) {
      setSelectedCriterionName(newFilteredCriteria[0].name);
    } else {
      setSelectedCriterionName('');
    }
  }, [evaluationType, criteria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const selectedCriterionObject = criteria.find(c => c.name === selectedCriterionName);

    if (!selectedExecutive || !selectedCriterionObject || score === '') {
      setMessage('Por favor, completa todos los campos.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'evaluations'), {
        executive: selectedExecutive, // Guardamos el nombre del ejecutivo
        criterion: selectedCriterionObject.name,
        section: selectedCriterionObject.section,
        score: Number(score),
        date: serverTimestamp(),
      });
      setMessage('¡Evaluación guardada con éxito!');
      setScore(5);
    } catch (error) {
      console.error("Error al guardar la evaluación: ", error);
      setMessage('Hubo un error al guardar la evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Cargando formulario...</p>;
  if (error) return <p>{error}</p>;
  if (executives.length === 0 || criteria.length === 0) {
    return <p>Por favor, añade primero ejecutivos y criterios en la pestaña de <b>Configuración</b>.</p>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1>Registrar Evaluación</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>1. Selecciona el Tipo de Evaluación</label>
          <select value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)} style={selectStyle}>
            <option value="Aptitudes Transversales">Aptitudes Transversales</option>
            <option value="Calidad de Desempeño">Calidad de Desempeño</option>
          </select>
        </div>

        <div>
          <label>2. Selecciona el Ejecutivo</label>
          <select value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)} style={selectStyle}>
            {executives.map(e => <option key={e.id} value={e.Nombre}>{e.Nombre}</option>)}
          </select>
        </div>
        
        <div>
          <label>3. Selecciona el Criterio a Evaluar</label>
          <select 
            value={selectedCriterionName} 
            onChange={(e) => setSelectedCriterionName(e.target.value)} 
            style={selectStyle}
            disabled={filteredCriteria.length === 0}
          >
            {filteredCriteria.length > 0 ? (
              filteredCriteria.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
            ) : (
              <option>No hay criterios para este tipo</option>
            )}
          </select>
        </div>

        <div>
          <label>4. Ingresa el Puntaje (1-10)</label>
          <input 
            type="number" 
            value={score} 
            onChange={(e) => setScore(e.target.value)} 
            min="1" 
            max="10" 
            style={inputStyle}
          />
        </div>

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

// Estilos
const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle };
const buttonStyle = { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' };

export default Evaluate;
