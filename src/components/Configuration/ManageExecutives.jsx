import React, { useState, useEffect } from 'react';
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
    
    // Asegurarse de que el campo 'Email' esté siempre presente
    const allFields = [...executiveFields];
    if (!allFields.some(field => field.name === 'Email')) {
        allFields.push({ id: 'default_email', name: 'Email' });
    }
     if (!allFields.some(field => field.name === 'Nombre')) {
        allFields.push({ id: 'default_nombre', name: 'Nombre' });
    }

    useEffect(() => {
        // Inicializar el estado para el nuevo ejecutivo con todos los campos
        const initialState = allFields.reduce((acc, field) => {
            acc[field.name] = '';
            return acc;
        }, {});
        setNewExecutive(initialState);
    }, [isAdding, executiveFields]); // Depender de executiveFields para react-hooks/exhaustive-deps

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validación para asegurar que los campos requeridos no estén vacíos
        if (!newExecutive.Nombre || !newExecutive.Email) {
            alert('El Nombre y el Email son campos obligatorios.');
            return;
        }

        handleSaveExecutive(newExecutive);
        setIsAdding(false);
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
                        {allFields.map(field => (
                            <div className="form-group" key={field.id}>
                                <label>{field.name} {field.name === 'Nombre' || field.name === 'Email' ? '*' : ''}</label>
                                <input 
                                    type={field.name === 'Email' ? 'email' : 'text'} 
                                    className="form-control" 
                                    value={newExecutive[field.name] || ''} 
                                    onChange={(e) => setNewExecutive({ ...newExecutive, [field.name]: e.target.value })}
                                    required={field.name === 'Nombre' || field.name === 'Email'}
                                />
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Ejecutivo</button>
                    </form>
                )}
                <ul className="config-list">
                    {executives.map(exec => (
                        <li key={exec.id} className="config-list-item">
                            <Tooltip text={exec.Email || 'Sin Email'}>
                                <span>{exec.Nombre}</span>
                            </Tooltip>
                            {currentUser && (
                            <div className="config-actions">
                                <button className="btn-icon" onClick={() => handleEditClick(exec, 'executives', allFields.map(f => ({ name: f.name, label: f.name, type: f.name === 'Email' ? 'email' : 'text', required: f.name === 'Email' || f.name === 'Nombre' })))}>✏️</button>
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
