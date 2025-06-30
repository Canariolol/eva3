import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import ScoreSelector from '../components/ScoreSelector';
import '../components/ScoreSelector.css';

const Evaluate = () => {
  const [executives, setExecutives] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
  const [evaluationType, setEvaluationType] = useState('Aptitudes Transversales');
  const [filteredCriteria, setFilteredCriteria] = useState([]);
  const [filteredNonEvaluableCriteria, setFilteredNonEvaluableCriteria] = useState([]);
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [scores, setScores] = useState({});
  const [nonEvaluableData, setNonEvaluableData] = useState({});
  const [managementDate, setManagementDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
      const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
      const nonEvaluableCriteriaQuery = query(collection(db, 'nonEvaluableCriteria'), orderBy('name'));
      const [executivesSnapshot, criteriaSnapshot, nonEvaluableCriteriaSnapshot] = await Promise.all([
        getDocs(executivesQuery), 
        getDocs(criteriaQuery),
        getDocs(nonEvaluableCriteriaQuery)
      ]);
      
      const executivesList = executivesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const criteriaList = criteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const nonEvaluableCriteriaList = nonEvaluableCriteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setExecutives(executivesList);
      setCriteria(criteriaList);
      setNonEvaluableCriteria(nonEvaluableCriteriaList);
      
      if (executivesList.length > 0) {
        setSelectedExecutive(executivesList[0].Nombre);
      }
      
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos. Asegúrate de añadir ejecutivos y criterios en Configuración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const newFiltered = criteria.filter(c => c.section === evaluationType);
    setFilteredCriteria(newFiltered);
    
    const initialScores = {};
    newFiltered.forEach(c => {
      initialScores[c.name] = 5; // Default score
    });
    setScores(initialScores);

    const newFilteredNonEvaluable = nonEvaluableCriteria.filter(c => c.section === evaluationType);
    setFilteredNonEvaluableCriteria(newFilteredNonEvaluable);

    const initialNonEvaluableData = {};
    newFilteredNonEvaluable.forEach(c => {
        if (c.inputType === 'select' && c.options && c.options.length > 0) {
            initialNonEvaluableData[c.name] = c.options[0];
        } else {
            initialNonEvaluableData[c.name] = '';
        }
    });
    setNonEvaluableData(initialNonEvaluableData);

  }, [evaluationType, criteria, nonEvaluableCriteria]);
  
  const handleScoreChange = (criterionName, value) => {
    setScores(prevScores => ({
      ...prevScores,
      [criterionName]: Number(value)
    }));
  };

  const handleNonEvaluableDataChange = (criterionName, value) => {
    setNonEvaluableData(prevData => ({
      ...prevData,
      [criterionName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage('');

    if (!selectedExecutive) {
      setMessage('Por favor, selecciona un ejecutivo.');
      setIsSubmitting(false);
      return;
    }
    
    const allScoresValid = Object.values(scores).every(s => s >= 1 && s <= 10);
    if (Object.keys(scores).length === 0 && filteredCriteria.length > 0) {
        setMessage('No hay criterios para evaluar.');
        setIsSubmitting(false);
        return;
    }
    if (!allScoresValid) {
        setMessage('Por favor, asegúrate de que todos los puntajes estén entre 1 y 10.');
        setIsSubmitting(false);
        return;
    }

    let evaluationData = {
      executive: selectedExecutive,
      section: evaluationType,
      scores: scores,
      nonEvaluableData: nonEvaluableData,
      evaluationDate: serverTimestamp(),
    }

    if (evaluationType === 'Calidad de Desempeño') {
      evaluationData.managementDate = new Date(managementDate);
    }
    
    try {
      await addDoc(collection(db, 'evaluations'), evaluationData);
      setMessage('¡Evaluación guardada con éxito!');
      
      const initialScores = {};
      filteredCriteria.forEach(c => {
          initialScores[c.name] = 5;
      });
      setScores(initialScores);

      const initialNonEvaluableData = {};
      filteredNonEvaluableCriteria.forEach(c => {
        if (c.inputType === 'select' && c.options && c.options.length > 0) {
            initialNonEvaluableData[c.name] = c.options[0];
        } else {
            initialNonEvaluableData[c.name] = '';
        }
      });
      setNonEvaluableData(initialNonEvaluableData);

    } catch (error) {
      console.error("Error saving evaluation: ", error);
      setMessage('Hubo un error al guardar la evaluación.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <h1>Cargando...</h1>;
  if (error) return <h1>{error}</h1>;
  if (executives.length === 0 || criteria.length === 0) return (<div><h1>Faltan Datos</h1><p>Añade ejecutivos y criterios en <b>Configuración</b>.</p></div>);

  return (
    <div className="card" style={{maxWidth: '600px', margin: 'auto'}}>
      <h2>Registrar Evaluación</h2>
      <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
        <div className="form-group"><label>Ejecutivo</label><select className="form-control" value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)}>{executives.map(e => <option key={e.id} value={e.Nombre}>{e.Nombre}</option>)}</select></div>
        <div className="form-group"><label>Tipo de Evaluación</label><select className="form-control" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)}><option value="Aptitudes Transversales">Aptitudes Transversales</option><option value="Calidad de Desempeño">Calidad de Desempeño</option></select></div>
        {evaluationType === 'Calidad de Desempeño' && (<div className="form-group"><label>Fecha de gestión</label><input className="form-control" type="date" value={managementDate} onChange={e => setManagementDate(e.target.value)} /></div>)}
        
        <hr style={{margin: '2rem 0'}} />

        {filteredNonEvaluableCriteria.length > 0 && (
          filteredNonEvaluableCriteria.map((c) => (
            <div className="form-group" key={c.id}>
              <label>{c.name}</label>
              {c.inputType === 'select' ? (
                <select 
                  className="form-control"
                  value={nonEvaluableData[c.name] || ''}
                  onChange={(e) => handleNonEvaluableDataChange(c.name, e.target.value)}
                >
                  {c.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={nonEvaluableData[c.name] || ''}
                  onChange={(e) => handleNonEvaluableDataChange(c.name, e.target.value)}
                />
              )}
            </div>
          ))
        )}
        
        {filteredCriteria.length > 0 ? (
          filteredCriteria.map((c, index) => (
            <div className="form-group" key={c.id}>
              <label>{index + 1}. {c.name}</label>
              <ScoreSelector 
                value={scores[c.name] || 5}
                onChange={(score) => handleScoreChange(c.name, score)}
              />
            </div>
          ))
        ) : <p>No hay criterios para este tipo de evaluación.</p>}

        <button type="submit" disabled={isSubmitting || (filteredCriteria.length === 0 && filteredNonEvaluableCriteria.length === 0)} className="btn btn-primary" style={{width: '100%'}}>{isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}</button>
        {message && <p style={{marginTop: '1rem', textAlign: 'center'}}>{message}</p>}
      </form>
    </div>
  );
};

export default Evaluate;
