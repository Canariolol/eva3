import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';
import ColorPicker from './ColorPicker';
import './ColorPicker.css';

const ManageSections = ({ 
    evaluationSections, 
    currentUser, 
    onSave,
    onMove,
    onEdit, 
    onDelete 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newSection, setNewSection] = useState({ 
        name: '', 
        description: '', 
        color: '#007bff', 
        includeManagementDate: false,
        showInDashboard: true
    });

    const handleSave = (e) => {
        e.preventDefault();
        onSave(newSection);
        setIsAdding(false);
        setNewSection({ name: '', description: '', color: '#007bff', includeManagementDate: false, showInDashboard: true });
    };

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Secciones de Evaluación</h4>
            <CollapsibleCard>
                {currentUser && (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                                {isAdding ? 'Cancelar' : 'Agregar Sección'}
                            </button>
                        </div>
                        {isAdding && (
                            <form onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>Nombre de la Sección</label>
                                    <input type="text" className="form-control" value={newSection.name} onChange={(e) => setNewSection({ ...newSection, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Descripción (para tooltip)</label>
                                    <textarea className="form-control" rows="3" value={newSection.description} onChange={(e) => setNewSection({ ...newSection, description: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <ColorPicker
                                        selectedColor={newSection.color}
                                        onChange={(color) => setNewSection({ ...newSection, color })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                        <input type="checkbox" checked={newSection.includeManagementDate} onChange={(e) => setNewSection({ ...newSection, includeManagementDate: e.target.checked })} style={{ marginRight: '10px' }}/>
                                        Incluir "Fecha de Gestión"
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                        <input type="checkbox" checked={newSection.showInDashboard} onChange={(e) => setNewSection({ ...newSection, showInDashboard: e.target.checked })} style={{ marginRight: '10px' }}/>
                                        Incluir sección en Dashboard
                                    </label>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Sección</button>
                            </form>
                        )}
                    </>
                )}
                <ul className="config-list">
                    {evaluationSections.map((section, index) => (
                        <li key={section.id} className="config-list-item">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <div style={{width: '15px', height: '15px', backgroundColor: section.color, borderRadius: '3px', border: '1px solid #ccc'}}></div>
                                <Tooltip text={section.description || 'Sin descripción'}>
                                    <span>{section.name}</span>
                                </Tooltip>
                                {section.includeManagementDate && <span className="badge">Fecha Gestión</span>}
                                {section.showInDashboard && <span className="badge" style={{backgroundColor: '#C1E1C1'}}>En Dashboard</span>}
                            </div>
                            {currentUser && (
                                <div className="config-actions">
                                    <button className="btn-icon" onClick={() => onMove(section.id, 'up')} disabled={index === 0} title="Mover hacia arriba">↑</button>
                                    <button className="btn-icon" onClick={() => onMove(section.id, 'down')} disabled={index === evaluationSections.length - 1} title="Mover hacia abajo">↓</button>
                                    <button className="btn-icon" onClick={() => onEdit(section, 'evaluationSections', [
                                        { name: 'name', label: 'Nombre de la Sección' },
                                        { name: 'description', label: 'Descripción', type: 'textarea' },
                                        { name: 'color', label: 'Color', type: 'color_picker' },
                                        { name: 'includeManagementDate', label: 'Funcionalidad Extra', type: 'checkbox', checkboxLabel: 'Incluir "Fecha de Gestión"' },
                                        { name: 'showInDashboard', label: 'Visibilidad', type: 'checkbox', checkboxLabel: 'Incluir sección en Dashboard' }
                                    ])}>✏️</button>
                                    {!section.isDefault && <button className="btn-icon btn-icon-danger" onClick={() => onDelete('evaluationSections', section.id)}>🗑️</button>}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageSections;
