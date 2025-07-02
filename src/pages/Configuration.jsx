import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';

// A generic modal for editing
const EditModal = ({ item, onSave, onCancel, fields }) => {
    const [editedItem, setEditedItem] = useState(item);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditedItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = () => {
        onSave(editedItem);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Editar Elemento</h2>
                {fields.map(field => (
                    <div className="form-group" key={field.name}>
                        <label>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                className="form-control"
                                name={field.name}
                                value={editedItem[field.name] || ''}
                                onChange={handleChange}
                            >
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : field.type === 'checkbox' ? (
                            <div style={{marginTop: '0.5rem'}}>
                                <input
                                    type="checkbox"
                                    name={field.name}
                                    checked={editedItem[field.name] || false}
                                    onChange={handleChange}
                                />
                                <span style={{marginLeft: '0.5rem'}}>{field.checkboxLabel}</span>
                            </div>
                        ) : (
                            <input
                                type={field.type || 'text'}
                                className="form-control"
                                name={field.name}
                                value={editedItem[field.name] || ''}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};


const Configuration = () => {
    const { 
        executives, 
        criteria, 
        nonEvaluableCriteria, 
        aptitudeSubsections, 
        executiveFields, 
        headerInfo,
        headerInfoId,
        refreshData,
        setHeaderInfo,
    } = useGlobalContext();
    const { currentUser } = useAuth();

    const [showAllEvaluable, setShowAllEvaluable] = useState(false);
    const [showAllNonEvaluable, setShowAllNonEvaluable] = useState(false);
    const INITIAL_VISIBLE_COUNT = 4;

    const [newField, setNewField] = useState({ name: '' });
    const [newExecutive, setNewExecutive] = useState({});
    const [newCriterion, setNewCriterion] = useState({ name: '', section: 'Aptitudes Transversales', subsection: '' });
    const [newNonEvaluableCriterion, setNewNonEvaluableCriterion] = useState({
        name: '',
        section: 'Aptitudes Transversales',
        trackInDashboard: false,
        trackEmptyInDashboard: false,
        inputType: 'text',
        options: ''
    });
    const [newSubsection, setNewSubsection] = useState({ name: '' });
    const [isCreatingSubsection, setIsCreatingSubsection] = useState(false);
    const [error, setError] = useState('');
    const [isAddingExecutive, setIsAddingExecutive] = useState(false);

    // State for the edit modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });

    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedItem) => {
        if (!editedItem.id) return;
        
        let dataToSave = { ...editedItem };
        delete dataToSave.id;

        if (editConfig.collection === 'nonEvaluableCriteria' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        }

        await updateDoc(doc(db, editConfig.collection, editedItem.id), dataToSave);
        await refreshData();
        setIsEditModalOpen(false);
        setItemToEdit(null);
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
        const maxOrder = executiveFields.reduce((max, field) => (field.order > max ? field.order : max), 0);
        await addDoc(collection(db, 'executiveFields'), { name: newField.name, order: maxOrder + 1, isDefault: false });
        setNewField({ name: '' });
        await refreshData();
    };

    const handleSaveExecutive = async (e) => {
        e.preventDefault();
        if (Object.keys(newExecutive).length < executiveFields.length) return;
        await addDoc(collection(db, 'executives'), newExecutive);
        setNewExecutive({});
        setIsAddingExecutive(false);
        await refreshData();
    };
    
    const handleSaveCriterion = async (e) => {
        e.preventDefault();
        if (!newCriterion.name) return;
        let dataToSave = { ...newCriterion };
        if (dataToSave.section !== 'Aptitudes Transversales') {
            delete dataToSave.subsection;
        }
        await addDoc(collection(db, 'criteria'), dataToSave);
        setNewCriterion({ name: '', section: 'Aptitudes Transversales', subsection: '' });
        await refreshData();
    };
    
    const handleSaveSubsection = async () => {
        if (!newSubsection.name) return;
        const maxOrder = aptitudeSubsections.reduce((max, sub) => (sub.order > max ? sub.order : max), 0);
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
        if (!newNonEvaluableCriterion.name) return;
        
        const dataToSave = { ...newNonEvaluableCriterion };
        if (dataToSave.inputType === 'select' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        } else if (dataToSave.inputType === 'text') {
            delete dataToSave.options;
        }

        await addDoc(collection(db, 'nonEvaluableCriteria'), dataToSave);
        setNewNonEvaluableCriterion({ name: '', section: 'Aptitudes Transversales', trackInDashboard: false, trackEmptyInDashboard: false, inputType: 'text', options: '' });
        await refreshData();
    };
    
    const handleDelete = async (collectionName, id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            if (collectionName === 'aptitudeSubsections') {
                const subsectionToDelete = aptitudeSubsections.find(s => s.id === id);
                const criteriaUsingSubsection = criteria.filter(c => c.subsection === subsectionToDelete?.name);
                if (criteriaUsingSubsection.length > 0) {
                    setError(`No se puede eliminar la subsección porque está siendo usada por ${criteriaUsingSubsection.length} criterio(s).`);
                    setTimeout(() => setError(''), 5000);
                    return;
                }
            }
            await deleteDoc(doc(db, collectionName, id));
            await refreshData();
        }
    };

    const handleMoveSubsection = async (subsectionId, direction) => {
        const subs = [...aptitudeSubsections];
        const index = subs.findIndex(s => s.id === subsectionId);
        if (index === -1) return;
    
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
        if (swapIndex < 0 || swapIndex >= subs.length) return;
    
        const sub1 = subs[index];
        const sub2 = subs[swapIndex];
    
        const batch = writeBatch(db);
        batch.update(doc(db, 'aptitudeSubsections', sub1.id), { order: sub2.order });
        batch.update(doc(db, 'aptitudeSubsections', sub2.id), { order: sub1.order });
    
        await batch.commit();
        await refreshData();
    };

    const defaultFieldsNames = ['Nombre', 'Cargo', 'Área'];
    const aptitudesCriteria = criteria.filter(c => c.section === 'Aptitudes Transversales');
    const calidadCriteria = criteria.filter(c => c.section === 'Calidad de Desempeño');
    const aptitudesNonEvaluable = nonEvaluableCriteria.filter(c => c.section === 'Aptitudes Transversales');
    const calidadNonEvaluable = nonEvaluableCriteria.filter(c => c.section === 'Calidad de Desempeño');

    const groupedAptitudesCriteria = aptitudesCriteria.reduce((acc, criterion) => {
        const subsection = criterion.subsection || 'Sin Subsección';
        if (!acc[subsection]) {
            acc[subsection] = [];
        }
        acc[subsection].push(criterion);
        return acc;
    }, {});
    
    const getNonEvaluableSubtitle = (item) => {
        const parts = [];
        parts.push(item.inputType === 'select' ? 'Desplegable' : 'Texto');
        if (item.trackInDashboard) parts.push('Seguimiento Detallado');
        if (item.trackEmptyInDashboard) parts.push('Conteo Vacíos');
        return `(${parts.join(', ')})`;
    };
    
    const renderLimitedList = (sections, showAll, onEdit) => {
        const output = [];
        let flatList = [];
        sections.forEach(section => {
            if(section.items.length > 0) {
                flatList.push({type: 'header', title: section.title});
                section.items.forEach(item => {
                    flatList.push({type: 'item', ...item, collection: section.collection, isNonEvaluable: section.isNonEvaluable, editFields: section.editFields});
                });
            }
        });

        const visibleItems = showAll ? flatList : flatList.slice(0, INITIAL_VISIBLE_COUNT);
        let currentSectionItems = [];
        let currentSectionTitle = null;

        const flushSection = () => {
            if (currentSectionTitle) {
                output.push(
                    <div key={currentSectionTitle}>
                        <h5 style={{fontWeight: 'normal', color: 'var(--color-secondary)', marginTop: '1rem'}}>{currentSectionTitle}</h5>
                        <ul className="config-list">
                            {currentSectionItems}
                        </ul>
                    </div>
                );
            }
            currentSectionItems = [];
        };

        visibleItems.forEach((item) => {
            if (item.type === 'header') {
                flushSection();
                currentSectionTitle = item.title;
            } else {
                currentSectionItems.push(
                     <li key={item.id} className="config-list-item">
                        <span>{item.name}{item.isNonEvaluable && ` ${getNonEvaluableSubtitle(item)}`}</span>
                        {currentUser && (
                            <div className="config-actions">
                                <button className="btn-icon" onClick={() => onEdit(item, item.collection, item.editFields)}>✏️</button>
                                <button onClick={() => handleDelete(item.collection, item.id)} className="btn-icon btn-icon-danger">🗑️</button>
                            </div>
                        )}
                    </li>
                );
            }
        });
        flushSection();

        return { renderedElements: output, totalLines: flatList.length };
    };
    
    const getNonEvaluableEditFields = () => [
        { name: 'name', label: 'Nombre del Criterio' },
        { name: 'section', label: 'Sección', type: 'select', options: [{value: 'Aptitudes Transversales', label: 'Aptitudes Transversales'}, {value: 'Calidad de Desempeño', label: 'Calidad de Desempeño'}] },
        { name: 'inputType', label: 'Tipo de Campo', type: 'select', options: [{value: 'text', label: 'Texto'}, {value: 'select', label: 'Desplegable'}] },
        { name: 'options', label: 'Opciones (separadas por comas)'},
        { name: 'trackInDashboard', label: 'Seguimiento Detallado', type: 'checkbox', checkboxLabel: 'Mostrar desglose de valores en Dashboard' },
        { name: 'trackEmptyInDashboard', label: 'Conteo de Vacíos', type: 'checkbox', checkboxLabel: 'Contar valores N/A o vacíos en Dashboard' }
    ];

    const evaluableSections = [
        ...Object.entries(groupedAptitudesCriteria).map(([subsection, criteriaList]) => ({
            title: subsection,
            items: criteriaList,
            collection: 'criteria',
            editFields: [
                { name: 'name', label: 'Nombre del Criterio' },
                { name: 'section', label: 'Sección', type: 'select', options: [{value: 'Aptitudes Transversales', label: 'Aptitudes Transversales'}, {value: 'Calidad de Desempeño', label: 'Calidad de Desempeño'}] },
                { name: 'subsection', label: 'Subsección', type: 'select', options: [{value: '', label: 'Sin Subsección'}, ...aptitudeSubsections.map(s => ({value: s.name, label: s.name}))] }
            ]
        })),
        { 
            title: 'Calidad de Desempeño', 
            items: calidadCriteria, 
            collection: 'criteria',
            editFields: [
                { name: 'name', label: 'Nombre del Criterio' },
                { name: 'section', label: 'Sección', type: 'select', options: [{value: 'Aptitudes Transversales', label: 'Aptitudes Transversales'}, {value: 'Calidad de Desempeño', label: 'Calidad de Desempeño'}] }
            ]
        }
    ];

    const nonEvaluableSections = [
        { 
            title: 'Aptitudes Transversales', 
            items: aptitudesNonEvaluable, 
            collection: 'nonEvaluableCriteria', 
            isNonEvaluable: true,
            editFields: getNonEvaluableEditFields()
        },
        { 
            title: 'Calidad de Desempeño', 
            items: calidadNonEvaluable, 
            collection: 'nonEvaluableCriteria', 
            isNonEvaluable: true,
            editFields: getNonEvaluableEditFields()
        }
    ];
    
    const { renderedElements: evaluableList, totalLines: totalEvaluableLines } = renderLimitedList(evaluableSections, showAllEvaluable, handleEditClick);
    const { renderedElements: nonEvaluableList, totalLines: totalNonEvaluableLines } = renderLimitedList(nonEvaluableSections, showAllNonEvaluable, handleEditClick);

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
                {currentUser && (
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Ejecutivos</h4>
                    <div style={{ marginBottom: '1rem' }}>
                        <button className="btn btn-primary" onClick={() => setIsAddingExecutive(!isAddingExecutive)}>
                            {isAddingExecutive ? 'Cancelar' : 'Agregar Ejecutivo'}
                        </button>
                    </div>
                    {isAddingExecutive && (
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
                                <span>{exec.Nombre} - {exec.Cargo}</span>
                                <div className="config-actions">
                                    <button className="btn-icon" onClick={() => handleEditClick(exec, 'executives', executiveFields.map(f => ({ name: f.name, label: f.name })))}>✏️</button>
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executives', exec.id)}>🗑️</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                )}
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios Evaluables</h4>
                    {currentUser && (
                     <form onSubmit={handleSaveCriterion}>
                        <div className="form-group">
                            <label>Nombre del Criterio</label>
                            <input type="text" className="form-control" value={newCriterion.name} onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Sección</label>
                            <select className="form-control" value={newCriterion.section} onChange={(e) => { setNewCriterion({ ...newCriterion, section: e.target.value, subsection: '' }); setIsCreatingSubsection(false); }}>
                                <option value="Aptitudes Transversales">Aptitudes Transversales</option>
                                <option value="Calidad de Desempeño">Calidad de Desempeño</option>
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
                    <h4 style={{marginTop: '0'}}>Listado de Criterios</h4>
                    {evaluableList}
                    {totalEvaluableLines > INITIAL_VISIBLE_COUNT && (
                        <button onClick={() => setShowAllEvaluable(!showAllEvaluable)} className="btn btn-secondary" style={{width: '100%', marginTop: '1rem'}}>
                            {showAllEvaluable ? 'Ver menos' : 'Ver más...'}
                        </button>
                    )}
                </div>
                 <div className="card">
                    <h4 className="card-title card-title-primary">Ordenar Subsecciones de Aptitudes</h4>
                    <p className="text-muted" style={{marginBottom: '1rem', fontSize: '0.9rem'}}>
                        Usa los botones para cambiar el orden en que aparecen las subsecciones.
                    </p>
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
                </div>
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios no Evaluables</h4>
                    {currentUser && (
                    <form onSubmit={handleSaveNonEvaluableCriterion}>
                        <div className="form-group">
                            <label>Nombre del Criterio</label>
                            <input type="text" className="form-control" value={newNonEvaluableCriterion.name} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, name: e.target.value })}/>
                        </div>
                        <div className="form-group">
                            <label>Sección</label>
                            <select className="form-control" value={newNonEvaluableCriterion.section} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, section: e.target.value })}>
                                <option value="Aptitudes Transversales">Aptitudes Transversales</option>
                                <option value="Calidad de Desempeño">Calidad de Desempeño</option>
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
                     <h4 style={{marginTop: '0'}}>Listado de Criterios</h4>
                    {nonEvaluableList}
                    {totalNonEvaluableLines > INITIAL_VISIBLE_COUNT && (
                        <button onClick={() => setShowAllNonEvaluable(!showAllNonEvaluable)} className="btn btn-secondary" style={{width: '100%', marginTop: '1rem'}}>
                            {showAllNonEvaluable ? 'Ver menos' : 'Ver más...'}
                        </button>
                    )}
                </div>
                 {currentUser && (
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Campos de Creación de Ejecutivos</h4>
                    <form onSubmit={handleSaveField}>
                        <div className="form-group">
                            <label>Añadir Campo Adicional</label>
                            <input type="text" className="form-control" value={newField.name} onChange={(e) => setNewField({ ...newField, name: e.target.value })}/>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Agregar Campo</button>
                    </form>
                    <ul className="config-list">
                        {executiveFields.map(field => (
                            <li key={field.id} className="config-list-item">
                                <span>{field.name}</span>
                                {!defaultFieldsNames.includes(field.name) && (
                                    <div className="config-actions">
                                        <button className="btn-icon" onClick={() => handleEditClick(field, 'executiveFields', [{ name: 'name', label: 'Nombre del Campo' }])}>✏️</button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executiveFields', field.id)}>🗑️</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                 )}
                {currentUser && (
                <div className="card">
                    <h4 className="card-title card-title-primary">Información de la Organización</h4>
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
                </div>
                )}
            </div>
        </div>
    );
};

export default Configuration;
