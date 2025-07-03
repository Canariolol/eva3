import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';

const ManageExecutiveFields = ({
    executiveFields,
    currentUser,
    handleSaveField,
    handleEditClick,
    handleDelete
}) => {
    const [newField, setNewField] = useState({ name: '' });
    const defaultFieldsNames = ['Nombre', 'Cargo', 'Área'];

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveField(newField);
        setNewField({ name: '' });
    };

    return (
        <div className="card">
             <h4 className="card-title card-title-primary">Gestionar Campos de Creación de Ejecutivos</h4>
            <CollapsibleCard>
                {currentUser && (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Añadir Campo Adicional</label>
                        <input type="text" className="form-control" value={newField.name} onChange={(e) => setNewField({ name: e.target.value })}/>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Agregar Campo</button>
                </form>
                )}
                <ul className="config-list">
                    {executiveFields.map(field => (
                        <li key={field.id} className="config-list-item">
                            <span>{field.name}</span>
                            {!defaultFieldsNames.includes(field.name) && currentUser && (
                                <div className="config-actions">
                                    <button className="btn-icon" onClick={() => handleEditClick(field, 'executiveFields', [{ name: 'name', label: 'Nombre del Campo' }])}>✏️</button>
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executiveFields', field.id)}>🗑️</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageExecutiveFields;
