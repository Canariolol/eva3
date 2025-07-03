import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext'; // Importar el contexto de autenticación
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

const Team = () => {
    const { executives, evaluations, evaluationSections } = useGlobalContext();
    const { userRole, executiveData } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [selectedExecutive, setSelectedExecutive] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);

    useEffect(() => {
        const executiveId = searchParams.get('executiveId');
        const evaluationId = searchParams.get('evaluationId');

        // Si el usuario es un ejecutivo y no hay un ID en la URL, mostrar su propio detalle por defecto.
        if (userRole === 'executive' && !executiveId && executiveData) {
            setSearchParams({ executiveId: executiveData.id });
            return;
        }

        if (executiveId && executives.length > 0) {
            const execToSelect = executives.find(e => e.id === executiveId);
            
            // Un ejecutivo solo puede ver su propio detalle.
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

                <h3>Historial de Evaluaciones</h3>
                <ul className="config-list">
                    {executiveEvals.map(ev => {
                        const sectionConfig = evaluationSections.find(s => s.name === ev.section);
                        return (
                            <li key={ev.id} className="config-list-item" onClick={() => handleSelectEvaluation(ev)}>
                                <div>
                                    <strong>{ev.section}</strong>
                                    <span className="evaluation-dates">
                                        Fecha Evaluación: {ev.evaluationDate.toLocaleDateString('es-ES')}
                                        {sectionConfig?.includeManagementDate && ev.managementDate && ` | Fecha Gestión: ${ev.managementDate.toLocaleDateString('es-ES')}`}
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
                    <p><strong>Fecha de Evaluación:</strong> {selectedEvaluation.evaluationDate.toLocaleDateString('es-ES')}</p>
                    {sectionConfig?.includeManagementDate && selectedEvaluation.managementDate && <p><strong>Fecha de Gestión:</strong> {selectedEvaluation.managementDate.toLocaleDateString('es-ES')}</p>}
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
                                    <span>{value}</span>
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
