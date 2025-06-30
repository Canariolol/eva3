import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const processDataForLineChart = (evaluations) => {
  const dataByDate = evaluations.reduce((acc, curr) => {
    const date = curr.date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!acc[date]) acc[date] = { date };
    if (!acc[date][curr.executive]) acc[date][curr.executive] = [];
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
    if (!acc[curr.criterion]) acc[curr.criterion] = { criterion: curr.criterion, scores: [] };
    acc[curr.criterion].scores.push(curr.score);
    return acc;
  }, {});
  return Object.values(dataByCriterion).map(item => ({ name: item.criterion, 'Puntaje Promedio': item.scores.reduce((a, b) => a + b, 0) / item.scores.length }));
};

const executiveColors = { 'Ana Gómez': '#8884d8', 'Carlos Ruiz': '#82ca9d', 'Beatriz Olarte': '#ffc658', 'David Serrano': '#ff8042' };

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      const q = query(collection(db, 'evaluations'), orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);
      setEvaluations(querySnapshot.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date.toDate() })));
    } catch (err) {
      setError("No se pudieron cargar los datos de las evaluaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  if (loading) return <h1>Cargando datos...</h1>;
  if (error) return <h1>{error}</h1>;
  if (evaluations.length === 0) return (<div><h1>Dashboard</h1><p>Aún no hay datos para mostrar. Ve a <b>Evaluar</b> para registrar la primera evaluación.</p></div>);
  
  const transversalDataLine = processDataForLineChart(evaluations.filter(e => e.section === 'Aptitudes Transversales'));
  const transversalDataBar = processDataForBarChart(evaluations, 'Aptitudes Transversales');
  const performanceDataLine = processDataForLineChart(evaluations.filter(e => e.section === 'Calidad de Desempeño'));
  const performanceDataBar = processDataForBarChart(evaluations, 'Calidad de Desempeño');
  const executives = [...new Set(evaluations.map(e => e.executive))];

  return (
    <>
      <h1>Dashboard de Evaluaciones</h1>
      <section className="dashboard-section">
        <h2>Aptitudes Transversales</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={transversalDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColors[name] || '#000000'} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card"><h4>Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={transversalDataBar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend /><Bar dataKey="Puntaje Promedio" fill="var(--color-primary)" /></BarChart></ResponsiveContainer></div>
        </div>
      </section>
      <section className="dashboard-section">
        <h2>Calidad de Desempeño</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={performanceDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColors[name] || '#000000'} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card"><h4>Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={performanceDataBar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend /><Bar dataKey="Puntaje Promedio" fill="var(--color-success)" /></BarChart></ResponsiveContainer></div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
