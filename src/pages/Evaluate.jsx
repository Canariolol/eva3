import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { db } from '../firebase';
import { addDoc, doc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import DynamicScoreSelector from '../components/DynamicScoreSelector'; // Importar
import LabelWithDescription from '../components/LabelWithDescription';
import '../components/ScoreSelector.css';

// Función para convertir hex a rgba
const hexToRgba = (hex, alpha = 0.1) => {
    if (!hex || typeof hex !== 'string') return `rgba(0, 123, 255, ${alpha})`; // Color por defecto
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


const Evaluate = () => {
    const { executives, criteria, nonEvaluableCriteria, evaluationSections, aptitudeSubsections, evaluations, refreshData } = useGlobalContext();
    const [searchParams] = useSearchParams();
    
    const [evaluationId, setEvaluationId] = useState(null);
    const [evaluationType, setEvaluationType] = useState('');
    const [groupedCriteria, setGroupedCriteria] = useState({});
    const [filteredNonEvaluableCriteria, setFilteredNonEvaluableCriteria] = useState([]);
    const [selectedExecutive, setSelectedExecutive] = useState('');
    const [scores, setScores] = useState({});
    const [nonEvaluableData, setNonEvaluableData] = useState({});
    const [managementDate, setManagementDate] = useState(new Date().toISOString().slice(0, 10));
    const [observations, setObservations] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const id = searchParams.get('evaluationId');
        if (id && evaluations.length > 0) {
            const existingEvaluation = evaluations.find(e => e.id === id);
            if (existingEvaluation) {
                setEvaluationId(id);
                setEvaluationType(existingEvaluation.section);
                setSelectedExecutive(existingEvaluation.executive);
                setScores(existingEvaluation.scores || {});
                setNonEvaluableData(existingEvaluation.nonEvaluableData || {});
                setObservations(existingEvaluation.observations || '');
                if (existingEvaluation.managementDate) {
                    setManagementDate(new Date(existingEvaluation.managementDate.seconds * 1000).toISOString().slice(0,10));
                }
            }
        } else {
            setEvaluationId(null);
            if (evaluationSections.length > 0 && !evaluationType) {
                setEvaluationType(evaluationSections[0].name);
            }
            if (executives.length > 0 && !selectedExecutive) {
                setSelectedExecutive(executives[0].Nombre);
            }
        }
    }, [searchParams, evaluations, executives, evaluationSections]);

    useEffect(() => {
        if (!evaluationType) return;

        const filteredEvaluable = criteria.filter(c => c.section === evaluationType);
        const filteredNonEvaluable = nonEvaluableCriteria.filter(c => c.section === evaluationType);
        
        if (evaluationType === 'Aptitudes Transversales') {
            const subsectionNamesInOrder = [...aptitudeSubsections.map(s => s.name), 'Sin Subsección'];
            const groups = subsectionNamesInOrder.reduce((acc, subName) => ({ ...acc, [subName]: [] }), {});

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
        
        if (!evaluationId) {
            const initialScores = {};
            const selectedSection = evaluationSections.find(s => s.name === evaluationType);
            const defaultScore = selectedSection?.scaleType === 'binary' ? 10 : (selectedSection?.scaleType === 'percentage' ? 100 : 5);
            filteredEvaluable.forEach(c => { initialScores[c.name] = defaultScore; });
            setScores(initialScores);

            const initialNonEvaluableData = {};
            filteredNonEvaluable.forEach(c => {
                initialNonEvaluableData[c.name] = (c.inputType === 'select' && c.options?.length > 0) ? c.options[0] : '';
            });
            setNonEvaluableData(initialNonEvaluableData);
            setObservations('');
        }

    }, [evaluationType, criteria, nonEvaluableCriteria, aptitudeSubsections, evaluationId, evaluationSections]);
  
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

        const currentSection = evaluationSections.find(s => s.name === evaluationType);
        let evaluationData = {
            executive: selectedExecutive,
            section: evaluationType,
            scores: scores,
            nonEvaluableData: nonEvaluableData,
            observations: observations,
            ...(currentSection?.includeManagementDate && { managementDate: new Date(managementDate) })
        };
        
        try {
            if (evaluationId) {
                const docRef = doc(db, 'evaluations', evaluationId);
                await updateDoc(docRef, evaluationData);
                setMessage('¡Evaluación actualizada con éxito!');
            } else {
                evaluationData.evaluationDate = serverTimestamp();
                await addDoc(collection(db, 'evaluations'), evaluationData);
                setMessage('¡Evaluación guardada con éxito!');
            }
            await refreshData();
            
            if (!evaluationId) {
                const initialScores = {};
                const defaultScore = currentSection?.scaleType === 'binary' ? 10 : (currentSection?.scaleType === 'percentage' ? 100 : 5);
                Object.values(groupedCriteria).flat().forEach(c => { initialScores[c.name] = defaultScore; });
                setScores(initialScores);

                const initialNonEvaluable = {};
                filteredNonEvaluableCriteria.forEach(c => { initialNonEvaluable[c.name] = (c.inputType === 'select' && c.options?.length > 0) ? c.options[0] : ''; });
                setNonEvaluableData(initialNonEvaluable);
                setObservations('');
            }

        } catch (error) {
            console.error("Error saving evaluation: ", error);
            setMessage('Hubo un error al guardar la evaluación.');
        } finally {
            setIsSubmitting(false);
        }
    };
  
    if (executives.length === 0 || evaluationSections.length === 0) return (<div><h1>Faltan Datos</h1><p>Añade ejecutivos, secciones y criterios en <b>Configuración</b>.</p></div>);

    const selectedSection = evaluationSections.find(s => s.name === evaluationType);
    const formTitle = evaluationId ? 'Editar Evaluación' : 'Registrar Evaluación';
    
    const descriptionStyle = {
        backgroundColor: hexToRgba(selectedSection?.color, 0.1),
        borderLeft: `3px solid ${selectedSection?.color || 'var(--color-primary)'}`,
        padding: '1rem',
        borderRadius: 'var(--border-radius)',
        margin: '1rem 0'
    };

    return (
        <div className="card" style={{maxWidth: '800px', margin: 'auto'}}>
            <h4 className="card-title card-title-primary">{formTitle}</h4>
            <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group"><label>Ejecutivo</label><select className="form-control" value={selectedExecutive} onChange={(e) => setSelectedExecutive(e.target.value)} disabled={!!evaluationId}>{executives.map(e => <option key={e.id} value={e.Nombre}>{e.Nombre}</option>)}</select></div>
                    <div className="form-group">
                        {selectedSection?.displayAsTooltip ? (
                            <LabelWithDescription item={selectedSection} title="Tipo de Evaluación" />
                        ) : (
                            <label>Tipo de Evaluación</label>
                        )}
                        <select className="form-control" value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)} disabled={!!evaluationId}>{evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                    </div>
                    {selectedSection?.includeManagementDate && (<div className="form-group"><label>Fecha de gestión</label><input className="form-control" type="date" value={managementDate} onChange={e => setManagementDate(e.target.value)} /></div>)}
                    
                    {filteredNonEvaluableCriteria.map((c) => (
                        <div className="form-group" key={c.id}>
                            <LabelWithDescription item={c} title={c.name} />
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
                
                {selectedSection?.displayDescription && !selectedSection.displayAsTooltip && selectedSection.description && (
                    <div style={descriptionStyle}>
                        <div className="ql-snow">
                            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: selectedSection.description }} />
                        </div>
                    </div>
                )}

                <hr style={{margin: '2rem 0'}} />
                
                {Object.entries(groupedCriteria).map(([groupName, criteriaList], groupIndex) => (
                    criteriaList.length > 0 && (
                        <div key={groupName}>
                            {evaluationType === 'Aptitudes Transversales' && <h4>{groupName}</h4>}
                            <LabelWithDescription item={aptitudeSubsections.find(s => s.name === groupName)} title={groupName} />
                            {criteriaList.map((c, index) => (
                                <div className="form-group" key={c.id}>
                                    <LabelWithDescription item={c} title={`${index + 1}. ${c.name}`} />
                                    <DynamicScoreSelector 
                                        scaleType={selectedSection?.scaleType}
                                        value={scores[c.name]} 
                                        onChange={(score) => handleScoreChange(c.name, score)} 
                                    />
                                </div>
                            ))}
                            {evaluationType === 'Aptitudes Transversales' && groupIndex < Object.values(groupedCriteria).filter(list => list.length > 0).length - 1 && (
                                <hr style={{ margin: '2.5rem 0', border: '1px solid #eee' }} />
                            )}
                        </div>
                    )
                ))}

                {Object.values(groupedCriteria).every(list => list.length === 0) && <p>No hay criterios para este tipo de evaluación.</p>}
                
                <hr style={{margin: '2rem 0'}} />

                <div className="form-group">
                    <label>Observaciones</label>
                    <textarea 
                        className="form-control" 
                        rows="4"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Añade comentarios u observaciones adicionales sobre la evaluación..."
                    />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{width: '100%'}}>{isSubmitting ? 'Guardando...' : (evaluationId ? 'Actualizar Evaluación' : 'Guardar Evaluación')}</button>
                {message && <p style={{marginTop: '1rem', textAlign: 'center'}}>{message}</p>}
            </form>
        </div>
    );
};

export default Evaluate;
