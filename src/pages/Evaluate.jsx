import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const Evaluate = () => {
  const [executives, setExecutives] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [evaluationType, setEvaluationType] = useState('Aptitudes Transversales');
  const [filteredCriteria, setFilteredCriteria] = useState([]);
  const [selectedExecutive, setSelectedExecutive] = useState('');
  const [selectedCriterionName, setSelectedCriterionName] = useState('');
  const [score, setScore] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
      const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
      const [executivesSnapshot, criteriaSnapshot] = await Promise.all([getDocs(executivesQuery), getDocs(criteriaQuery)]);
      
      const executivesList = executivesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const criteriaList = criteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setExecutives(executivesList);
      setCriteria(criteriaList);
      
      if (executivesList.length > 0) setSelectedExecutive(executivesList[0].Nombre);
      
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
    if (newFiltered.length > 0) setSelectedCriterionName(newFiltered[0].name);
    else setSelectedCriterionName('');
  }, [evaluationType, criteria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    const selectedCriterion = criteria.find(c => c.name === selectedCriterionName);
    if (!selectedExecutive || !selectedCriterion || score === '') {
      setMessage('Por favor, completa todos los campos.');
      setIsSubmitting(false);
      return;
    }
    try {
      await addDoc(collection(db, 'evaluations'), {
        executive: selectedExecutive,
        criterion: selectedCriterion.name,
        section: selectedCriterion.section,
        score: Number(score),
        date: serverTimestamp(),
      });
      setMessage('¡Evaluación guardada con éxito!');
      setScore(5);
    } catch (error) {
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
        <div className="form-group"><label>1. Tipo de Evaluación</label><select className="form-control" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)}><option value="Aptitudes Transversales">Aptitudes Transversales</option><option value="Calidad de Desempeño">Calidad de Desempeño</option></select></div>
        <div className="form-group"><label>2. Ejecutivo</label><select className="form-control" value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)}>{executives.map(e => <option key={e.id} value={e.Nombre}>{e.Nombre}</option>)}</select></div>
        <div className="form-group"><label>3. Criterio a Evaluar</label><select className="form-control" value={selectedCriterionName} onChange={(e) => setSelectedCriterionName(e.target.value)} disabled={filteredCriteria.length === 0}>{filteredCriteria.length > 0 ? (filteredCriteria.map(c => <option key={c.id} value={c.name}>{c.name}</option>)) : (<option>No hay criterios para este tipo</option>)}</select></div>
        <div className="form-group"><label>4. Puntaje (1-10)</label><input type="number" className="form-control" value={score} onChange={(e) => setScore(e.target.value)} min="1" max="10" /></div>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{width: '100%'}}>{isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}</button>
        {message && <p style={{marginTop: '1rem', textAlign: 'center'}}>{message}</p>}
      </form>
    </div>
  );
};

export default Evaluate;
