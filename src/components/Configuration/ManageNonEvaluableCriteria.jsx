import React, { useState } from 'react';
import Tooltip from '../Tooltip';
import CollapsibleCard from '../CollapsibleCard';

const ManageNonEvaluableCriteria = ({
    nonEvaluableCriteria,
    evaluationSections,
    currentUser,
    handleSaveNonEvaluableCriterion,
    handleEditClick,
    handleDelete,
    getNonEvaluableSubtitle,
    getNonEvaluableEditFields
}) => {
    const [newCriterion, setNewCriterion] = useState({
        name: '',
        description: '',
        section: evaluationSections[0]?.name || '',
        trackInDashboard: false,
        trackEmptyInDashboard: false,
        inputType: 'text',
        options: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSaveNonEvaluableCriterion(newCriterion);
        setNewCriterion({
            name: '',
            description: '',
            section: newCriterion.section,
            trackInDashboard: false,
            trackEmptyInDashboard: false,
            inputType: 'text',
            options: ''
        });
    };
    
    const groupedCriteria = nonEvaluableCriteria.reduce((acc, criterion) => {
        const sectionName = criterion.section || 'Sin Sección';
        if (!acc[sectionName]) acc[sectionName] = [];
        acc[sectionName].push(criterion);
        return acc;
    }, {});

    return (
        <div className="card">
            <h4 className="card-title card-title-primary">Gestionar Criterios no Evaluables</h4>
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
                            <select className="form-control" value={newCriterion.section} onChange={(e) => setNewCriterion({ ...newCriterion, section: e.target.value })}>
                                 <option value="" disabled>Selecciona una sección</option>
                                {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo de Campo</label>
                            <select className="form-control" value={newCriterion.inputType} onChange={(e) => setNewCriterion({ ...newCriterion, inputType: e.target.value })}>
                                <option value="text">Texto</option>
                                <option value="select">Desplegable</option>
                            </select>
                        </div>
                        {newCriterion.inputType === 'select' && (
                            <div className="form-group">
                                <label>Opciones (separadas por comas)</label>
                                <input type="text" className="form-control" value={newCriterion.options} onChange={(e) => setNewCriterion({ ...newCriterion, options: e.target.value })} />
                            </div>
                        )}
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                <input type="checkbox" checked={newCriterion.trackInDashboard} onChange={(e) => setNewCriterion({ ...newCriterion, trackInDashboard: e.target.checked })} style={{ marginRight: '10px' }}/>
                                Mostrar desglose de valores en Dashboard
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                <input type="checkbox" checked={newCriterion.trackEmptyInDashboard} onChange={(e) => setNewCriterion({ ...newCriterion, trackEmptyInDashboard: e.target.checked })} style={{ marginRight: '10px' }}/>
                                Contar N/A o vacíos en Dashboard
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio no Evaluable</button>
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
                                        <span>{item.name} {getNonEvaluableSubtitle(item)}</span>
                                    </Tooltip>
                                    {currentUser && (
                                        <div className="config-actions">
                                            <button className="btn-icon" onClick={() => handleEditClick(item, 'nonEvaluableCriteria', getNonEvaluableEditFields(item))}>✏️</button>
                                            <button onClick={() => handleDelete('nonEvaluableCriteria', item.id)} className="btn-icon btn-icon-danger">🗑️</button>
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

export default ManageNonEvaluableCriteria;
