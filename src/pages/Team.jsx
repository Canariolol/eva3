import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomTooltip from '../components/Dashboard/CustomTooltip';
import './Team.css';

const Modal = ({ children, onClose, size = 'default' }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    };
    
    return (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`modal-content ${size === 'large' ? 'modal-large' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="modal-close-btn">&times;</button>
                {children}
            </div>
        </div>
    );
};

// Helper function to format various data types for display
const formatDisplayValue = (value) => {
    if (!value) return '';

    let date;
    // Check if it's a Firestore timestamp
    if (typeof value === 'object' && value.seconds) {
        date = new Date(value.seconds * 1000);
    } 
    // Check if it's already a JavaScript Date object
    else if (value instanceof Date) {
        date = value;
    } 
    // If it's not a date-like object, return it as is
    else {
        return value;
    }

    // Check if a specific time was set (other than midnight)
    if (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0) {
        return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    // Otherwise, just show the date
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


const Team = () => {
    const { executives, evaluations, evaluationSections } = useGlobalContext();
    const { userRole, executiveData } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedExecutive, setSelectedExecutive] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [sectionFilter, setSectionFilter] = useState('All');

    useEffect(() => {
        const executiveId = searchParams.get('executiveId');
        const evaluationId = searchParams.get('evaluationId');

        if (userRole === 'executive' && !executiveId && executiveData) {
            setSearchParams({ executiveId: executiveData.id });
            return;
        }

        if (executiveId && executives.length > 0) {
            const execToSelect = executives.find(e => e.id === executiveId);
            
            if (userRole === 'executive' && execToSelect?.id !== executiveData?.id) {
                setSelectedExecutive(null);
            } else {
                setSelectedExecutive(execToSelect || null);
            }
        } else {
            setSelectedExecutive(null);
        }
        
        if (evaluationId && evaluations.length > 0) {
            const evalToSelect = evaluations.find(e => e.id === evaluationId);
            setSelectedEvaluation(evalToSelect || null);
        } else {
            setSelectedEvaluation(null);
        }
    }, [searchParams, executives, evaluations, userRole, executiveData, setSearchParams]);
    
    const truncateName = (name) => {
        const words = name.split(' ');
        return words.length > 1 ? `${words[0]}...` : name;
    };

    const handleExecutiveCardClick = (executive) => {
        const isClickable = userRole === 'admin' || (userRole === 'executive' && executive.id === executiveData?.id);
        if (isClickable) {
            setSearchParams({ executiveId: executive.id });
        }
    };

    const handleCloseExecutiveModal = () => {
        setSearchParams({});
    };

    const handleSelectEvaluation = (evaluation) => {
        const currentParams = Object.fromEntries(searchParams.entries());
        setSearchParams({ ...currentParams, evaluationId: evaluation.id });
    };

    const handleCloseEvaluationModal = () => {
        const currentParams = Object.fromEntries(searchParams.entries());
        delete currentParams.evaluationId;
        setSearchParams(currentParams);
    };
    
    const renderExecutiveDetails = () => {
        if (!selectedExecutive) return null;

        const executiveEvals = evaluations.filter(e => e.executive === selectedExecutive.Nombre);
        
        const filteredEvals = sectionFilter === 'All' 
            ? executiveEvals 
            : executiveEvals.filter(e => e.section === sectionFilter);

        if (executiveEvals.length === 0) {
            return (
                <div className="executive-details-modal">
                    <h2>{selectedExecutive.Nombre}</h2>
                    <p>No hay evaluaciones registradas para este ejecutivo.</p>
                </div>
            );
        }
        
        const sectionsWithData = evaluationSections.map(section => {
            const evals = executiveEvals.filter(e => e.section === section.name);
            if (evals.length === 0) return null;

            const criteria = {};
            evals.forEach(ev => {
                Object.entries(ev.scores).forEach(([name, score]) => {
                    if (!criteria[name]) criteria[name] = [];
                    criteria[name].push(score);
                });
            });

            const chartData = Object.entries(criteria).map(([name, scores]) => ({
                name,
                shortName: truncateName(name),
                Promedio: scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
            
            return { ...section, chartData };
        }).filter(Boolean);


        return (
            <div className="executive-details-modal">
                <h2>{selectedExecutive.Nombre}</h2>
                <p><strong>Cargo:</strong> {selectedExecutive.Cargo}</p>
                <p><strong>Área:</strong> {selectedExecutive.Área}</p>
                
                <h3>Rendimiento General</h3>
                <div className="performance-charts">
                    {sectionsWithData.map(section => (
                        <div key={section.id}>
                            <h4>{section.name}</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={section.chartData} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Bar dataKey="Promedio" fill={section.color || '#8884d8'} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ))}
                </div>

                <div className="evaluation-history-header">
                    <h3>Historial de Evaluaciones</h3>
                    <select 
                        className="form-control" 
                        value={sectionFilter} 
                        onChange={(e) => setSectionFilter(e.target.value)}
                        style={{width: '250px'}}
                    >
                        <option value="All">Mostrar Todas</option>
                        {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <ul className="config-list">
                    {filteredEvals.map(ev => {
                        const sectionConfig = evaluationSections.find(s => s.name === ev.section);
                        return (
                            <li key={ev.id} className="config-list-item" onClick={() => handleSelectEvaluation(ev)}>
                                <div>
                                    <strong>{ev.section}</strong>
                                    <span className="evaluation-dates">
                                        Fecha Evaluación: {formatDisplayValue(ev.evaluationDate)}
                                        {sectionConfig?.includeManagementDate && ev.managementDate && ` | Fecha Gestión: ${formatDisplayValue(ev.managementDate)}`}
                                    </span>
                                </div>
                                <span className="evaluation-avg">
                                    {(Object.values(ev.scores).reduce((a, b) => a + b, 0) / Object.values(ev.scores).length).toFixed(2)}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        );
    };

    const renderEvaluationDetailModal = () => {
        if (!selectedEvaluation) return null;
        const sectionConfig = evaluationSections.find(s => s.name === selectedEvaluation.section);

        return (
            <Modal onClose={handleCloseEvaluationModal}>
                <div className="evaluation-detail-modal">
                    <h2>Detalle de la Evaluación</h2>
                    <p><strong>Fecha de Evaluación:</strong> {formatDisplayValue(selectedEvaluation.evaluationDate)}</p>
                    {sectionConfig?.includeManagementDate && selectedEvaluation.managementDate && <p><strong>Fecha de Gestión:</strong> {formatDisplayValue(selectedEvaluation.managementDate)}</p>}
                    <p><strong>Sección:</strong> {selectedEvaluation.section}</p>
                    
                    <h4>Puntajes</h4>
                    <ul className='config-list'>
                        {Object.entries(selectedEvaluation.scores).map(([name, score]) => (
                            <li key={name} className='config-list-item'>
                                <span>{name}</span>
                                <strong>{score}</strong>
                            </li>
                        ))}
                    </ul>
                    
                    {selectedEvaluation.nonEvaluableData && Object.keys(selectedEvaluation.nonEvaluableData).length > 0 && (
                        <>
                            <h4>Datos Adicionales</h4>
                            <ul className='config-list'>
                            {Object.entries(selectedEvaluation.nonEvaluableData).map(([name, value]) => (
                                <li key={name} className='config-list-item'>
                                    <span>{name}</span>
                                    <span>{formatDisplayValue(value)}</span>
                                </li>
                            ))}
                            </ul>
                        </>
                    )}

                    {selectedEvaluation.observations && (
                        <>
                            <h4>Observaciones</h4>
                            <div className="observations-box">
                                <p>{selectedEvaluation.observations}</p>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        );
    };

    const pageTitle = userRole === 'executive' ? 'Mi Equipo' : 'Nuestro Equipo';
    const pageSubtitle = userRole === 'admin' 
        ? 'Haz clic en un ejecutivo para ver su historial de rendimiento.'
        : 'Puedes ver tu historial de rendimiento haciendo clic en tu tarjeta.';

    return (
        <>
            <h1>{pageTitle}</h1>
            <p className="page-subtitle">{pageSubtitle}</p>
            <div className="team-grid">
                {executives.map(exec => {
                    const isClickable = userRole === 'admin' || (userRole === 'executive' && exec.id === executiveData?.id);
                    return (
                        <div 
                            key={exec.id} 
                            className={`card team-card ${isClickable ? '' : 'disabled'}`}
                            onClick={() => handleExecutiveCardClick(exec)}
                        >
                            <div className="team-avatar">{exec.Nombre.charAt(0)}</div>
                            <h2>{exec.Nombre}</h2>
                            <p>{exec.Cargo || 'N/A'}</p>
                        </div>
                    );
                })}
            </div>

            {selectedExecutive && (
                <Modal onClose={handleCloseExecutiveModal} size="large">
                    {renderExecutiveDetails()}
                </Modal>
            )}

            {selectedEvaluation && renderEvaluationDetailModal()}
        </>
    );
};

export default Team;
