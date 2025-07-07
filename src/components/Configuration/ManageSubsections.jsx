import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';

const ManageSubsections = ({ 
    evaluationSections, 
    aptitudeSubsections, 
    currentUser, 
    handleSaveSubsection,
    handleEditClick, 
    handleMoveSubsection,
    handleDelete 
}) => {
    const [selectedSection, setSelectedSection] = useState(evaluationSections[0]?.name || '');
    const [newSubsection, setNewSubsection] = useState({ 
        name: '', 
        description: '', 
        displayAsTooltip: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newSubsection.name.trim() && selectedSection) {
            handleSaveSubsection({ ...newSubsection, section: selectedSection });
            setNewSubsection({ name: '', description: '', displayAsTooltip: true });
        }
    };

    const filteredSubsections = aptitudeSubsections.filter(sub => sub.section === selectedSection);

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Subsecciones</h4>
            <CollapsibleCard>
                {currentUser && (
                    <form onSubmit={handleSubmit} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>Sección Principal</label>
                            <select className="form-control" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                                {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Nombre de la Subsección</label>
                            <input type="text" className="form-control" value={newSubsection.name} onChange={(e) => setNewSubsection({ ...newSubsection, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Descripción (para Tooltip)</label>
                            <textarea className="form-control" rows="2" value={newSubsection.description} onChange={(e) => setNewSubsection({ ...newSubsection, description: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar Subsección</button>
                    </form>
                )}
                <ul className="config-list">
                    {filteredSubsections.map((sub, index) => (
                         <li key={sub.id} className="config-list-item">
                             <Tooltip text={sub.description || 'Sin descripción'}>
                                 <span>{sub.name}</span>
                             </Tooltip>
                             {currentUser && (
                             <div className="config-actions">
                                 <button className="btn-icon" onClick={() => handleEditClick(sub, 'aptitudeSubsections', [
                                     { name: 'name', label: 'Nombre' },
                                     { name: 'description', label: 'Descripción', type: 'textarea' },
                                     { name: 'displayAsTooltip', label: 'Mostrar como Tooltip', type: 'checkbox', checkboxLabel: 'Mostrar como Tooltip' },
                                     { name: 'section', label: 'Sección Principal', type: 'select', options: evaluationSections.map(s => ({value: s.name, label: s.name})) }
                                 ])}>✏️</button>
                                 <button className="btn-icon" onClick={() => handleMoveSubsection(sub.id, selectedSection, 'up')} disabled={index === 0} title="Mover hacia arriba">↑</button>
                                 <button className="btn-icon" onClick={() => handleMoveSubsection(sub.id, selectedSection, 'down')} disabled={index === filteredSubsections.length - 1} title="Mover hacia abajo">↓</button>
                                 <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('aptitudeSubsections', sub.id)}>🗑️</button>
                             </div>
                             )}
                         </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageSubsections;
