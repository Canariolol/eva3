import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';

const Configuration = () => {
    const [executiveFields, setExecutiveFields] = useState([]);
    const [newField, setNewField] = useState({ name: '' });
    const [newExecutive, setNewExecutive] = useState({});
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [newCriterion, setNewCriterion] = useState({ name: '', section: 'Aptitudes Transversales', subsection: '' });
    const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
    const [newNonEvaluableCriterion, setNewNonEvaluableCriterion] = useState({
        name: '',
        section: 'Aptitudes Transversales',
        trackInDashboard: false,
        inputType: 'text',
        options: ''
    });
    const [aptitudeSubsections, setAptitudeSubsections] = useState([]);
    const [newSubsection, setNewSubsection] = useState({ name: '' });
    const [isCreatingSubsection, setIsCreatingSubsection] = useState(false);
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });
    const [headerInfoId, setHeaderInfoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddingExecutive, setIsAddingExecutive] = useState(false);
    
    const fetchData = useCallback(async () => {
        try {
            const [fieldsSnap, criteriaSnap, nonEvaluableSnap, execSnap, subsectionsSnap, headerSnap] = await Promise.all([
                getDocs(query(collection(db, 'executiveFields'), orderBy('order'))),
                getDocs(query(collection(db, 'criteria'), orderBy('name'))),
                getDocs(query(collection(db, 'nonEvaluableCriteria'), orderBy('name'))),
                getDocs(query(collection(db, 'executives'), orderBy('Nombre'))),
                getDocs(query(collection(db, 'aptitudeSubsections'), orderBy('name'))),
                getDocs(collection(db, 'headerInfo'))
            ]);

            if (fieldsSnap.empty) {
                const defaultFields = [
                    { name: 'Nombre', order: 1, isDefault: true },
                    { name: 'Cargo', order: 2, isDefault: true },
                    { name: 'Área', order: 3, isDefault: true }
                ];
                await Promise.all(defaultFields.map(field => addDoc(collection(db, 'executiveFields'), field)));
                const newFieldsSnap = await getDocs(query(collection(db, 'executiveFields'), orderBy('order')));
                setExecutiveFields(newFieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setExecutiveFields(fieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            
            setCriteria(criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setNonEvaluableCriteria(nonEvaluableSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setExecutives(execSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAptitudeSubsections(subsectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            if (!headerSnap.empty) {
                const headerDoc = headerSnap.docs[0];
                setHeaderInfo(headerDoc.data());
                setHeaderInfoId(headerDoc.id);
            }

        } catch (err) {
            setError('Error al cargar la configuración.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveHeaderInfo = async (e) => {
        e.preventDefault();
        try {
            if (headerInfoId) {
                await setDoc(doc(db, 'headerInfo', headerInfoId), headerInfo);
            } else {
                await addDoc(collection(db, 'headerInfo'), headerInfo);
            }
            fetchData();
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
        fetchData();
    };

    const handleSaveExecutive = async (e) => {
        e.preventDefault();
        if (Object.keys(newExecutive).length < executiveFields.length) return;
        await addDoc(collection(db, 'executives'), newExecutive);
        setNewExecutive({});
        setIsAddingExecutive(false);
        fetchData();
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
        fetchData();
    };
    
    const handleSaveSubsection = async () => {
        if (!newSubsection.name) return;
        await addDoc(collection(db, 'aptitudeSubsections'), newSubsection);
        await fetchData(); 
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
        fetchData();
    };
    
    const handleDelete = async (collectionName, id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            await deleteDoc(doc(db, collectionName, id));
            fetchData();
        }
    };

    if (loading) return <h1>Cargando...</h1>;

    const defaultFieldsNames = ['Nombre', 'Cargo', 'Área'];
    const aptitudesCriteria = criteria.filter(c => c.section === 'Aptitudes Transversales');
    const calidadCriteria = criteria.filter(c => c.section === 'Calidad de Desempeño');
    const aptitudesNonEvaluable = nonEvaluableCriteria.filter(c => c.section === 'Aptitudes Transversales');
    const calidadNonEvaluable = nonEvaluableCriteria.filter(c => c.section === 'Calidad de Desempeño');

    return (
        <div>
            <h1>Configuración</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="config-grid">
                <div className="card">
                    <h2>Gestionar Ejecutivos</h2>
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
                    <h2>Gestionar Criterios Evaluables</h2>
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
                    <h5 style={{fontWeight: 'normal', color: 'var(--color-secondary)'}}>Aptitudes Transversales</h5>
                    <ul className="config-list">
                        {aptitudesCriteria.map(c => <li key={c.id} className="config-list-item"><span>{c.name} {c.subsection && `(${c.subsection})`}</span><button onClick={() => handleDelete('criteria', c.id)} className="btn-icon btn-icon-danger">🗑️</button></li>)}
                    </ul>
                    <h5 style={{fontWeight: 'normal', color: 'var(--color-secondary)', marginTop: '1.5rem'}}>Calidad de Desempeño</h5>
                    <ul className="config-list">
                         {calidadCriteria.map(c => <li key={c.id} className="config-list-item"><span>{c.name}</span><button onClick={() => handleDelete('criteria', c.id)} className="btn-icon btn-icon-danger">🗑️</button></li>)}
                    </ul>
                </div>
                <div className="card">
                    <h2>Gestionar Criterios no Evaluables</h2>
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
                    <h5 style={{fontWeight: 'normal', color: 'var(--color-secondary)'}}>Aptitudes Transversales</h5>
                    <ul className="config-list">
                        {aptitudesNonEvaluable.map(crit => (
                            <li key={crit.id} className="config-list-item">
                                <span>{crit.name} ({crit.inputType === 'select' ? 'Desplegable' : 'Texto'}) {crit.trackInDashboard && '(Seguimiento)'}</span>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('nonEvaluableCriteria', crit.id)}>🗑️</button>
                            </li>
                        ))}
                    </ul>
                     <h5 style={{fontWeight: 'normal', color: 'var(--color-secondary)', marginTop: '1.5rem'}}>Calidad de Desempeño</h5>
                    <ul className="config-list">
                        {calidadNonEvaluable.map(crit => (
                            <li key={crit.id} className="config-list-item">
                                <span>{crit.name} ({crit.inputType === 'select' ? 'Desplegable' : 'Texto'}) {crit.trackInDashboard && '(Seguimiento)'}</span>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('nonEvaluableCriteria', crit.id)}>🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card">
                    <h2>Gestionar Campos de Creación de Ejecutivos</h2>
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
                    <h2>Información del Encabezado</h2>
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
