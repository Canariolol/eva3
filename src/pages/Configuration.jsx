import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, runTransaction } from 'firebase/firestore';

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

  const fetchData = useCallback(async () => {
    if (!loading) setLoading(true);
    try {
      const fieldsRef = collection(db, 'executiveFields');
      const fieldsSnapshotBefore = await getDocs(fieldsRef);
      if (fieldsSnapshotBefore.empty) {
        const defaultFields = [
          { name: 'Nombre', order: 1 }, 
          { name: 'Cargo', order: 2 }, 
          { name: 'Área', order: 3 }
        ];
        await Promise.all(defaultFields.map(field => addDoc(fieldsRef, field)));
      }

      const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
      const fieldsQuery = query(collection(db, 'executiveFields'), orderBy('order'));
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));

      const [criteriaSnapshot, fieldsSnapshot, executivesSnapshot] = await Promise.all([
        getDocs(criteriaQuery),
        getDocs(fieldsQuery),
        getDocs(executivesQuery),
      ]);

      const fieldsList = fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const initialExecData = {};
      fieldsList.forEach(field => { initialExecData[field.name] = ''; });

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
  }, [loading]);

  useEffect(() => {
    fetchData();
  }, []); // Se ejecuta solo una vez

  const handleDelete = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
    await fetchData();
  };
  
  const handleAddCriterion = async (e) => {
    e.preventDefault();
    if (!newCriterionName.trim()) return;
    await addDoc(collection(db, 'criteria'), { name: newCriterionName, section: newCriterionType });
    setNewCriterionName('');
    await fetchData();
  };
  
  const handleAddField = async (e) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const nextOrder = executiveFields.length > 0 ? Math.max(...executiveFields.map(f => f.order)) + 1 : 1;
    await addDoc(collection(db, 'executiveFields'), { name: newFieldName, order: nextOrder });
    setNewFieldName('');
    await fetchData();
  };

  const handleAddExecutive = async (e) => {
    e.preventDefault();
    if (Object.values(newExecutiveData).some(val => !String(val).trim())) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    await addDoc(collection(db, 'executives'), newExecutiveData);
    await fetchData();
  };

  const handleReorder = async (index, direction) => {
    const newFields = [...executiveFields];
    const itemToMove = newFields[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const itemToSwapWith = newFields[swapIndex];

    try {
      await runTransaction(db, async (transaction) => {
        const doc1Ref = doc(db, 'executiveFields', itemToMove.id);
        const doc2Ref = doc(db, 'executiveFields', itemToSwapWith.id);
        transaction.update(doc1Ref, { order: itemToSwapWith.order });
        transaction.update(doc2Ref, { order: itemToMove.order });
      });
      await fetchData();
    } catch (e) { console.error("Fallo al reordenar:", e); }
  };

  if (loading) return <p style={{padding: '20px'}}>Cargando configuración...</p>;
  if (error) return <p style={{padding: '20px'}}>{error}</p>;

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      {/* Sección 1: Gestionar Criterios */}
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

      {/* Sección 2: Gestionar Campos de Ejecutivo */}
      <div style={sectionStyle}>
        <h2>Gestionar Campos de Ejecutivo</h2>
        <form onSubmit={handleAddField} style={formStyle}>
          <input type="text" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Nombre del nuevo campo" style={inputStyle}/>
          <button type="submit" style={buttonStyle}>Añadir Campo</button>
        </form>
        <ul style={listStyle}>
          {executiveFields.map((field, index) => (
            <li key={field.id} style={listItemStyle}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <button style={arrowButtonStyle} disabled={index === 0} onClick={() => handleReorder(index, 'up')}>▲</button>
                  <button style={arrowButtonStyle} disabled={index === executiveFields.length - 1} onClick={() => handleReorder(index, 'down')}>▼</button>
                </div>
                <span>{field.name}</span>
              </div>
              {!['Nombre', 'Cargo', 'Área'].includes(field.name) && (<button onClick={() => handleDelete('executiveFields', field.id)} style={deleteButtonStyle}>X</button>)}
            </li>
          ))}
        </ul>
      </div>

      {/* Sección 3: Gestionar Ejecutivos */}
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
const arrowButtonStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 5px', lineHeight: '1' };

export default Configuration;
