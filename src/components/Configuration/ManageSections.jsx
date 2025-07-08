import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';
import ColorPicker from './ColorPicker';
import RichTextEditor from '../RichTextEditor';
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
        displayDescription: false,
        displayAsTooltip: false,
        color: '#007bff', 
        includeManagementDate: false,
        showInDashboard: true,
        scaleType: '1-10' // Nuevo campo
    });

    const handleSave = (e) => {
        e.preventDefault();
        onSave(newSection);
        setIsAdding(false);
        setNewSection({ name: '', description: '', displayDescription: false, displayAsTooltip: false, color: '#007bff', includeManagementDate: false, showInDashboard: true, scaleType: '1-10' });
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
                                    <label>Tipo de Escala</label>
                                    <select className="form-control" value={newSection.scaleType} onChange={(e) => setNewSection({ ...newSection, scaleType: e.target.value })}>
                                        <option value="1-10">1 a 10</option>
                                        <option value="binary">Cumple / No Cumple</option>
                                        <option value="1-5">1 a 5</option>
                                        <option value="percentage">Porcentajes (0-100)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Descripción</label>
                                    <RichTextEditor value={newSection.description} onChange={(value) => setNewSection({ ...newSection, description: value })} />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="checkbox" checked={newSection.displayDescription} onChange={(e) => setNewSection({ ...newSection, displayDescription: e.target.checked })} />
                                        <span style={{ marginLeft: '10px' }}>Desplegar Descripción</span>
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="checkbox" checked={newSection.displayAsTooltip} onChange={(e) => setNewSection({ ...newSection, displayAsTooltip: e.target.checked })} />
                                        <span style={{ marginLeft: '10px' }}>Mostrar como Tooltip</span>
                                    </label>
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <ColorPicker
                                        color={newSection.color}
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
                                        { name: 'scaleType', label: 'Tipo de Escala', type: 'select', options: [
                                            { value: '1-10', label: '1 a 10' },
                                            { value: 'binary', label: 'Cumple / No Cumple' },
                                            { value: '1-5', label: '1 a 5' },
                                            { value: 'percentage', label: 'Porcentajes (0-100)' }
                                        ]},
                                        { name: 'description', label: 'Descripción', type: 'richtext' },
                                        { name: 'displayDescription', label: 'Visibilidad de la Descripción', type: 'checkbox', checkboxLabel: 'Desplegar Descripción' },
                                        { name: 'displayAsTooltip', label: 'Mostrar como Tooltip', type: 'checkbox', checkboxLabel: 'Mostrar como Tooltip' },
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
