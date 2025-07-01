import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import ScoreSelector from '../components/ScoreSelector';
import '../components/ScoreSelector.css';

const Evaluate = () => {
    const { executives, criteria, nonEvaluableCriteria, aptitudeSubsections, refreshData } = useGlobalContext();
    
    const [evaluationType, setEvaluationType] = useState('Aptitudes Transversales');
    const [groupedCriteria, setGroupedCriteria] = useState({});
    const [filteredNonEvaluableCriteria, setFilteredNonEvaluableCriteria] = useState([]);
    const [selectedExecutive, setSelectedExecutive] = useState('');
    const [scores, setScores] = useState({});
    const [nonEvaluableData, setNonEvaluableData] = useState({});
    const [managementDate, setManagementDate] = useState(new Date().toISOString().slice(0, 10));
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (executives.length > 0) {
            setSelectedExecutive(executives[0].Nombre);
        }
    }, [executives]);

    useEffect(() => {
        const filteredEvaluable = criteria.filter(c => c.section === evaluationType);
        const filteredNonEvaluable = nonEvaluableCriteria.filter(c => c.section === evaluationType);
        
        if (evaluationType === 'Aptitudes Transversales') {
            const subsectionNamesInOrder = [...aptitudeSubsections.map(s => s.name), 'Sin Subsección'];
            const groups = subsectionNamesInOrder.reduce((acc, subName) => {
                acc[subName] = [];
                return acc;
            }, {});

            filteredEvaluable.forEach(c => {
                const groupName = c.subsection || 'Sin Subsección';
                if (groups[groupName]) {
                    groups[groupName].push(c);
                } else {
                    if(!groups['Sin Subsección']) groups['Sin Subsección'] = [];
                    groups['Sin Subsección'].push(c);
                }
            });
            setGroupedCriteria(groups);
        } else {
            setGroupedCriteria({ 'Criterios': filteredEvaluable });
        }

        setFilteredNonEvaluableCriteria(filteredNonEvaluable);
        
        const initialScores = {};
        filteredEvaluable.forEach(c => { initialScores[c.name] = 5; });
        setScores(initialScores);

        const initialNonEvaluableData = {};
        filteredNonEvaluable.forEach(c => {
            initialNonEvaluableData[c.name] = (c.inputType === 'select' && c.options?.length > 0) ? c.options[0] : '';
        });
        setNonEvaluableData(initialNonEvaluableData);

    }, [evaluationType, criteria, nonEvaluableCriteria, aptitudeSubsections]);
  
    const handleScoreChange = (criterionName, value) => setScores(prev => ({ ...prev, [criterionName]: Number(value) }));
    const handleNonEvaluableDataChange = (criterionName, value) => setNonEvaluableData(prev => ({ ...prev, [criterionName]: value }));

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
        if (Object.keys(scores).length > 0 && !allScoresValid) {
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
            ...(evaluationType === 'Calidad de Desempeño' && { managementDate: new Date(managementDate) })
        };
        
        try {
            await addDoc(collection(db, 'evaluations'), evaluationData);
            await refreshData();
            setMessage('¡Evaluación guardada con éxito!');
            
            const initialScores = {};
            Object.values(groupedCriteria).flat().forEach(c => { initialScores[c.name] = 5; });
            setScores(initialScores);

            const initialNonEvaluable = {};
            filteredNonEvaluableCriteria.forEach(c => { initialNonEvaluable[c.name] = (c.inputType === 'select' && c.options?.length > 0) ? c.options[0] : ''; });
            setNonEvaluableData(initialNonEvaluable);

        } catch (error) {
            console.error("Error saving evaluation: ", error);
            setMessage('Hubo un error al guardar la evaluación.');
        } finally {
            setIsSubmitting(false);
        }
    };
  
    if (executives.length === 0) return (<div><h1>Faltan Datos</h1><p>Añade ejecutivos y criterios en <b>Configuración</b>.</p></div>);

    return (
        <div className="card" style={{maxWidth: '800px', margin: 'auto'}}>
            <h4 className="card-title card-title-primary">Registrar Evaluación</h4>
            <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group"><label>Ejecutivo</label><select className="form-control" value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)}>{executives.map(e => <option key={e.id} value={e.Nombre}>{e.Nombre}</option>)}</select></div>
                <div className="form-group"><label>Tipo de Evaluación</label><select className="form-control" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)}><option value="Aptitudes Transversales">Aptitudes Transversales</option><option value="Calidad de Desempeño">Calidad de Desempeño</option></select></div>
                {evaluationType === 'Calidad de Desempeño' && (<div className="form-group"><label>Fecha de gestión</label><input className="form-control" type="date" value={managementDate} onChange={e => setManagementDate(e.target.value)} /></div>)}
                
                {filteredNonEvaluableCriteria.map((c) => (
                    <div className="form-group" key={c.id}>
                    <label>{c.name}</label>
                    {c.inputType === 'select' ? (
                        <select className="form-control" value={nonEvaluableData[c.name] || ''} onChange={(e) => handleNonEvaluableDataChange(c.name, e.target.value)}>
                        {c.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input type="text" className="form-control" value={nonEvaluableData[c.name] || ''} onChange={(e) => handleNonEvaluableDataChange(c.name, e.target.value)} />
                    )}
                    </div>
                ))}
                </div>
                
                <hr style={{margin: '2rem 0'}} />
                
                {Object.entries(groupedCriteria).map(([groupName, criteriaList], groupIndex) => (
                    criteriaList.length > 0 && (
                        <div key={groupName}>
                            {evaluationType === 'Aptitudes Transversales' && <h4>{groupName}</h4>}
                            {criteriaList.map((c, index) => (
                                <div className="form-group" key={c.id}>
                                    <label>{index + 1}. {c.name}</label>
                                    <ScoreSelector value={scores[c.name] || 5} onChange={(score) => handleScoreChange(c.name, score)} />
                                </div>
                            ))}
                            {evaluationType === 'Aptitudes Transversales' && groupIndex < Object.values(groupedCriteria).filter(list => list.length > 0).length - 1 && (
                                <hr style={{ margin: '2.5rem 0', border: '1px solid #eee' }} />
                            )}
                        </div>
                    )
                ))}

                {Object.values(groupedCriteria).every(list => list.length === 0) && <p>No hay criterios para este tipo de evaluación.</p>}

                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{width: '100%'}}>{isSubmitting ? 'Guardando...' : 'Guardar Evaluación'}</button>
                {message && <p style={{marginTop: '1rem', textAlign: 'center'}}>{message}</p>}
            </form>
        </div>
    );
};

export default Evaluate;
