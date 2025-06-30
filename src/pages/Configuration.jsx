import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, runTransaction } from 'firebase/firestore';

const Configuration = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [executiveFields, setExecutiveFields] = useState([]);
  const [executives, setExecutives] = useState([]);
  
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionType, setNewCriterionType] = useState('Aptitudes Transversales');
  const [newFieldName, setNewFieldName] = useState('');
  const [newExecutiveData, setNewExecutiveData] = useState({});

  // useCallback previene que la función se recree en cada render, rompiendo el bucle
  const fetchData = useCallback(async () => {
    try {
      // La lógica para crear campos por defecto es correcta
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
      
      // Cargar todos los datos
      const criteriaQuery = query(collection(db, 'criteria'), orderBy('name'));
      const fieldsQuery = query(collection(db, 'executiveFields'), orderBy('order'));
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));

      const [criteriaSnapshot, fieldsSnapshot, executivesSnapshot] = await Promise.all([
        getDocs(criteriaQuery),
        getDocs(fieldsQuery),
        getDocs(executivesQuery),
      ]);

      const fieldsList = fieldsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const initialExecData = {};
      fieldsList.forEach(field => { initialExecData[field.name] = ''; });

      setCriteria(criteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setExecutiveFields(fieldsList);
      setNewExecutiveData(initialExecData);
      setExecutives(executivesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos de configuración.');
    } finally {
      setLoading(false);
    }
  }, []); // El array de dependencias vacío es la clave para que se ejecute UNA SOLA VEZ

  // useEffect ahora depende de la función memoizada fetchData
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Las funciones de manejo de eventos se mantienen igual, pero ahora llaman
  // a una versión estable de fetchData.
  const handleDelete = async (collectionName, id) => {
    await deleteDoc(doc(db, collectionName, id));
    fetchData(); // Vuelve a cargar los datos para reflejar el cambio
  };

  const handleAdd = async (collectionName, data) => {
    await addDoc(collection(db, collectionName), data);
    fetchData();
  };
  
  const handleAddCriterion = (e) => { e.preventDefault(); if(newCriterionName.trim()){ handleAdd('criteria', { name: newCriterionName, section: newCriterionType }); setNewCriterionName(''); } };
  const handleAddField = (e) => { e.preventDefault(); if(newFieldName.trim()){ const nextOrder = executiveFields.length > 0 ? Math.max(...executiveFields.map(f => f.order)) + 1 : 1; handleAdd('executiveFields', { name: newFieldName, order: nextOrder }); setNewFieldName(''); } };
  const handleAddExecutive = (e) => { e.preventDefault(); if(Object.values(newExecutiveData).some(v => !String(v).trim())){ alert("Por favor, completa todos los campos."); return; } handleAdd('executives', newExecutiveData); };

  const handleReorder = async (index, direction) => {
    const newFields = [...executiveFields];
    const itemToMove = newFields[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;
    const itemToSwapWith = newFields[swapIndex];
    
    await runTransaction(db, async (transaction) => {
      const doc1Ref = doc(db, 'executiveFields', itemToMove.id);
      const doc2Ref = doc(db, 'executiveFields', itemToSwapWith.id);
      transaction.update(doc1Ref, { order: itemToSwapWith.order });
      transaction.update(doc2Ref, { order: itemToMove.order });
    });
    fetchData();
  };

  if (loading) return <h1>Cargando...</h1>;
  if (error) return <h1>{error}</h1>;

  return (
      <div className="config-grid">
        <section className="card">
          <h2>Criterios de Evaluación</h2>
          <form onSubmit={handleAddCriterion}>
            <div className="form-group"><input type="text" className="form-control" value={newCriterionName} onChange={(e) => setNewCriterionName(e.target.value)} placeholder="Nombre del criterio" /></div>
            <div className="form-group"><select className="form-control" value={newCriterionType} onChange={(e) => setNewCriterionType(e.target.value)}><option value="Aptitudes Transversales">Aptitud Transversal</option><option value="Calidad de Desempeño">Calidad de Desempeño</option></select></div>
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Añadir Criterio</button>
          </form>
          <ul className="config-list">{criteria.map(c => (<li key={c.id} className="config-list-item"><span>{c.name} <em>({c.section})</em></span><button onClick={() => handleDelete('criteria', c.id)} className="btn-icon btn-icon-danger">✖</button></li>))}</ul>
        </section>
        <section className="card">
          <h2>Campos de Ejecutivo</h2>
          <form onSubmit={handleAddField}>
            <div className="form-group"><input type="text" className="form-control" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Nombre del nuevo campo"/></div>
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Añadir Campo</button>
          </form>
          <ul className="config-list">{executiveFields.map((field, index) => (<li key={field.id} className="config-list-item"><div className="config-actions"><button className="btn-icon" disabled={index === 0} onClick={() => handleReorder(index, 'up')}>▲</button><button className="btn-icon" disabled={index === executiveFields.length - 1} onClick={() => handleReorder(index, 'down')}>▼</button><span>{field.name}</span></div>{!['Nombre', 'Cargo', 'Área'].includes(field.name) && (<button onClick={() => handleDelete('executiveFields', field.id)} className="btn-icon btn-icon-danger">✖</button>)}</li>))}</ul>
        </section>
        <section className="card">
          <h2>Ejecutivos</h2>
          <form onSubmit={handleAddExecutive}>
            {executiveFields.map(field => (<div className="form-group" key={field.id}><input type="text" className="form-control" name={field.name} value={newExecutiveData[field.name] || ''} onChange={(e) => setNewExecutiveData({...newExecutiveData, [e.target.name]: e.target.value})} placeholder={field.name} required /></div>))}
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Añadir Ejecutivo</button>
          </form>
          <ul className="config-list">{executives.map(e => (<li key={e.id} className="config-list-item"><span>{e.Nombre} <em>({e.Cargo})</em></span><button onClick={() => handleDelete('executives', e.id)} className="btn-icon btn-icon-danger">✖</button></li>))}</ul>
        </section>
      </div>
  );
};

export default Configuration;
