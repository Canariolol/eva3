import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <p className="label" style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{payload[0].payload.name}</p>
        <p className="intro" style={{ margin: '5px 0 0' }}>
          <span style={{ color: payload[0].fill }}>{`${payload[0].name}: `}</span>
          <span style={{ fontWeight: 'bold' }}>{payload[0].value.toFixed(2)}</span>
        </p>
      </div>
    );
  }

  return null;
};

const Modal = ({ children, onClose, size = 'default' }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match animation duration
    };

    const handleBackdropClick = () => {
        handleClose();
    };

    const handleContentClick = (e) => {
        e.stopPropagation();
    };
    
    return (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleBackdropClick}>
            <div className="modal-content" onClick={handleContentClick} style={{ maxWidth: size === 'large' ? '800px' : '500px' }}>
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
    
    // Function to truncate the name to the first word and add "..."
    const truncateName = (name) => {
        const words = name.split(' ');
        if (words.length > 1) {
            return `${words[0]}...`;
        }
        return name;
    };
    
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
                name: name, // Full name for the tooltip
                shortName: truncateName(name), // Truncated name for the axis
                Promedio: scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        };

        return (
            <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <h2>{selectedExecutive.Nombre}</h2>
                <p><strong>Cargo:</strong> {selectedExecutive.Cargo}</p>
                <p><strong>Área:</strong> {selectedExecutive.Área}</p>
                
                <hr style={{margin: '2rem 0'}}/>

                <h3>Rendimiento General</h3>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
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
                    <div style={{ flex: 1 }}>
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

                <h3 style={{marginTop: '3rem'}}>Historial de Evaluaciones</h3>
                <ul className="config-list">
                    {executiveEvals.map(ev => (
                        <li key={ev.id} className="config-list-item" onClick={() => setSelectedEvaluation(ev)} style={{cursor: 'pointer'}}>
                            <div>
                                <strong style={{display: 'block'}}>{ev.section}</strong>
                                <span style={{fontSize: '0.9rem', color: '#666'}}>
                                    Fecha Evaluación: {ev.evaluationDate.toLocaleDateString('es-ES')}
                                    {ev.managementDate && ` | Fecha Gestión: ${ev.managementDate.toLocaleDateString('es-ES')}`}
                                </span>
                            </div>
                            <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>
                                {(Object.values(ev.scores).reduce((a, b) => a + b, 0) / Object.values(ev.scores).length).toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderEvaluationDetailModal = () => {
        if (!selectedEvaluation) return null;

        return (
            <Modal onClose={() => setSelectedEvaluation(null)}>
                <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <h2>Detalle de la Evaluación</h2>
                    <p><strong>Fecha de Evaluación:</strong> {selectedEvaluation.evaluationDate.toLocaleDateString('es-ES')}</p>
                    {selectedEvaluation.managementDate && <p><strong>Fecha de Gestión:</strong> {selectedEvaluation.managementDate.toLocaleDateString('es-ES')}</p>}
                    <p><strong>Sección:</strong> {selectedEvaluation.section}</p>
                    
                    <h4 style={{marginTop: '2rem'}}>Puntajes</h4>
                    <ul className='config-list'>
                        {Object.entries(selectedEvaluation.scores).map(([name, score]) => (
                            <li key={name} className='config-list-item'>
                                <span>{name}</span>
                                <span style={{fontWeight: 'bold'}}>{score}</span>
                            </li>
                        ))}
                    </ul>
                    
                    {selectedEvaluation.nonEvaluableData && Object.keys(selectedEvaluation.nonEvaluableData).length > 0 && (
                        <>
                            <h4 style={{marginTop: '2rem'}}>Datos Adicionales</h4>
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
                </div>
            </Modal>
        )
    }

    return (
        <>
            <h1>Nuestro Equipo</h1>
            <p style={{ marginTop: '-10px', color: 'var(--color-secondary)' }}>
                Haz clic en un ejecutivo para ver su historial de rendimiento.
            </p>
            <div className="team-grid" style={{marginTop: '2rem'}}>
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
