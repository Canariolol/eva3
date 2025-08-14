import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CustomTooltip from '../components/Dashboard/CustomTooltip';
import DynamicScoreSelector from '../components/DynamicScoreSelector';
import './Team.css';

const Modal = ({ children, onClose, size = 'default' }) => {
    const [isClosing, setIsClosing] = useState(false);
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    }, [onClose]);
    return (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`modal-content ${size === 'large' ? 'modal-large' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="modal-close-btn">&times;</button>
                {children}
            </div>
        </div>
    );
};

const formatDisplayValue = (value) => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    if (typeof value === 'object' && value.seconds) { // Firestore Timestamp
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (value instanceof Date) { // JavaScript Date
        return value.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return value.toString(); // Other types
};


const Team = () => {
    const { executives, evaluations, evaluationSections, nonEvaluableCriteria, refreshData } = useGlobalContext();
    const { userRole, executiveData } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedExecutive, setSelectedExecutive] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [sectionFilter, setSectionFilter] = useState('All');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editableEvaluation, setEditableEvaluation] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const executiveId = searchParams.get('executiveId');
        const evaluationId = searchParams.get('evaluationId');

        if (userRole === 'executive' && !executiveId && executiveData) {
            setSearchParams({ executiveId: executiveData.id });
            return;
        }

        if (executiveId && executives.length > 0) {
            const execToSelect = executives.find(e => e.id === executiveId);
            setSelectedExecutive(userRole === 'executive' && execToSelect?.id !== executiveData?.id ? null : execToSelect || null);
        } else {
            setSelectedExecutive(null);
        }
        
        const evalToSelect = evaluationId && evaluations.length > 0 ? evaluations.find(e => e.id === evaluationId) : null;
        setSelectedEvaluation(evalToSelect);
        if (evalToSelect) {
            setEditableEvaluation(JSON.parse(JSON.stringify(evalToSelect)));
        } else {
            setIsEditing(false);
        }
    }, [searchParams, executives, evaluations, userRole, executiveData, setSearchParams]);

    const handleExecutiveCardClick = (executive) => {
        if (userRole === 'admin' || (userRole === 'executive' && executive.id === executiveData?.id)) {
            setSearchParams({ executiveId: executive.id });
        }
    };
    
    const handleCloseExecutiveModal = useCallback(() => setSearchParams({}), [setSearchParams]);
    const handleSelectEvaluation = useCallback((evaluation) => setSearchParams(prev => ({ ...Object.fromEntries(prev.entries()), evaluationId: evaluation.id })), [setSearchParams]);
    
    const handleCloseEvaluationModal = useCallback(() => {
        const newParams = Object.fromEntries(searchParams.entries());
        delete newParams.evaluationId;
        setSearchParams(newParams);
        setIsEditing(false);
        setSaveMessage('');
    }, [searchParams, setSearchParams]);

    const handleEditClick = () => {
        setEditableEvaluation(JSON.parse(JSON.stringify(selectedEvaluation)));
        setIsEditing(true);
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveMessage('');
    };

    const handleScoreChange = (criterionName, newScore) => {
        setEditableEvaluation(prev => ({
            ...prev,
            scores: { ...prev.scores, [criterionName]: newScore }
        }));
    };

    const handleNonEvaluableChange = (fieldName, value) => {
        setEditableEvaluation(prev => ({
            ...prev,
            nonEvaluableData: { ...prev.nonEvaluableData, [fieldName]: value }
        }));
    };

    const handleObservationsChange = (observations) => {
        setEditableEvaluation(prev => ({ ...prev, observations }));
    };

    const handleSaveChanges = async () => {
        if (!editableEvaluation) return;
        setIsSaving(true);
        setSaveMessage('');

        // Prepare data for Firestore, converting date strings back to Date objects if needed
        const dataToSave = { ...editableEvaluation };
        if (dataToSave.nonEvaluableData) {
            for (const key in dataToSave.nonEvaluableData) {
                const criterion = nonEvaluableCriteria.find(c => c.name === key);
                const value = dataToSave.nonEvaluableData[key];
                if (criterion?.inputType === 'date' && typeof value === 'string' && value) {
                    dataToSave.nonEvaluableData[key] = new Date(value + 'T00:00:00'); // Prevent timezone shifts
                }
            }
        }
        
        try {
            const evaluationRef = doc(db, 'evaluations', selectedEvaluation.id);
            await updateDoc(evaluationRef, {
                scores: dataToSave.scores,
                nonEvaluableData: dataToSave.nonEvaluableData,
                observations: dataToSave.observations,
            });
            await refreshData();
            setIsEditing(false);
            setSaveMessage('¡Evaluación actualizada con éxito!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error("Error updating evaluation:", error);
            setSaveMessage('Error al guardar. Inténtalo de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const truncateName = (name) => name.split(' ').length > 1 ? `${name.split(' ')[0]}...` : name;
    const getScaleDomain = (scaleType) => ({'1-5': [0, 5], 'binary': [0, 10], 'percentage': [0, 100]})[scaleType] || [0, 10];

    const renderExecutiveDetails = () => {
        if (!selectedExecutive) return null;
        const executiveEvals = evaluations.filter(e => e.executive === selectedExecutive.Nombre);
        const filteredEvals = sectionFilter === 'All' ? executiveEvals : executiveEvals.filter(e => e.section === sectionFilter);
        if (executiveEvals.length === 0) return <div className="executive-details-modal"><h2>{selectedExecutive.Nombre}</h2><p>No hay evaluaciones registradas.</p></div>;
        
        const sectionsWithData = evaluationSections.map(section => {
            const evals = executiveEvals.filter(e => e.section === section.name);
            if (evals.length === 0) return null;
            const criteria = evals.reduce((acc, ev) => {
                Object.entries(ev.scores).forEach(([name, score]) => {
                    if (!acc[name]) acc[name] = [];
                    acc[name].push(score);
                });
                return acc;
            }, {});
            const chartData = Object.entries(criteria).map(([name, scores]) => ({ name, shortName: truncateName(name), Promedio: scores.reduce((a, b) => a + b, 0) / scores.length }));
            return { ...section, chartData, yAxisDomain: getScaleDomain(section.scaleType) };
        }).filter(Boolean);

        return (
            <div className="executive-details-modal">
                <h2>{selectedExecutive.Nombre}</h2>
                <p><strong>Cargo:</strong> {selectedExecutive.Cargo} &nbsp;|&nbsp; <strong>Área:</strong> {selectedExecutive.Área}</p>
                <h3>Rendimiento General</h3>
                <div className="performance-charts">{sectionsWithData.map(s => (<div key={s.id}><h4>{s.name}</h4><ResponsiveContainer width="100%" height={300}><BarChart data={s.chartData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} /><YAxis domain={s.yAxisDomain} /><Tooltip content={<CustomTooltip scaleType={s.scaleType} />} /><Bar dataKey="Promedio" fill={s.color || '#8884d8'} /></BarChart></ResponsiveContainer></div>))}</div>
                <div className="evaluation-history-header"><h3>Historial de Evaluaciones</h3><select className="form-control" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} style={{width: '250px'}}><option value="All">Mostrar Todas</option>{evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                <ul className="config-list">{filteredEvals.map(ev => {
                    const sectionConfig = evaluationSections.find(s => s.name === ev.section);
                    const scores = Object.values(ev.scores);
                    let finalScore = 'N/A';
                    if (scores.length > 0) {
                        if (sectionConfig?.scaleType === 'binary') {
                            const compliantCount = scores.filter(s => s === 10).length;
                            finalScore = `${((compliantCount / scores.length) * 100).toFixed(0)}%`;
                        } else {
                            finalScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
                        }
                    }
                    return (<li key={ev.id} className="config-list-item" onClick={() => handleSelectEvaluation(ev)}><div><strong>{ev.section}</strong><span className="evaluation-dates">Fecha: {formatDisplayValue(ev.evaluationDate)}{sectionConfig?.includeManagementDate && ev.managementDate && ` | Gestión: ${formatDisplayValue(ev.managementDate)}`}</span></div><span className="evaluation-avg">{finalScore}</span></li>);
                })}</ul>
            </div>
        );
    };

    const renderEvaluationDetailModal = () => {
        if (!selectedEvaluation || !editableEvaluation) return null;
        const sectionConfig = evaluationSections.find(s => s.name === selectedEvaluation.section);
        const isBinary = sectionConfig?.scaleType === 'binary';
        
        return (
            <Modal onClose={handleCloseEvaluationModal}>
                <div className="evaluation-detail-modal">
                    <div className="edit-header"><h2>Detalle de la Evaluación</h2>{userRole === 'admin' && !isEditing && (<button onClick={handleEditClick} className="btn btn-primary">Editar</button>)}</div>
                    {saveMessage && <p className={`save-message ${saveMessage.startsWith('Error') ? 'error' : 'success'}`}>{saveMessage}</p>}
                    <p><strong>Fecha:</strong> {formatDisplayValue(selectedEvaluation.evaluationDate)} &nbsp;|&nbsp; <strong>Sección:</strong> {selectedEvaluation.section}</p>
                    
                    <h4>Puntajes</h4>
                    <ul className='config-list'>{Object.entries(editableEvaluation.scores).map(([name, score]) => (<li key={name} className='config-list-item'><span>{name}</span>{isEditing ? <DynamicScoreSelector scaleType={sectionConfig?.scaleType} value={score} onChange={(newScore) => handleScoreChange(name, newScore)} /> : <strong>{isBinary ? (score === 10 ? 'Cumple' : 'No Cumple') : score}</strong>}</li>))}</ul>

                    {selectedEvaluation.nonEvaluableData && Object.keys(selectedEvaluation.nonEvaluableData).length > 0 && (
                        <>
                            <h4>Datos Adicionales</h4>
                            <ul className='config-list'>
                            {Object.entries(selectedEvaluation.nonEvaluableData).map(([name, value]) => {
                                const criterion = nonEvaluableCriteria.find(c => c.name === name);
                                let input;
                                if (isEditing) {
                                    const currentValue = editableEvaluation.nonEvaluableData?.[name];
                                    if (criterion?.inputType === 'date') {
                                        const dateValue = currentValue?.seconds ? new Date(currentValue.seconds * 1000).toISOString().split('T')[0] : (typeof currentValue === 'string' ? currentValue : '');
                                        input = <input type="date" className="form-control" value={dateValue} onChange={(e) => handleNonEvaluableChange(name, e.target.value)} />;
                                    } else if (criterion?.inputType === 'select') {
                                        input = <select className="form-control" value={currentValue} onChange={(e) => handleNonEvaluableChange(name, e.target.value)}>{criterion.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>;
                                    } else {
                                        input = <input type="text" className="form-control" value={currentValue} onChange={(e) => handleNonEvaluableChange(name, e.target.value)} />;
                                    }
                                }
                                return (
                                    <li key={name} className='config-list-item'>
                                        <span>{name}</span>
                                        {isEditing ? input : <strong>{formatDisplayValue(value)}</strong>}
                                    </li>
                                );
                            })}
                            </ul>
                        </>
                    )}

                    <h4>Observaciones</h4>
                    {isEditing ? <textarea className="form-control" value={editableEvaluation.observations} onChange={(e) => handleObservationsChange(e.target.value)} rows="4" /> : <div className="observations-box"><p>{selectedEvaluation.observations || 'Sin observaciones.'}</p></div>}
                    
                    {isEditing && (<div className="edit-actions"><button onClick={handleCancelEdit} className="btn btn-secondary" disabled={isSaving}>Cancelar</button><button onClick={handleSaveChanges} className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button></div>)}
                </div>
            </Modal>
        );
    };

    return (
        <>
            <h1>{userRole === 'executive' ? 'Mi Equipo' : 'Nuestro Equipo'}</h1>
            <p className="page-subtitle">{userRole === 'admin' ? 'Haz clic en un ejecutivo para ver su historial.' : 'Puedes ver tu historial de rendimiento aquí.'}</p>
            <div className="team-grid">{executives.map(exec => { const isClickable = userRole === 'admin' || (userRole === 'executive' && exec.id === executiveData?.id); return (<div key={exec.id} className={`card team-card ${isClickable ? '' : 'disabled'}`} onClick={() => isClickable && handleExecutiveCardClick(exec)}><div className="team-avatar">{exec.Nombre.charAt(0)}</div><h2>{exec.Nombre}</h2><p>{exec.Cargo || 'N/A'}</p></div>);})}</div>
            {selectedExecutive && <Modal onClose={handleCloseExecutiveModal} size="large">{renderExecutiveDetails()}</Modal>}
            {selectedEvaluation && renderEvaluationDetailModal()}
        </>
    );
};

export default Team;
