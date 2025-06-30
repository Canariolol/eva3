import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore';

const Modal = ({ children, onClose }) => ( <div className="modal-backdrop"><div className="modal-content"><button onClick={onClose} className="modal-close-btn">&times;</button>{children}</div></div> );

const Team = () => {
  const [executives, setExecutives] = useState([]);
  const [executiveFields, setExecutiveFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExecutiveData, setNewExecutiveData] = useState({});
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchTeamData = useCallback(async () => {
    try {
      const fieldsQuery = query(collection(db, 'executiveFields'), orderBy('order'));
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
      const [fieldsSnapshot, executivesSnapshot] = await Promise.all([getDocs(fieldsQuery), getDocs(executivesQuery)]);
      setExecutiveFields(fieldsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setExecutives(executivesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de ejecutivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInputChange = (e) => { setNewExecutiveData({ ...newExecutiveData, [e.target.name]: e.target.value }); };
  
  const handleAddExecutive = async (e) => {
    e.preventDefault();
    if (Object.values(newExecutiveData).some(v => !String(v).trim())) { alert("Por favor, completa todos los campos."); return; }
    await addDoc(collection(db, 'executives'), newExecutiveData);
    setIsAddModalOpen(false);
    setNewExecutiveData({});
    fetchTeamData();
  };

  const handleViewHistory = async (executive) => {
    setSelectedExecutive(executive);
    setHistoryLoading(true);
    try {
      const historyQuery = query(collection(db, 'evaluations'), where('executive', '==', executive.Nombre), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(historyQuery);
      setHistory(querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date.toDate().toLocaleDateString() })));
    } catch (err) { console.error("Error al obtener el historial:", err); } 
    finally { setHistoryLoading(false); }
  };

  if (loading) return <h1>Cargando...</h1>;
  if (error) return <h1>{error}</h1>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div><h1>Nuestro Equipo</h1><p style={{marginTop: '-10px', color: 'var(--color-secondary)'}}>Haz clic en un ejecutivo para ver su historial.</p></div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">Añadir Ejecutivo</button>
      </div>
      {isAddModalOpen && (<Modal onClose={() => setIsAddModalOpen(false)}><h2>Añadir Nuevo Ejecutivo</h2><form onSubmit={handleAddExecutive} style={{marginTop: '2rem'}}>{executiveFields.map(field => (<div key={field.id} className="form-group"><label>{field.name}</label><input type="text" name={field.name} className="form-control" value={newExecutiveData[field.name] || ''} onChange={handleInputChange} required /></div>))}<button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar</button></form></Modal>)}
      {selectedExecutive && (<Modal onClose={() => setSelectedExecutive(null)}><h2>Historial de {selectedExecutive.Nombre}</h2>{historyLoading ? <p>Cargando historial...</p> : (history.length > 0 ? (<ul className="config-list" style={{marginTop: '2rem'}}>{history.map(item => (<li key={item.id} className="config-list-item"><div><span style={{display: 'block', fontSize: '0.9em', color: '#666'}}>{item.date}</span><strong>{item.criterion}</strong></div><span className="team-avatar" style={{width: '40px', height: '40px', fontSize: '1rem'}}>{item.score}</span></li>))}</ul>) : <p>No hay evaluaciones registradas.</p>)}</Modal>)}
      <div className="team-grid">{executives.map(exec => (<div key={exec.id} className="card team-card" onClick={() => handleViewHistory(exec)}><div className="team-avatar">{exec.Nombre.charAt(0)}</div><h2>{exec.Nombre}</h2><p><strong>Cargo:</strong> {exec.Cargo || 'N/A'}</p><p><strong>Área:</strong> {exec.Área || 'N/A'}</p></div>))}</div>
    </>
  );
};

export default Team;
