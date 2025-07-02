import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import Tooltip from '../components/Tooltip';
import CollapsibleCard from '../components/CollapsibleCard';
import EditModal from '../components/EditModal';

const Configuration = () => {
    const { 
        executives, 
        criteria, 
        nonEvaluableCriteria, 
        aptitudeSubsections, 
        executiveFields, 
        evaluationSections,
        headerInfo,
        headerInfoId,
        refreshData,
        setHeaderInfo,
    } = useGlobalContext();
    const { currentUser } = useAuth();

    const [newField, setNewField] = useState({ name: '' });
    const [newExecutive, setNewExecutive] = useState({});
    const [newCriterion, setNewCriterion] = useState({ name: '', description: '', section: '', subsection: '' });
    const [newNonEvaluableCriterion, setNewNonEvaluableCriterion] = useState({
        name: '',
        description: '',
        section: '',
        trackInDashboard: false,
        trackEmptyInDashboard: false,
        inputType: 'text',
        options: ''
    });
    const [newSubsection, setNewSubsection] = useState({ name: '' });
    const [newEvaluationSection, setNewEvaluationSection] = useState({ name: '', description: '' });
    const [isCreatingSubsection, setIsCreatingSubsection] = useState(false);
    const [error, setError] = useState('');
    const [isAddingExecutive, setIsAddingExecutive] = useState(false);
    const [isAddingSection, setIsAddingSection] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });

    useEffect(() => {
        if (evaluationSections.length > 0) {
            const defaultSection = evaluationSections[0].name;
            setNewCriterion(prev => ({ ...prev, section: prev.section || defaultSection }));
            setNewNonEvaluableCriterion(prev => ({ ...prev, section: prev.section || defaultSection }));
        }
    }, [evaluationSections]);
    
    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedItem) => {
        if (!editedItem.id) return;
        
        const { id, ...dataToSave } = editedItem;

        if (editConfig.collection === 'nonEvaluableCriteria' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        }

        await updateDoc(doc(db, editConfig.collection, id), dataToSave);
        await refreshData();
        setIsEditModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveEvaluationSection = async (e) => {
        e.preventDefault();
        if (!newEvaluationSection.name) return;
        const maxOrder = evaluationSections.reduce((max, section) => Math.max(section.order || 0, max), 0);
        await addDoc(collection(db, 'evaluationSections'), { ...newEvaluationSection, order: maxOrder + 1 });
        setNewEvaluationSection({ name: '', description: '' });
        setIsAddingSection(false);
        await refreshData();
    };
    
    const handleSaveHeaderInfo = async (e) => {
        e.preventDefault();
        try {
            if (headerInfoId) {
                await setDoc(doc(db, 'headerInfo', headerInfoId), headerInfo);
            } else {
                const newDocRef = await addDoc(collection(db, 'headerInfo'), headerInfo);
                setHeaderInfo(newDocRef.id);
            }
            await refreshData();
        } catch (err) {
            setError('Error al guardar la información del encabezado.');
        }
    };

    const handleSaveField = async (e) => {
        e.preventDefault();
        if (!newField.name) return;
        const maxOrder = executiveFields.reduce((max, field) => Math.max(field.order || 0, max), 0);
        await addDoc(collection(db, 'executiveFields'), { name: newField.name, order: maxOrder + 1, isDefault: false });
        setNewField({ name: '' });
        await refreshData();
    };

    const handleSaveExecutive = async (e) => {
        e.preventDefault();
        if (Object.values(newExecutive).some(val => !val)) return; 
        await addDoc(collection(db, 'executives'), newExecutive);
        setNewExecutive({});
        setIsAddingExecutive(false);
        await refreshData();
    };
    
    const handleSaveCriterion = async (e) => {
        e.preventDefault();
        if (!newCriterion.name || !newCriterion.section) return;
        let dataToSave = { ...newCriterion };
        if (dataToSave.section !== 'Aptitudes Transversales') {
            delete dataToSave.subsection;
        }
        await addDoc(collection(db, 'criteria'), dataToSave);
        setNewCriterion({ name: '', description: '', section: evaluationSections.length > 0 ? evaluationSections[0].name : '', subsection: '' });
        await refreshData();
    };
    
    const handleSaveSubsection = async () => {
        if (!newSubsection.name) return;
        const maxOrder = aptitudeSubsections.reduce((max, sub) => Math.max(sub.order || 0, max), 0);
        await addDoc(collection(db, 'aptitudeSubsections'), { ...newSubsection, order: maxOrder + 1 });
        await refreshData();
        setNewCriterion(prev => ({...prev, subsection: newSubsection.name}));
        setNewSubsection({ name: '' });
        setIsCreatingSubsection(false);
    };

    const handleSubsectionChange = (e) => {
        if (e.target.value === '__CREATE__') {
            setIsCreatingSubsection(true);
            setNewCriterion(prev => ({ ...prev, subsection: '' }));
        } else {
            setIsCreatingSubsection(false);
            setNewCriterion(prev => ({ ...prev, subsection: e.target.value }));
        }
    };

    const handleSaveNonEvaluableCriterion = async (e) => {
        e.preventDefault();
        if (!newNonEvaluableCriterion.name || !newNonEvaluableCriterion.section) return;
        
        const dataToSave = { ...newNonEvaluableCriterion };
        if (dataToSave.inputType === 'select' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        } else if (dataToSave.inputType === 'text') {
            delete dataToSave.options;
        }

        await addDoc(collection(db, 'nonEvaluableCriteria'), dataToSave);
        setNewNonEvaluableCriterion({ name: '', description: '', section: evaluationSections.length > 0 ? evaluationSections[0].name : '', trackInDashboard: false, trackEmptyInDashboard: false, inputType: 'text', options: '' });
        await refreshData();
    };
    
    const handleDelete = async (collectionName, id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
             if (collectionName === 'evaluationSections') {
                const sectionToDelete = evaluationSections.find(s => s.id === id);
                const criteriaUsingSection = criteria.filter(c => c.section === sectionToDelete?.name);
                const nonEvaluableCriteriaUsingSection = nonEvaluableCriteria.filter(c => c.section === sectionToDelete?.name);
                 if (criteriaUsingSection.length > 0 || nonEvaluableCriteriaUsingSection.length > 0) {
                    setError(`No se puede eliminar la sección porque está en uso.`);
                    setTimeout(() => setError(''), 5000);
                    return;
                }
            }
            await deleteDoc(doc(db, collectionName, id));
            await refreshData();
        }
    };

    const defaultFieldsNames = ['Nombre', 'Cargo', 'Área'];

    const getNonEvaluableSubtitle = (item) => {
        const parts = [];
        parts.push(item.inputType === 'select' ? 'Desplegable' : 'Texto');
        if (item.trackInDashboard) parts.push('Seguimiento Detallado');
        if (item.trackEmptyInDashboard) parts.push('Conteo Vacíos');
        return `(${parts.join(', ')})`;
    };
    
    const getEvaluableEditFields = (item) => [
        { name: 'name', label: 'Nombre del Criterio' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'section', label: 'Sección', type: 'select', options: evaluationSections.map(s => ({ value: s.name, label: s.name })) },
        ...(item.section === 'Aptitudes Transversales' ? [{ name: 'subsection', label: 'Subsección (Aptitudes)', type: 'select', options: [{value: '', label: 'Sin Subsección'}, ...aptitudeSubsections.map(s => ({value: s.name, label: s.name}))] }] : [])
    ];
    
    const getNonEvaluableEditFields = (item) => [
        { name: 'name', label: 'Nombre del Criterio' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'section', label: 'Sección', type: 'select', options: evaluationSections.map(s => ({ value: s.name, label: s.name })) },
        { name: 'inputType', label: 'Tipo de Campo', type: 'select', options: [{value: 'text', label: 'Texto'}, {value: 'select', label: 'Desplegable'}] },
        ...(item.inputType === 'select' ? [{ name: 'options', label: 'Opciones (separadas por comas)'}] : []),
        { name: 'trackInDashboard', label: 'Seguimiento Detallado', type: 'checkbox', checkboxLabel: 'Mostrar desglose de valores en Dashboard' },
        { name: 'trackEmptyInDashboard', label: 'Conteo de Vacíos', type: 'checkbox', checkboxLabel: 'Contar valores N/A o vacíos en Dashboard' }
    ];
    
    return (
        <div>
            <h1>Configuración</h1>
            {isEditModalOpen && currentUser && (
                <EditModal 
                    item={itemToEdit}
                    onSave={handleSaveEdit}
                    onCancel={() => setIsEditModalOpen(false)}
                    fields={editConfig.fields}
                />
            )}
            {error && <p className="error-message">{error}</p>}
            <div className="config-grid">
                
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Ejecutivos</h4>
                    <CollapsibleCard>
                        {currentUser && (
                        <div style={{ marginBottom: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => setIsAddingExecutive(!isAddingExecutive)}>
                                {isAddingExecutive ? 'Cancelar' : 'Agregar Ejecutivo'}
                            </button>
                        </div>
                        )}
                        {isAddingExecutive && currentUser && (
                            <form onSubmit={handleSaveExecutive}>
                                {executiveFields.map(field => (
                                    <div className="form-group" key={field.id}>
                                        <label>{field.name}</label>
                                        <input type="text" className="form-control" value={newExecutive[field.name] || ''} onChange={(e) => setNewExecutive({ ...newExecutive, [field.name]: e.target.value })} />
                                    </div>
                                ))}
                                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Ejecutivo</button>
                            </form>
                        )}
                        <ul className="config-list">
                            {executives.map(exec => (
                                <li key={exec.id} className="config-list-item">
                                    <Tooltip text={exec.Cargo || 'Sin Cargo'}>
                                        <span>{exec.Nombre}</span>
                                    </Tooltip>
                                    {currentUser && (
                                    <div className="config-actions">
                                        <button className="btn-icon" onClick={() => handleEditClick(exec, 'executives', executiveFields.map(f => ({ name: f.name, label: f.name })))}>✏️</button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executives', exec.id)}>🗑️</button>
                                    </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </CollapsibleCard>
                </div>

                 <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Secciones de Evaluación</h4>
                    <CollapsibleCard>
                        {currentUser && (
                            <>
                                <div style={{ marginBottom: '1rem' }}>
                                    <button className="btn btn-primary" onClick={() => setIsAddingSection(!isAddingSection)}>
                                        {isAddingSection ? 'Cancelar' : 'Agregar Sección'}
                                    </button>
                                </div>
                                {isAddingSection && (
                                    <form onSubmit={handleSaveEvaluationSection}>
                                        <div className="form-group">
                                            <label>Nombre de la Sección</label>
                                            <input type="text" className="form-control" value={newEvaluationSection.name} onChange={(e) => setNewEvaluationSection({ ...newEvaluationSection, name: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Descripción (para tooltip)</label>
                                            <textarea className="form-control" rows="3" value={newEvaluationSection.description} onChange={(e) => setNewEvaluationSection({ ...newEvaluationSection, description: e.target.value })} />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Sección</button>
                                    </form>
                                )}
                            </>
                        )}
                        <ul className="config-list">
                            {evaluationSections.map(section => (
                                <li key={section.id} className="config-list-item">
                                    <Tooltip text={section.description || 'Sin descripción'}>
                                        <span>{section.name}</span>
                                    </Tooltip>
                                    {currentUser && (
                                        <div className="config-actions">
                                            <button className="btn-icon" onClick={() => handleEditClick(section, 'evaluationSections', [
                                                { name: 'name', label: 'Nombre de la Sección' },
                                                { name: 'description', label: 'Descripción', type: 'textarea' }
                                            ])}>✏️</button>
                                            <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('evaluationSections', section.id)}>🗑️</button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </CollapsibleCard>
                </div>

                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios Evaluables</h4>
                    <CollapsibleCard>
                        {currentUser && (
                        <form onSubmit={handleSaveCriterion}>
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
                                <select className="form-control" value={newCriterion.section} onChange={(e) => { setNewCriterion({ ...newCriterion, section: e.target.value, subsection: '' }); setIsCreatingSubsection(false); }}>
                                    <option value="" disabled>Selecciona una sección</option>
                                    {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            {newCriterion.section === 'Aptitudes Transversales' && (
                                <div className="form-group">
                                    <label>Subsección</label>
                                    <select className="form-control" value={newCriterion.subsection} onChange={handleSubsectionChange}>
                                        <option value="">Sin Subsección</option>
                                        {aptitudeSubsections.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                                        <option value="__CREATE__">--- Crear nueva subsección ---</option>
                                    </select>
                                    {isCreatingSubsection && (
                                        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                            <input type="text" className="form-control" placeholder="Nombre de la nueva subsección" value={newSubsection.name} onChange={e => setNewSubsection({name: e.target.value})} />
                                            <button type="button" className="btn btn-primary" onClick={handleSaveSubsection}>Crear</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio</button>
                        </form>
                        )}
                        <hr style={{margin: '2rem 0'}}/>
                        <h5 style={{marginTop: '0'}}>Listado de Criterios</h5>
                        <ul className="config-list">
                            {criteria.map(item => (
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
                    </CollapsibleCard>
                </div>

                 <div className="card">
                     <h4 className="card-title card-title-primary">Ordenar Subsecciones de Aptitudes</h4>
                     <CollapsibleCard>
                        <ul className="config-list">
                            {aptitudeSubsections.map((sub, index) => (
                                <li key={sub.id} className="config-list-item">
                                    <span>{sub.name}</span>
                                    {currentUser && (
                                    <div className="config-actions">
                                        <button className="btn-icon" onClick={() => handleEditClick(sub, 'aptitudeSubsections', [{ name: 'name', label: 'Nombre de la Subsección' }])}>✏️</button>
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => handleMoveSubsection(sub.id, 'up')}
                                            disabled={index === 0}
                                            aria-label={`Mover ${sub.name} hacia arriba`}
                                            title="Mover hacia arriba"
                                        >
                                            ↑
                                        </button>
                                        <button 
                                            className="btn-icon" 
                                            onClick={() => handleMoveSubsection(sub.id, 'down')}
                                            disabled={index === aptitudeSubsections.length - 1}
                                            aria-label={`Mover ${sub.name} hacia abajo`}
                                            title="Mover hacia abajo"
                                        >
                                            ↓
                                        </button>
                                        <button 
                                            className="btn-icon btn-icon-danger" 
                                            onClick={() => handleDelete('aptitudeSubsections', sub.id)}
                                            aria-label={`Eliminar ${sub.name}`}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </CollapsibleCard>
                </div>

                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios no Evaluables</h4>
                    <CollapsibleCard>
                        {currentUser && (
                        <form onSubmit={handleSaveNonEvaluableCriterion}>
                            <div className="form-group">
                                <label>Nombre del Criterio</label>
                                <input type="text" className="form-control" value={newNonEvaluableCriterion.name} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, name: e.target.value })}/>
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea className="form-control" rows="2" value={newNonEvaluableCriterion.description} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Sección</label>
                                <select className="form-control" value={newNonEvaluableCriterion.section} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, section: e.target.value })}>
                                     <option value="" disabled>Selecciona una sección</option>
                                    {evaluationSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tipo de Campo</label>
                                <select className="form-control" value={newNonEvaluableCriterion.inputType} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, inputType: e.target.value })}>
                                    <option value="text">Texto</option>
                                    <option value="select">Desplegable</option>
                                </select>
                            </div>
                            {newNonEvaluableCriterion.inputType === 'select' && (
                                <div className="form-group">
                                    <label>Opciones (separadas por comas)</label>
                                    <input type="text" className="form-control" value={newNonEvaluableCriterion.options} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, options: e.target.value })} />
                                </div>
                            )}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                    <input type="checkbox" checked={newNonEvaluableCriterion.trackInDashboard} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, trackInDashboard: e.target.checked })} style={{ marginRight: '10px' }}/>
                                    Mostrar desglose de valores en Dashboard
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                                    <input type="checkbox" checked={newNonEvaluableCriterion.trackEmptyInDashboard} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, trackEmptyInDashboard: e.target.checked })} style={{ marginRight: '10px' }}/>
                                    Contar N/A o vacíos en Dashboard
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio no Evaluable</button>
                        </form>
                        )}
                        <hr style={{margin: '2rem 0'}}/>
                        <h5 style={{marginTop: '0'}}>Listado de Criterios</h5>
                        <ul className="config-list">
                            {nonEvaluableCriteria.map(item => (
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
                    </CollapsibleCard>
                </div>
                
                <div className="card">
                     <h4 className="card-title card-title-primary">Gestionar Campos de Creación de Ejecutivos</h4>
                    <CollapsibleCard>
                        {currentUser && (
                        <form onSubmit={handleSaveField}>
                            <div className="form-group">
                                <label>Añadir Campo Adicional</label>
                                <input type="text" className="form-control" value={newField.name} onChange={(e) => setNewField({ ...newField, name: e.target.value })}/>
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
                
                <div className="card">
                    <h4 className="card-title card-title-primary">Información de la Organización</h4>
                    <CollapsibleCard>
                    {currentUser && (
                    <form onSubmit={handleSaveHeaderInfo}>
                        <div className="form-group">
                            <label>Nombre de la Empresa</label>
                            <input type="text" className="form-control" value={headerInfo.company} onChange={(e) => setHeaderInfo({...headerInfo, company: e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Área de Evaluaciones</label>
                            <input type="text" className="form-control" value={headerInfo.area} onChange={(e) => setHeaderInfo({...headerInfo, area: e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Nombre del Encargado</label>
                            <input type="text" className="form-control" value={headerInfo.manager} onChange={(e) => setHeaderInfo({...headerInfo, manager: e.target.value})}/>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Información</button>
                    </form>
                    )}
                    </CollapsibleCard>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
