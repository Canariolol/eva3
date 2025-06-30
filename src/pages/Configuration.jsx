import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

const Configuration = () => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [executiveFields, setExecutiveFields] = useState([]);
  const [executives, setExecutives] = useState([]);
  
  // Estados para los formularios
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionType, setNewCriterionType] = useState('Aptitudes Transversales');
  const [newFieldName, setNewFieldName] = useState('');
  const [newExecutiveData, setNewExecutiveData] = useState({});

  // Función centralizada para cargar todos los datos de forma segura
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Paso 1: Verificar y crear los campos de ejecutivo si no existen.
      const fieldsRef = collection(db, 'executiveFields');
      const fieldsSnapshotBefore = await getDocs(fieldsRef);
      if (fieldsSnapshotBefore.empty) {
        const defaultFields = [{ name: 'Nombre' }, { name: 'Cargo' }, { name: 'Área' }];
        // Usamos Promise.all para asegurar que todos los campos se creen antes de continuar.
        await Promise.all(defaultFields.map(field => addDoc(fieldsRef, field)));
      }

      // Paso 2: Cargar todos los datos de la base de datos.
      const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
      const fieldsQuery = query(collection(db, 'executiveFields'), orderBy('name'));
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));

      const [criteriaSnapshot, fieldsSnapshot, executivesSnapshot] = await Promise.all([
        getDocs(criteriaQuery),
        getDocs(fieldsQuery),
        getDocs(executivesQuery),
      ]);

      // Paso 3: Actualizar el estado de React con los datos de Firestore.
      const fieldsList = fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const initialExecData = {};
      fieldsList.forEach(field => {
        initialExecData[field.name] = '';
      });

      setCriteria(criteriaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setExecutiveFields(fieldsList);
      setNewExecutiveData(initialExecData);
      setExecutives(executivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos de configuración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Manejadores de eventos (Añadir/Borrar) ---
  const handleAdd = async (collectionName, data) => {
    try {
      await addDoc(collection(db, collectionName), data);
      await fetchData(); // Recargar todos los datos para mantener consistencia.
    } catch (err) {
      console.error(`Error al añadir en ${collectionName}:`, err);
    }
  };

  const handleDelete = async (collectionName, id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      await fetchData(); // Recargar todos los datos.
    } catch (err) {
      console.error(`Error al eliminar de ${collectionName}:`, err);
    }
  };

  const handleAddCriterion = (e) => { e.preventDefault(); if (!newCriterionName.trim()) return; handleAdd('criteria', { name: newCriterionName, section: newCriterionType }); setNewCriterionName(''); };
  const handleAddField = (e) => { e.preventDefault(); if (!newFieldName.trim()) return; handleAdd('executiveFields', { name: newFieldName }); setNewFieldName(''); };
  const handleAddExecutive = (e) => { e.preventDefault(); if (Object.values(newExecutiveData).some(val => !String(val).trim())) { alert("Por favor, completa todos los campos."); return; } handleAdd('executives', newExecutiveData); };

  if (loading) return <p style={{padding: '20px'}}>Cargando configuración...</p>;
  if (error) return <p style={{padding: '20px'}}>{error}</p>;

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      {/* Sección Criterios */}
      <div style={sectionStyle}>
        <h2>Gestionar Criterios</h2>
        <form onSubmit={handleAddCriterion} style={formStyle}>
          <input type="text" value={newCriterionName} onChange={(e) => setNewCriterionName(e.target.value)} placeholder="Nombre del criterio" style={inputStyle} />
          <select value={newCriterionType} onChange={(e) => setNewCriterionType(e.target.value)} style={inputStyle}>
            <option value="Aptitudes Transversales">Aptitud Transversal</option>
            <option value="Calidad de Desempeño">Calidad de Desempeño</option>
          </select>
          <button type="submit" style={buttonStyle}>Añadir Criterio</button>
        </form>
        <ul style={listStyle}>{criteria.map(c => <li key={c.id} style={listItemStyle}><span>{c.name} <em>({c.section})</em></span><button onClick={() => handleDelete('criteria', c.id)} style={deleteButtonStyle}>X</button></li>)}</ul>
      </div>

      {/* Sección Campos de Ejecutivo */}
      <div style={sectionStyle}>
        <h2>Gestionar Campos de Ejecutivo</h2>
        <form onSubmit={handleAddField} style={formStyle}>
          <input type="text" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Nombre del nuevo campo" style={inputStyle}/>
          <button type="submit" style={buttonStyle}>Añadir Campo</button>
        </form>
        <ul style={listStyle}>{executiveFields.map(f => <li key={f.id} style={listItemStyle}><span>{f.name}</span>{!['Nombre', 'Cargo', 'Área'].includes(f.name) && (<button onClick={() => handleDelete('executiveFields', f.id)} style={deleteButtonStyle}>X</button>)}</li>)}</ul>
      </div>

      {/* Sección Ejecutivos */}
      <div style={sectionStyle}>
        <h2>Gestionar Ejecutivos</h2>
        <form onSubmit={handleAddExecutive} style={formStyle}>
          {executiveFields.map(field => (
            <input key={field.id} type="text" name={field.name} value={newExecutiveData[field.name] || ''} onChange={(e) => setNewExecutiveData({...newExecutiveData, [e.target.name]: e.target.value})} placeholder={field.name} style={inputStyle} required />
          ))}
          <button type="submit" style={buttonStyle}>Añadir Ejecutivo</button>
        </form>
        <ul style={listStyle}>{executives.map(e => <li key={e.id} style={listItemStyle}><span>{e.Nombre} <em>({e.Cargo})</em></span><button onClick={() => handleDelete('executives', e.id)} style={deleteButtonStyle}>X</button></li>)}</ul>
      </div>
    </div>
  );
};

// Estilos
const sectionStyle = { flex: '1 1 300px', minWidth: '300px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' };
const inputStyle = { padding: '8px' };
const buttonStyle = { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' };
const listStyle = { listStyle: 'none', padding: 0 };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid #ccc' };
const deleteButtonStyle = { background: 'red', color: 'white', border: 'none', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%' };

export default Configuration;
