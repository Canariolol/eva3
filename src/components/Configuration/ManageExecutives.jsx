import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';

const ManageExecutives = ({
    executives,
    executiveFields,
    currentUser,
    handleSaveExecutive,
    handleEditClick,
    handleDelete
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newExecutive, setNewExecutive] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveExecutive(newExecutive);
        setIsAdding(false);
        setNewExecutive({});
    };

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Ejecutivos</h4>
            <CollapsibleCard>
                {currentUser && (
                <div style={{ marginBottom: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? 'Cancelar' : 'Agregar Ejecutivo'}
                    </button>
                </div>
                )}
                {isAdding && currentUser && (
                    <form onSubmit={handleSubmit}>
                        {executiveFields.map(field => (
                            <div className="form-group" key={field.id}>
                                <label>{field.name}</label>
                                <input type="text" className="form-control" value={newExecutive[field.name] || ''} onChange={(e) => setNewExecutive({ ...newExecutive, [field.name]: e.target.value })} />
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Ejecutivo</button>
                    </form>
                )}
                <ul className="config-list">
                    {executives.map(exec => (
                        <li key={exec.id} className="config-list-item">
                            <Tooltip text={exec.Cargo || 'Sin Cargo'}>
                                <span>{exec.Nombre}</span>
                            </Tooltip>
                            {currentUser && (
                            <div className="config-actions">
                                <button className="btn-icon" onClick={() => handleEditClick(exec, 'executives', executiveFields.map(f => ({ name: f.name, label: f.name })))}>✏️</button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executives', exec.id)}>🗑️</button>
                            </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageExecutives;
