import React, { useState } from 'react';
import CollapsibleCard from '../CollapsibleCard';

const ManageCustomTabs = ({ customTabs, onSave, onDelete }) => {
    const [newTabName, setNewTabName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newTabName.trim()) {
            onSave({ name: newTabName.trim() });
            setNewTabName('');
        }
    };

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Pestañas Personalizadas</h4>
            <CollapsibleCard>
                <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                    <div className="form-group">
                        <label>Nombre de la Nueva Pestaña</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            placeholder="Ej: Objetivos del Equipo"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Crear Pestaña
                    </button>
                </form>
                <ul className="config-list">
                    {customTabs.map(tab => (
                        <li key={tab.id} className="config-list-item">
                            <span>{tab.name}</span>
                            <div className="config-actions">
                                <button className="btn-icon btn-icon-danger" onClick={() => onDelete(tab.id)}>
                                    🗑️
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageCustomTabs;
