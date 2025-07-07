import React, { useState } from 'react';
import CollapsibleCard from '../CollapsibleCard';

const ManageEvaluableCriteria = ({ 
    criteria,
    evaluationSections,
    aptitudeSubsections,
    currentUser,
    handleSaveCriterion,
    handleEditClick,
    handleDelete,
    getEvaluableEditFields,
}) => {
    const [newCriterion, setNewCriterion] = useState({ 
        name: '', 
        description: '', 
        displayDescription: false, 
        section: evaluationSections[0]?.name || '',
        subsection: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveCriterion(newCriterion);
        setNewCriterion({ name: '', description: '', displayDescription: false, section: evaluationSections[0]?.name || '', subsection: '' });
    };

    const filteredSubsections = aptitudeSubsections.filter(s => s.section === newCriterion.section);

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Criterios Evaluables</h4>
            <CollapsibleCard>
                {currentUser && (
                    <form onSubmit={handleSubmit} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>Nombre del Criterio</label>
                            <input type="text" className="form-control" value={newCriterion.name} onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea className="form-control" rows="2" value={newCriterion.description} onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })} />
                        </div>
                         <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                <input type="checkbox" checked={newCriterion.displayDescription} onChange={(e) => setNewCriterion({ ...newCriterion, displayDescription: e.target.checked })} />
                                <span style={{ marginLeft: '10px' }}>Desplegar Descripción</span>
                            </label>
                        </div>
                        <div className="form-group">
                            <label>Sección Principal</label>
                            <select className="form-control" value={newCriterion.section} onChange={(e) => setNewCriterion({ ...newCriterion, section: e.target.value, subsection: '' })}>
                                {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        {newCriterion.section === 'Aptitudes Transversales' && (
                             <div className="form-group">
                                <label>Subsección (Opcional)</label>
                                <select className="form-control" value={newCriterion.subsection} onChange={(e) => setNewCriterion({ ...newCriterion, subsection: e.target.value })}>
                                    <option value="">Sin Subsección</option>
                                    {filteredSubsections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio</button>
                    </form>
                )}
                 <ul className="config-list">
                    {criteria.map(c => (
                        <li key={c.id} className="config-list-item">
                            <div>
                                <strong>{c.name}</strong>
                                <span className="badge">{c.section}</span>
                                {c.subsection && <span className="badge">{c.subsection}</span>}
                            </div>
                            {currentUser && (
                            <div className="config-actions">
                                <button className="btn-icon" onClick={() => handleEditClick(c, 'criteria', [
                                    ...getEvaluableEditFields(c),
                                    { name: 'displayDescription', label: 'Visibilidad de la Descripción', type: 'checkbox', checkboxLabel: 'Desplegar Descripción' }
                                ])}>✏️</button>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('criteria', c.id)}>🗑️</button>
                            </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CollapsibleCard>
        </div>
    );
};

export default ManageEvaluableCriteria;
