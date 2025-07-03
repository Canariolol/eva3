import React, { useState } from 'react';

const Modal = ({ children, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300);
    };
    
    return (
        <div className={`modal-backdrop ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="modal-close-btn">&times;</button>
                {children}
            </div>
        </div>
    );
};


const AdditionalMetricsCard = ({ title, evaluations, nonEvaluable, overallAverage, color, onEvaluationSelect }) => {
    const [modalData, setModalData] = useState(null);

    const pluralize = (count, singular, plural) => (count === 1 ? singular : plural || `${singular}s`);

    const handleOpenModal = (metricName, emptyEvals) => {
        setModalData({ title: metricName, evaluations: emptyEvals });
    };
    
    const handleCloseModal = () => {
        setModalData(null);
    };

    const handleEvaluationClick = (evaluationId, executiveId) => {
        if(onEvaluationSelect) {
            onEvaluationSelect(evaluationId, executiveId);
        }
        handleCloseModal();
    };

    return (
        <>
            <div className="card" style={{flex: 1, minWidth: '400px'}}>
                <h4 className="card-title" style={{ backgroundColor: color + '20', color: color }}>{title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', height: 'calc(100% - 40px)' }}>
                    <div style={{ flex: 1, paddingRight: '1rem', overflowY: 'auto' }}>
                        <p><strong>{pluralize(evaluations.length, 'Evaluación Realizada', 'Evaluaciones Realizadas')}:</strong> {evaluations.length}</p>
                        {nonEvaluable.map(metric => (
                            <div key={metric.name}>
                                {metric.type === 'select' && (
                                    <>
                                        <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                                        <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                                            {Object.entries(metric.counts).map(([option, count]) => (
                                            <li key={option}>{option}: {count}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {metric.type === 'text' && (
                                    <p><strong>{metric.name}:</strong> {metric.count}</p>
                                )}
                                {metric.type === 'summary' && (
                                    <>
                                        <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                                        <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                                            {Object.entries(metric.summary).map(([name, count]) => (
                                            <li key={name}>
                                                {name}: {count}
                                                {name === 'Sin Ingreso (N/A)' && count > 0 && (
                                                    <button 
                                                        onClick={() => handleOpenModal(metric.name, metric.emptyEvaluations)}
                                                        className="btn-link"
                                                    >
                                                        (Ver detalle)
                                                    </button>
                                                )}
                                            </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {overallAverage > 0 && (
                    <>
                        <div style={{ borderLeft: '1px solid #ccc', margin: '0 1rem' }}></div>
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingLeft: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '1.1rem', color: '#6c757d', textAlign: 'center' }}>Promedio General</p>
                            <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 'bold', lineHeight: 1.2, color: color }}>
                                {overallAverage.toFixed(2)}
                            </p>
                        </div>
                    </>
                    )}
                </div>
            </div>

            {modalData && (
                <Modal onClose={handleCloseModal}>
                    <h2>Evaluaciones sin "{modalData.title}"</h2>
                    <p>Haz clic en una evaluación para ver el detalle.</p>
                    <ul className="config-list">
                        {modalData.evaluations.map(ev => (
                            <li key={ev.id} className="config-list-item" onClick={() => handleEvaluationClick(ev.id, ev.executiveId)}>
                                <div>
                                    <strong>{ev.executive}</strong>
                                    <span className="evaluation-dates">
                                        Fecha Evaluación: {ev.date.toLocaleDateString('es-ES')}
                                        {ev.managementDate && ` | Fecha Gestión: ${ev.managementDate.toLocaleDateString('es-ES')}`}
                                    </span>
                                </div>
                                <span className="arrow-right">&rarr;</span>
                            </li>
                        ))}
                    </ul>
                </Modal>
            )}
        </>
    );
};

export default AdditionalMetricsCard;
