import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';

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
        inputType: 'text',
        options: ''
    });
    const [newSubsection, setNewSubsection] = useState({ name: '' });
    const [isCreatingSubsection, setIsCreatingSubsection] = useState(false);
    const [error, setError] = useState('');
    const [isAddingExecutive, setIsAddingExecutive] = useState(false);

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
        setNewNonEvaluableCriterion({ name: '', section: 'Aptitudes Transversales', trackInDashboard: false, inputType: 'text', options: '' });
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
    
    const renderLimitedList = (sections, showAll) => {
        const output = [];
        let flatList = [];
        sections.forEach(section => {
            if(section.items.length > 0) {
                flatList.push({type: 'header', title: section.title, marginTop: section.marginTop});
                section.items.forEach(item => {
                    flatList.push({type: 'item', ...item, collection: section.collection, isNonEvaluable: section.isNonEvaluable});
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
                        <span>{item.name}{item.isNonEvaluable && ` (${item.inputType === 'select' ? 'Desplegable' : 'Texto'}) ${item.trackInDashboard ? '(Seguimiento)' : ''}`}</span>
                        <button onClick={() => handleDelete(item.collection, item.id)} className="btn-icon btn-icon-danger">🗑️</button>
                    </li>
                );
            }
        });
        flushSection();

        return { renderedElements: output, totalLines: flatList.length };
    };
    
    const evaluableSections = [
        ...Object.entries(groupedAptitudesCriteria).map(([subsection, criteriaList]) => ({
            title: subsection,
            items: criteriaList,
            collection: 'criteria'
        })),
        { title: 'Calidad de Desempeño', items: calidadCriteria, collection: 'criteria', marginTop: '1.5rem' }
    ];

    const nonEvaluableSections = [
        { title: 'Aptitudes Transversales', items: aptitudesNonEvaluable, collection: 'nonEvaluableCriteria', isNonEvaluable: true },
        { title: 'Calidad de Desempeño', items: calidadNonEvaluable, collection: 'nonEvaluableCriteria', isNonEvaluable: true, marginTop: '1.5rem' }
    ];
    
    const { renderedElements: evaluableList, totalLines: totalEvaluableLines } = renderLimitedList(evaluableSections, showAllEvaluable);
    const { renderedElements: nonEvaluableList, totalLines: totalNonEvaluableLines } = renderLimitedList(nonEvaluableSections, showAllNonEvaluable);

    return (
        <div>
            <h1>Configuración</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="config-grid">
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
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executives', exec.id)}>🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios Evaluables</h4>
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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h4 className="card-title card-title-primary">Gestionar Criterios no Evaluables</h4>
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
                            <label>
                                <input type="checkbox" checked={newNonEvaluableCriterion.trackInDashboard} onChange={(e) => setNewNonEvaluableCriterion({ ...newNonEvaluableCriterion, trackInDashboard: e.target.checked })}/>
                                 Seguimiento en Dashboard
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio no Evaluable</button>
                    </form>
                    <hr style={{margin: '2rem 0'}}/>
                     <h4 style={{marginTop: '0'}}>Listado de Criterios</h4>
                    {nonEvaluableList}
                    {totalNonEvaluableLines > INITIAL_VISIBLE_COUNT && (
                        <button onClick={() => setShowAllNonEvaluable(!showAllNonEvaluable)} className="btn btn-secondary" style={{width: '100%', marginTop: '1rem'}}>
                            {showAllNonEvaluable ? 'Ver menos' : 'Ver más...'}
                        </button>
                    )}
                </div>
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
                                    <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('executiveFields', field.id)}>🗑️</button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
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
            </div>
        </div>
    );
};

export default Configuration;
