import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Funciones para procesar los datos (sin cambios)
const processDataForLineChart = (evaluations) => {
  const dataByDate = evaluations.reduce((acc, curr) => {
    // Usamos toLocaleDateString para formatear la fecha (ej: "ene.", "feb.")
    const date = curr.date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!acc[date]) {
      acc[date] = { date };
    }
    if (!acc[date][curr.executive]) {
      acc[date][curr.executive] = [];
    }
    acc[date][curr.executive].push(curr.score);
    return acc;
  }, {});

  return Object.values(dataByDate).map(dateEntry => {
    Object.keys(dateEntry).forEach(key => {
      if (key !== 'date') {
        const scores = dateEntry[key];
        dateEntry[key] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    });
    return dateEntry;
  });
};

const processDataForBarChart = (evaluations, section) => {
  const sectionEvaluations = evaluations.filter(e => e.section === section);
  const dataByCriterion = sectionEvaluations.reduce((acc, curr) => {
    if (!acc[curr.criterion]) {
      acc[curr.criterion] = { criterion: curr.criterion, scores: [] };
    }
    acc[curr.criterion].scores.push(curr.score);
    return acc;
  }, {});

  return Object.values(dataByCriterion).map(item => ({
    name: item.criterion,
    'Puntaje Promedio': item.scores.reduce((a, b) => a + b, 0) / item.scores.length,
  }));
};

// Colores para las líneas de los ejecutivos
const executiveColors = {
  'Ana Gómez': '#8884d8',
  'Carlos Ruiz': '#82ca9d',
  'Beatriz Olarte': '#ffc658',
  'David Serrano': '#ff8042',
};

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const q = query(collection(db, 'evaluations'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedEvaluations = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convertir el Timestamp de Firestore a un objeto Date de JavaScript
            date: data.date.toDate(), 
          };
        });
        setEvaluations(fetchedEvaluations);
      } catch (err) {
        console.error("Error al obtener las evaluaciones: ", err);
        setError("No se pudieron cargar los datos de las evaluaciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []); // El array vacío asegura que esto se ejecute solo una vez, al montar el componente.

  if (loading) {
    return <div style={{ padding: '20px' }}><h1>Cargando datos...</h1></div>;
  }

  if (error) {
    return <div style={{ padding: '20px' }}><h1>Error: {error}</h1></div>;
  }

  if (evaluations.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Dashboard de Evaluaciones</h1>
        <p>Aún no hay datos para mostrar.</p>
        <p>Ve a la pestaña <b>Evaluar</b> para registrar la primera evaluación.</p>
      </div>
    );
  }

  // Procesar datos para cada sección
  const transversalDataLine = processDataForLineChart(evaluations.filter(e => e.section === 'Aptitudes Transversales'));
  const transversalDataBar = processDataForBarChart(evaluations, 'Aptitudes Transversales');
  
  const performanceDataLine = processDataForLineChart(evaluations.filter(e => e.section === 'Calidad de Desempeño'));
  const performanceDataBar = processDataForBarChart(evaluations, 'Calidad de Desempeño');

  const executives = [...new Set(evaluations.map(e => e.executive))];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard de Evaluaciones</h1>

      {/* --- Sección: Aptitudes Transversales --- */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Aptitudes Transversales</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <h4>Progreso Comparativo de Ejecutivos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transversalDataLine}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]}/>
                <Tooltip />
                <Legend />
                {executives.map(name => (
                  <Line key={name} type="monotone" dataKey={name} stroke={executiveColors[name] || '#000000'} activeDot={{ r: 8 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: '100%', maxWidth: '600px' }}>
            <h4>Promedio por Criterio</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transversalDataBar}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Puntaje Promedio" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* --- Sección: Calidad de Desempeño --- */}
      <section>
        <h2>Calidad de Desempeño</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

          <div style={{ width: '100%', maxWidth: '600px' }}>
            <h4>Progreso Comparativo de Ejecutivos</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceDataLine}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]}/>
                <Tooltip />
                <Legend />
                {executives.map(name => (
                  <Line key={name} type="monotone" dataKey={name} stroke={executiveColors[name] || '#000000'} activeDot={{ r: 8 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ width: '100%', maxWidth: '600px' }}>
            <h4>Promedio por Criterio</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceDataBar}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Puntaje Promedio" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
