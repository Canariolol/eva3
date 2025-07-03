import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';

const ManageEvaluableCriteria = ({
    criteria,
    evaluationSections,
    aptitudeSubsections,
    currentUser,
    handleSaveCriterion,
    handleEditClick,
    handleDelete
}) => {
    const [newCriterion, setNewCriterion] = useState({ name: '', description: '', section: evaluationSections[0]?.name || '', subsection: '' });
    
    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveCriterion(newCriterion);
        setNewCriterion({ name: '', description: '', section: newCriterion.section, subsection: '' });
    };

    const groupedCriteria = criteria.reduce((acc, criterion) => {
        const sectionName = criterion.section || 'Sin Sección';
        if (!acc[sectionName]) acc[sectionName] = [];
        acc[sectionName].push(criterion);
        return acc;
    }, {});

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Criterios Evaluables</h4>
            <CollapsibleCard>
                {currentUser && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nombre del Criterio</label>
                            <input type="text" className="form-control" value={newCriterion.name} onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea className="form-control" rows="2" value={newCriterion.description} onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Sección</label>
                            <select className="form-control" value={newCriterion.section} onChange={(e) => setNewCriterion({ ...newCriterion, section: e.target.value, subsection: '' })}>
                                <option value="" disabled>Selecciona una sección</option>
                                {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        {newCriterion.section && (
                            <div className="form-group">
                                <label>Subsección</label>
                                <select className="form-control" value={newCriterion.subsection} onChange={(e) => setNewCriterion({...newCriterion, subsection: e.target.value})}>
                                    <option value="">Sin Subsección</option>
                                    {aptitudeSubsections.filter(s => s.section === newCriterion.section).map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio</button>
                    </form>
                )}
                <hr style={{margin: '2rem 0'}}/>
                <h5 style={{marginTop: '0'}}>Listado de Criterios</h5>
                {Object.keys(groupedCriteria).map(sectionName => (
                    <div key={sectionName}>
                        <h5 className="config-list-subheader">{sectionName}</h5>
                        <ul className="config-list">
                            {groupedCriteria[sectionName].map(item => (
                                <li key={item.id} className="config-list-item">
                                    <Tooltip text={item.description || 'Sin descripción'}>
                                        <span>{item.name}</span>
                                    </Tooltip>
                                    {currentUser && (
                                        <div className="config-actions">
                                            <button className="btn-icon" onClick={() => handleEditClick(item, 'criteria', getEvaluableEditFields(item))}>✏️</button>
                                            <button onClick={() => handleDelete('criteria', item.id)} className="btn-icon btn-icon-danger">🗑️</button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </CollapsibleCard>
        </div>
    );
};

// Helper function to be passed from the parent, defined here for clarity
const getEvaluableEditFields = (item, evaluationSections, aptitudeSubsections) => [
    { name: 'name', label: 'Nombre del Criterio' },
    { name: 'description', label: 'Descripción', type: 'textarea' },
    { name: 'section', label: 'Sección', type: 'select', options: evaluationSections.map(s => ({ value: s.name, label: s.name })) },
    { name: 'subsection', label: 'Subsección', type: 'select', options: [{value: '', label: 'Sin Subsección'}, ...aptitudeSubsections.filter(s => s.section === item.section).map(s => ({value: s.name, label: s.name}))] }
];


export { ManageEvaluableCriteria, getEvaluableEditFields };
