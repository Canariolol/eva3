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
    const [isAdding, setIsAdding] = useState(false);
    const [newSubsection, setNewSubsection] = useState({ name: '', section: evaluationSections[0]?.name || '' });

    const handleSave = (e) => {
        e.preventDefault();
        handleSaveSubsection(newSubsection);
        setIsAdding(false);
        setNewSubsection({ name: '', section: newSubsection.section });
    };

    const groupedSubsections = aptitudeSubsections.reduce((acc, sub) => {
        const sectionName = sub.section || 'Sin Asignar';
        if (!acc[sectionName]) {
            acc[sectionName] = [];
        }
        acc[sectionName].push(sub);
        return acc;
    }, {});

    const sectionOrder = [...evaluationSections.map(s => s.name)];
    if (groupedSubsections['Sin Asignar'] && !sectionOrder.includes('Sin Asignar')) {
        sectionOrder.push('Sin Asignar');
    }

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Subsecciones</h4>
            <CollapsibleCard>
                {currentUser && (
                    <form onSubmit={handleSave} style={{marginBottom: '2rem'}}>
                        <div className="form-group">
                            <label>Nombre de la Subsección</label>
                            <input type="text" className="form-control" value={newSubsection.name} onChange={(e) => setNewSubsection({...newSubsection, name: e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Asignar a Sección Principal</label>
                            <select className="form-control" value={newSubsection.section} onChange={(e) => setNewSubsection({...newSubsection, section: e.target.value})}>
                                <option value="" disabled>Selecciona una sección</option>
                                {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Subsección</button>
                    </form>
                )}
                {sectionOrder.map(sectionName => {
                    const subs = groupedSubsections[sectionName] ? groupedSubsections[sectionName].sort((a,b) => a.order - b.order) : [];
                    if (subs.length === 0) return null;
                    return (
                        <div key={sectionName}>
                            <h5 className="config-list-subheader">{sectionName}</h5>
                            <ul className="config-list">
                                {subs.map((sub, index) => (
                                    <li key={sub.id} className="config-list-item">
                                        <Tooltip text="Subsección de Criterios">
                                            <span>{sub.name}</span>
                                        </Tooltip>
                                        {currentUser && (
                                        <div className="config-actions">
                                            <button className="btn-icon" onClick={() => handleEditClick(sub, 'aptitudeSubsections', [{ name: 'name', label: 'Nombre' }, { name: 'section', label: 'Sección Principal', type: 'select', options: evaluationSections.map(s => ({value: s.name, label: s.name})) }])}>✏️</button>
                                            <button className="btn-icon" onClick={() => handleMoveSubsection(sub.id, sectionName, 'up')} disabled={index === 0} title="Mover hacia arriba">↑</button>
                                            <button className="btn-icon" onClick={() => handleMoveSubsection(sub.id, sectionName, 'down')} disabled={index === subs.length - 1} title="Mover hacia abajo">↓</button>
                                            <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('aptitudeSubsections', sub.id)}>🗑️</button>
                                        </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </CollapsibleCard>
        </div>
    );
};

export default ManageSubsections;
