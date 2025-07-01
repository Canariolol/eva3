import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Team.css'; // Import the new CSS file

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${payload[0].payload.name}`}</p>
        <p className="intro">{`Promedio: ${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

// Reusable Modal Component
const Modal = ({ children, onClose, size = 'default' }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300); // Animation duration
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
    const { executives, evaluations } = useGlobalContext();
    const [selectedExecutive, setSelectedExecutive] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    
    // Truncates name for chart labels
    const truncateName = (name) => {
        const words = name.split(' ');
        return words.length > 1 ? `${words[0]}...` : name;
    };
    
    // Renders the details of the selected executive in a modal
    const renderExecutiveDetails = () => {
        if (!selectedExecutive) return null;

        const executiveEvals = evaluations.filter(e => e.executive === selectedExecutive.Nombre);
        if (executiveEvals.length === 0) {
            return <p>No hay evaluaciones registradas para este ejecutivo.</p>;
        }

        const aptitudesEvals = executiveEvals.filter(e => e.section === 'Aptitudes Transversales');
        const calidadEvals = executiveEvals.filter(e => e.section === 'Calidad de Desempeño');

        const getChartData = (evals) => {
            const criteria = {};
            evals.forEach(ev => {
                Object.entries(ev.scores).forEach(([name, score]) => {
                    if (!criteria[name]) criteria[name] = [];
                    criteria[name].push(score);
                });
            });
            return Object.entries(criteria).map(([name, scores]) => ({
                name,
                shortName: truncateName(name),
                Promedio: scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        };

        return (
            <div className="executive-details-modal">
                <h2>{selectedExecutive.Nombre}</h2>
                <p><strong>Cargo:</strong> {selectedExecutive.Cargo}</p>
                <p><strong>Área:</strong> {selectedExecutive.Área}</p>
                
                <h3>Rendimiento General</h3>
                <div className="performance-charts">
                    <div>
                        <h4>Aptitudes Transversales</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getChartData(aptitudesEvals)} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} />
                                <Tooltip content={<CustomTooltip />}/>
                                <Bar dataKey="Promedio" fill="var(--color-primary)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h4>Calidad de Desempeño</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getChartData(calidadEvals)} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 10]} />
                                <Tooltip content={<CustomTooltip />}/>
                                <Bar dataKey="Promedio" fill="var(--color-success)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <h3>Historial de Evaluaciones</h3>
                <ul className="config-list">
                    {executiveEvals.map(ev => (
                        <li key={ev.id} className="config-list-item" onClick={() => setSelectedEvaluation(ev)}>
                            <div>
                                <strong>{ev.section}</strong>
                                <span className="evaluation-dates">
                                    Fecha: {ev.evaluationDate.toLocaleDateString('es-ES')}
                                </span>
                            </div>
                            <span className="evaluation-avg">
                                {(Object.values(ev.scores).reduce((a, b) => a + b, 0) / Object.values(ev.scores).length).toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Renders a modal with the details of a single evaluation
    const renderEvaluationDetailModal = () => {
        if (!selectedEvaluation) return null;

        return (
            <Modal onClose={() => setSelectedEvaluation(null)}>
                <div className="evaluation-detail-modal">
                    <h2>Detalle de la Evaluación</h2>
                    <p><strong>Fecha:</strong> {selectedEvaluation.evaluationDate.toLocaleDateString('es-ES')}</p>
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

    return (
        <>
            <h1>Nuestro Equipo</h1>
            <p className="page-subtitle">
                Haz clic en un ejecutivo para ver su historial de rendimiento.
            </p>
            <div className="team-grid">
                {executives.map(exec => (
                    <div key={exec.id} className="card team-card" onClick={() => setSelectedExecutive(exec)}>
                        <div className="team-avatar">{exec.Nombre.charAt(0)}</div>
                        <h2>{exec.Nombre}</h2>
                        <p>{exec.Cargo || 'N/A'}</p>
                    </div>
                ))}
            </div>

            {selectedExecutive && (
                <Modal onClose={() => setSelectedExecutive(null)} size="large">
                    {renderExecutiveDetails()}
                </Modal>
            )}

            {renderEvaluationDetailModal()}
        </>
    );
};

export default Team;
