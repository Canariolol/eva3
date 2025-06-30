import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const processDataForLineChart = (evaluations, dateField = 'date') => {
  const dataByDate = evaluations.reduce((acc, curr) => {
    const dateValue = curr[dateField];
    if (!dateValue || typeof dateValue.toLocaleDateString !== 'function') {
      return acc; 
    }
    const date = dateValue.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    if (!acc[date]) {
      acc[date] = { date };
    }
    if (!acc[date][curr.executive]) {
      acc[date][curr.executive] = [];
    }
    const scores = Object.values(curr.scores);
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      acc[date][curr.executive].push(avgScore);
    }
    return acc;
  }, {});

  return Object.values(dataByDate).map(dateEntry => {
    const newDateEntry = { date: dateEntry.date };
    Object.keys(dateEntry).forEach(key => {
      if (key !== 'date') {
        const executiveScores = dateEntry[key];
        newDateEntry[key] = executiveScores.reduce((a, b) => a + b, 0) / executiveScores.length;
      }
    });
    return newDateEntry;
  });
};

const processDataForBarChart = (evaluations, section) => {
  const sectionEvaluations = evaluations.filter(e => e.section === section);
  const dataByCriterion = sectionEvaluations.reduce((acc, curr) => {
    Object.entries(curr.scores).forEach(([criterion, score]) => {
      if (!acc[criterion]) {
        acc[criterion] = { criterion: criterion, scores: [] };
      }
      acc[criterion].scores.push(score);
    });
    return acc;
  }, {});

  return Object.values(dataByCriterion).map(item => ({
    name: item.criterion,
    'Puntaje Promedio': item.scores.reduce((a, b) => a + b, 0) / item.scores.length,
  }));
};

const COLORS = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#20c997', '#fd7e14'];

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvaluations = useCallback(async () => {
    try {
      const q = query(collection(db, 'evaluations'), orderBy('evaluationDate', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedEvals = querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.evaluationDate?.toDate ? data.evaluationDate.toDate() : new Date(),
          managementDate: data.managementDate?.toDate ? data.managementDate.toDate() : null,
        };
      });
      setEvaluations(fetchedEvals);
    } catch (err) {
      console.error("Error al cargar las evaluaciones:", err);
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
  
  const executives = [...new Set(evaluations.map(e => e.executive))];
  const executiveColorMap = executives.reduce((acc, exec, index) => {
    acc[exec] = COLORS[index % COLORS.length];
    return acc;
  }, {});

  const transversalEvaluations = evaluations
    .filter(e => e.section === 'Aptitudes Transversales' && e.date)
    .sort((a, b) => a.date - b.date);
  const transversalDataLine = processDataForLineChart(transversalEvaluations, 'date');
  const transversalDataBar = processDataForBarChart(evaluations, 'Aptitudes Transversales');
  
  const performanceEvaluations = evaluations
    .filter(e => e.section === 'Calidad de Desempeño' && e.managementDate)
    .sort((a, b) => a.managementDate - b.managementDate);
  const performanceDataLine = processDataForLineChart(performanceEvaluations, 'managementDate');
  const performanceDataBar = processDataForBarChart(evaluations, 'Calidad de Desempeño');

  return (
    <>
      <h1>Dashboard de Evaluaciones</h1>
      <section className="dashboard-section">
        <h2>Calidad de Desempeño</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={performanceDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card"><h4>Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={performanceDataBar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend /><Bar dataKey="Puntaje Promedio" fill="var(--color-success)" /></BarChart></ResponsiveContainer></div>
        </div>
      </section>
      <section className="dashboard-section">
        <h2>Aptitudes Transversales</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={transversalDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card"><h4>Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={transversalDataBar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend /><Bar dataKey="Puntaje Promedio" fill="var(--color-primary)" /></BarChart></ResponsiveContainer></div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
