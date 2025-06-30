import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore';

// Componente Modal genérico
const Modal = ({ children, onClose }) => (
  <div style={modalBackdropStyle}>
    <div style={modalContentStyle}>
      <button onClick={onClose} style={closeButtonStyle}>X</button>
      {children}
    </div>
  </div>
);

const Team = () => {
  const [executives, setExecutives] = useState([]);
  const [executiveFields, setExecutiveFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para el modal de "Añadir Ejecutivo"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExecutiveData, setNewExecutiveData] = useState({});

  // Estado para el modal de "Historial"
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Cargar campos de ejecutivo
      const fieldsQuery = query(collection(db, 'executiveFields'), orderBy('name'));
      const fieldsSnapshot = await getDocs(fieldsQuery);
      setExecutiveFields(fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar ejecutivos
      const executivesQuery = query(collection(db, 'executives'), orderBy('Nombre'));
      const querySnapshot = await getDocs(executivesQuery);
      setExecutives(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de ejecutivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExecutiveData({ ...newExecutiveData, [name]: value });
  };

  const handleAddExecutive = async (e) => {
    e.preventDefault();
    if (Object.values(newExecutiveData).some(val => !val || !val.trim())) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    try {
      await addDoc(collection(db, 'executives'), newExecutiveData);
      setNewExecutiveData({});
      setIsAddModalOpen(false);
      fetchTeamData(); // Recargar todo
    } catch (err) {
      console.error("Error al añadir ejecutivo:", err);
    }
  };

  const handleViewHistory = async (executive) => {
    setSelectedExecutive(executive);
    setHistoryLoading(true);
    try {
      const historyQuery = query(
        collection(db, 'evaluations'),
        where('executive', '==', executive.Nombre), // Asegurarse que se busca por el campo 'Nombre'
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(historyQuery);
      setHistory(querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate().toLocaleDateString(),
      })));
    } catch (err) {
      console.error("Error al obtener el historial:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div style={containerStyle}><h1>Cargando equipo...</h1></div>;
  if (error) return <div style={containerStyle}><h1>Error: {error}</h1></div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>Nuestro Equipo</h1>
        <button onClick={() => setIsAddModalOpen(true)} style={buttonStyle}>Añadir Ejecutivo</button>
      </div>
      <p>Haz clic en un ejecutivo para ver su historial de evaluaciones.</p>

      {isAddModalOpen && (
        <Modal onClose={() => setIsAddModalOpen(false)}>
          <h2>Añadir Nuevo Ejecutivo</h2>
          <form onSubmit={handleAddExecutive}>
            {executiveFields.map(field => (
              <div key={field.id} style={{marginBottom: '10px'}}>
                <label>{field.name}</label>
                <input
                  type="text"
                  name={field.name}
                  value={newExecutiveData[field.name] || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                  required
                />
              </div>
            ))}
            <button type="submit" style={buttonStyle}>Guardar</button>
          </form>
        </Modal>
      )}

      {selectedExecutive && (
        <Modal onClose={() => setSelectedExecutive(null)}>
          <h2>Historial de {selectedExecutive.Nombre}</h2>
          {/* ...código del historial sin cambios... */}
        </Modal>
      )}

      <div style={gridStyle}>
        {executives.map(executive => (
          <div key={executive.id} style={cardStyle} onClick={() => handleViewHistory(executive)}>
            <span style={avatarStyle}>{executive.Nombre.charAt(0)}</span>
            <h2 style={{ margin: '10px 0' }}>{executive.Nombre}</h2>
            <p style={cardTextStyle}><strong>Cargo:</strong> {executive.Cargo || 'N/A'}</p>
            <p style={cardTextStyle}><strong>Área:</strong> {executive.Área || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Estilos ---
const containerStyle = { padding: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' };
const cardStyle = { border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' };
const cardTextStyle = { margin: '5px 0', color: '#555' };
const avatarStyle = { display: 'inline-block', width: '60px', height: '60px', borderRadius: '50%', background: '#007bff', color: 'white', lineHeight: '60px', fontSize: '24px', fontWeight: 'bold' };
const buttonStyle = { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' };
const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '4px' };
const modalBackdropStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', position: 'relative' };
const closeButtonStyle = { position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' };

export default Team;
