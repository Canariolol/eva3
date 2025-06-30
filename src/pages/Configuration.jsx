import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, setDoc, query, orderBy } from 'firebase/firestore';

const Configuration = () => {
    const [executiveFields, setExecutiveFields] = useState([]);
    const [newField, setNewField] = useState({ name: '' });
    const [newExecutive, setNewExecutive] = useState({});
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [newCriterion, setNewCriterion] = useState({ name: '', section: 'Aptitudes Transversales' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddingExecutive, setIsAddingExecutive] = useState(false);
    
    const fetchData = useCallback(async () => {
        try {
            const fieldsRef = collection(db, 'executiveFields');
            const fieldsSnapshot = await getDocs(query(fieldsRef, orderBy('order')));
            if (fieldsSnapshot.empty) {
                const defaultFields = [
                    { name: 'Nombre', order: 1, isDefault: true },
                    { name: 'Cargo', order: 2, isDefault: true },
                    { name: 'Área', order: 3, isDefault: true }
                ];
                await Promise.all(defaultFields.map(field => addDoc(fieldsRef, field)));
                const newSnapshot = await getDocs(query(fieldsRef, orderBy('order')));
                setExecutiveFields(newSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setExecutiveFields(fieldsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            }

            const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
            const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
            
            const [criteriaSnapshot, executivesSnapshot] = await Promise.all([
                getDocs(criteriaQuery),
                getDocs(executivesQuery)
            ]);
            
            setCriteria(criteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setExecutives(executivesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

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

    const handleSaveField = async (e) => {
        e.preventDefault();
        if (!newField.name) {
            setError('El nombre del campo no puede estar vacío.');
            return;
        }
        const maxOrder = executiveFields.reduce((max, field) => (field.order > max ? field.order : max), 0);
        try {
            await addDoc(collection(db, 'executiveFields'), { name: newField.name, order: maxOrder + 1, isDefault: false });
            setNewField({ name: '' });
            fetchData();
        } catch (err) {
            setError('Error al guardar el campo.');
        }
    };

    const handleSaveExecutive = async (e) => {
        e.preventDefault();
        if (Object.keys(newExecutive).length < executiveFields.length) {
            setError('Por favor, completa todos los campos del ejecutivo.');
            return;
        }
        try {
            await addDoc(collection(db, 'executives'), newExecutive);
            setNewExecutive({});
            setIsAddingExecutive(false);
            fetchData();
        } catch (err) {
            setError('Error al guardar el ejecutivo.');
        }
    };
    
    const handleSaveCriterion = async (e) => {
        e.preventDefault();
        if (!newCriterion.name) {
            setError('El nombre del criterio no puede estar vacío.');
            return;
        }
        try {
            await addDoc(collection(db, 'criteria'), newCriterion);
            setNewCriterion({ name: '', section: 'Aptitudes Transversales' });
            fetchData();
        } catch (err) {
            setError('Error al guardar el criterio.');
        }
    };
    
    const handleDelete = async (collectionName, id) => {
        const fieldToDelete = executiveFields.find(f => f.id === id);
        if (collectionName === 'executiveFields' && fieldToDelete?.isDefault) {
            setError('No se pueden eliminar los campos por defecto.');
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            try {
                await deleteDoc(doc(db, collectionName, id));
                fetchData();
            } catch (error) {
                setError(`Error al eliminar: ${error.message}`);
            }
        }
    };

    if (loading) return <h1>Cargando...</h1>;

    const defaultFieldsNames = ['Nombre', 'Cargo', 'Área'];

    return (
        <div>
            <h1>Configuración</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="config-grid">
                <div className="card">
                    <h2>Gestionar Campos de Ejecutivo</h2>
                    <form onSubmit={handleSaveField}>
                        <div className="form-group">
                            <label>Añadir Campo Adicional</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newField.name}
                                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                            />
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
                    <h2>Gestionar Ejecutivos</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setIsAddingExecutive(!isAddingExecutive)}
                        >
                            {isAddingExecutive ? 'Cancelar' : 'Agregar Ejecutivo'}
                        </button>
                    </div>
                    {isAddingExecutive && (
                        <form onSubmit={handleSaveExecutive}>
                            {executiveFields.map(field => (
                                <div className="form-group" key={field.id}>
                                    <label>{field.name}</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newExecutive[field.name] || ''}
                                        onChange={(e) => setNewExecutive({ ...newExecutive, [field.name]: e.target.value })}
                                    />
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
                    <h2>Gestionar Criterios</h2>
                    <form onSubmit={handleSaveCriterion}>
                        <div className="form-group">
                            <label>Nombre del Criterio</label>
                            <input
                                type="text"
                                className="form-control"
                                value={newCriterion.name}
                                onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Sección</label>
                            <select
                                className="form-control"
                                value={newCriterion.section}
                                onChange={(e) => setNewCriterion({ ...newCriterion, section: e.target.value })}
                            >
                                <option value="Aptitudes Transversales">Aptitudes Transversales</option>
                                <option value="Calidad de Desempeño">Calidad de Desempeño</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Criterio</button>
                    </form>
                    <ul className="config-list">
                        {criteria.map(crit => (
                            <li key={crit.id} className="config-list-item">
                                <span>{crit.name} ({crit.section})</span>
                                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete('criteria', crit.id)}>🗑️</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
