import React, { useState } from 'react';

const ExecutiveSummaryCard = ({ averages, title, color }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                <h4 className="card-title" style={{backgroundColor: color + '20', color: color}}>{`Resumen por Ejecutivo: ${title}`}</h4>
                <ul className="config-list">
                    {averages.slice(0, 5).map(avg => (
                        <li key={avg.name} className="config-list-item">
                            <span>{avg.name}</span>
                            <span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                {averages.length > 5 && (
                    <button className="btn-link" onClick={openModal}>
                        Ver más...
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={closeModal}>×</button>
                        <h3>{`Resumen completo: ${title}`}</h3>
                        <ul className="config-list" style={{marginTop: '1.5rem'}}>
                            {averages.map(avg => (
                                <li key={avg.name} className="config-list-item">
                                    <span>{avg.name}</span>
                                    <span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExecutiveSummaryCard;
