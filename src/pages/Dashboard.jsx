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

const processDataForBarChart = (evaluations, section, criteriaConfig, chartState = null) => {
  const sectionEvaluations = evaluations.filter(e => e.section === section);

  // New logic for transversal chart with drill-down
  if (section === 'Aptitudes Transversales' && chartState) {
    const { view, selectedSubsection } = chartState;
    const criterionToSubsectionMap = criteriaConfig
        .filter(c => c.section === 'Aptitudes Transversales')
        .reduce((acc, c) => {
            acc[c.name] = c.subsection || 'Sin Subsección';
            return acc;
        }, {});

    switch (view) {
        case 'byCriterion': {
            const dataByCriterion = {};
            sectionEvaluations.forEach(ev => {
                Object.entries(ev.scores).forEach(([criterionName, score]) => {
                    if (criterionToSubsectionMap[criterionName] === selectedSubsection) {
                        if (!dataByCriterion[criterionName]) dataByCriterion[criterionName] = [];
                        dataByCriterion[criterionName].push(score);
                    }
                });
            });
            return Object.entries(dataByCriterion).map(([name, scores]) => ({
                name,
                'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        }
        case 'allCriteria': {
            const dataByCriterion = {};
             sectionEvaluations.forEach(ev => {
                Object.entries(ev.scores).forEach(([criterionName, score]) => {
                    if (!dataByCriterion[criterionName]) dataByCriterion[criterionName] = [];
                    dataByCriterion[criterionName].push(score);
                });
            });
             return Object.entries(dataByCriterion).map(([name, scores]) => ({
                name,
                'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        }
        case 'bySubsection':
        default: {
            const dataBySubsection = {};
            sectionEvaluations.forEach(ev => {
                Object.entries(ev.scores).forEach(([criterionName, score]) => {
                    const subsection = criterionToSubsectionMap[criterionName];
                    if (subsection) {
                        if (!dataBySubsection[subsection]) dataBySubsection[subsection] = [];
                        dataBySubsection[subsection].push(score);
                    }
                });
            });
            return Object.entries(dataBySubsection).map(([name, scores]) => ({
                name,
                'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        }
    }
  }

  // Original logic for other sections (e.g., Calidad de Desempeño)
  const dataByCriterion = sectionEvaluations.reduce((acc, curr) => {
    Object.entries(curr.scores).forEach(([criterion, score]) => {
      if (!acc[criterion]) acc[criterion] = [];
      acc[criterion].push(score);
    });
    return acc;
  }, {});

  return Object.entries(dataByCriterion).map(([name, scores]) => ({
    name: name,
    'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
  }));
};

const processNonEvaluableData = (sectionEvaluations, nonEvaluableCriteria, section) => {
  const trackedCriteria = nonEvaluableCriteria.filter(c => c.section === section && c.trackInDashboard);
  
  const metrics = trackedCriteria.map(criterion => {
    if (criterion.inputType === 'select') {
      const counts = criterion.options.reduce((acc, option) => {
        acc[option] = 0;
        return acc;
      }, {});

      sectionEvaluations.forEach(ev => {
        if (ev.nonEvaluableData && ev.nonEvaluableData[criterion.name]) {
          const selectedOption = ev.nonEvaluableData[criterion.name];
          if (counts.hasOwnProperty(selectedOption)) {
            counts[selectedOption]++;
          }
        }
      });
      return { name: criterion.name, type: 'select', counts };
    } 
    else {
      const count = sectionEvaluations.reduce((acc, ev) => {
        if (ev.nonEvaluableData && ev.nonEvaluableData[criterion.name]) {
          return acc + 1;
        }
        return acc;
      }, 0);
      return { name: criterion.name, type: 'text', count };
    }
  });

  return metrics;
};

const processExecutiveAverages = (sectionEvaluations) => {
    const executiveData = {};

    sectionEvaluations.forEach(ev => {
        if (!executiveData[ev.executive]) {
            executiveData[ev.executive] = { scores: [], count: 0 };
        }
        const scores = Object.values(ev.scores);
        if(scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            executiveData[ev.executive].scores.push(avgScore);
        }
    });

    return Object.entries(executiveData).map(([name, data]) => ({
        name,
        average: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
    })).sort((a, b) => b.average - a.average);
};


const COLORS = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#20c997', '#fd7e14'];

const Dashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [criteriaConfig, setCriteriaConfig] = useState([]);
  const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [transversalChartState, setTransversalChartState] = useState({ view: 'bySubsection', selectedSubsection: null });

  const fetchData = useCallback(async () => {
    try {
      const [evalsSnapshot, nonEvalCritSnapshot, criteriaSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'evaluations'), orderBy('evaluationDate', 'asc'))),
        getDocs(query(collection(db, 'nonEvaluableCriteria'))),
        getDocs(query(collection(db, 'criteria')))
      ]);

      const fetchedEvals = evalsSnapshot.docs.map(d => ({
        id: d.id, ...d.data(),
        date: d.data().evaluationDate?.toDate ? d.data().evaluationDate.toDate() : new Date(),
        managementDate: d.data().managementDate?.toDate ? d.data().managementDate.toDate() : null,
      }));
      setEvaluations(fetchedEvals);

      setNonEvaluableCriteria(nonEvalCritSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setCriteriaConfig(criteriaSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error("Error al cargar los datos:", err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleTransversalChartClick = (data) => {
    if (!data || !data.activePayload || !data.activePayload.length) return;

    const clickedItemName = data.activePayload[0].payload.name;

    setTransversalChartState(currentState => {
        switch (currentState.view) {
            case 'bySubsection':
                return { view: 'byCriterion', selectedSubsection: clickedItemName };
            case 'byCriterion':
                return { view: 'allCriteria', selectedSubsection: null };
            case 'allCriteria':
                return { view: 'bySubsection', selectedSubsection: null };
            default:
                return { view: 'bySubsection', selectedSubsection: null };
        }
    });
  };

  const getTransversalChartTitle = () => {
    const { view, selectedSubsection } = transversalChartState;
    switch(view) {
        case 'byCriterion':
            return `Detalle: ${selectedSubsection}`;
        case 'allCriteria':
            return 'Promedio por Criterio (Todos)';
        case 'bySubsection':
        default:
            return 'Promedio por Subsección';
    }
  };

  const openModal = (data, title) => {
    setModalData(data);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  if (loading) return <h1>Cargando datos...</h1>;
  if (error) return <h1>{error}</h1>;
  if (evaluations.length === 0) return (<div><h1>Dashboard</h1><p>Aún no hay datos para mostrar. Ve a <b>Evaluar</b> para registrar la primera evaluación.</p></div>);
  
  const executives = [...new Set(evaluations.map(e => e.executive))];
  const executiveColorMap = executives.reduce((acc, exec, index) => {
    acc[exec] = COLORS[index % COLORS.length];
    return acc;
  }, {});

  const transversalEvaluations = evaluations.filter(e => e.section === 'Aptitudes Transversales');
  const transversalDataLine = processDataForLineChart(transversalEvaluations.filter(e => e.date).sort((a,b) => a.date - b.date), 'date');
  const transversalDataBar = processDataForBarChart(evaluations, 'Aptitudes Transversales', criteriaConfig, transversalChartState);
  const transversalNonEvaluable = processNonEvaluableData(transversalEvaluations, nonEvaluableCriteria, 'Aptitudes Transversales');
  const transversalExecutiveAverages = processExecutiveAverages(transversalEvaluations);
  
  const performanceEvaluations = evaluations.filter(e => e.section === 'Calidad de Desempeño');
  const performanceDataLine = processDataForLineChart(performanceEvaluations.filter(e => e.managementDate).sort((a,b) => a.managementDate - b.managementDate), 'managementDate');
  const performanceDataBar = processDataForBarChart(evaluations, 'Calidad de Desempeño', criteriaConfig);
  const performanceNonEvaluable = processNonEvaluableData(performanceEvaluations, nonEvaluableCriteria, 'Calidad de Desempeño');
  const performanceExecutiveAverages = processExecutiveAverages(performanceEvaluations);

  const pluralize = (count, singular, plural) => (count === 1 ? singular : plural || `${singular}s`);

  const renderExecutiveSummary = (averages, title) => (
    <div className="card" style={{ flex: 1 }}>
        <h4>Resumen por Ejecutivo</h4>
        <ul className="config-list">
            {averages.slice(0, 5).map(avg => (
                <li key={avg.name} className="config-list-item">
                    <span>{avg.name}</span>
                    <span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span>
                </li>
            ))}
        </ul>
        {averages.length > 5 && (
            <button className="btn-link" onClick={() => openModal(averages, `Resumen completo: ${title}`)}>
                Ver más...
            </button>
        )}
    </div>
  );

  return (
    <>
      <h1>Dashboard de Evaluaciones</h1>
      <section className="dashboard-section">
        <h2>Calidad de Desempeño</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={performanceDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card"><h4>Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={performanceDataBar}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 10]} /><Tooltip /><Legend /><Bar dataKey="Puntaje Promedio" fill="var(--color-success)" /></BarChart></ResponsiveContainer></div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            {(performanceNonEvaluable.length > 0 || performanceEvaluations.length > 0) && (
              <div className="card" style={{flex: 1}}>
                <h4>Métricas Adicionales</h4>
                <p><strong>{pluralize(performanceEvaluations.length, 'Evaluación Realizada', 'Evaluaciones Realizadas')}:</strong> {performanceEvaluations.length}</p>
                {performanceNonEvaluable.map(metric => (
                  <div key={metric.name}>
                    {metric.type === 'select' ? (
                      <>
                        <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                        <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                          {Object.entries(metric.counts).map(([option, count]) => (
                            <li key={option}>{pluralize(count, option)}: {count}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p><strong>{pluralize(metric.count, metric.name)}:</strong> {metric.count}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {performanceExecutiveAverages.length > 0 && renderExecutiveSummary(performanceExecutiveAverages, 'Calidad de Desempeño')}
        </div>
      </section>
      <section className="dashboard-section">
        <h2>Aptitudes Transversales</h2>
        <div className="dashboard-grid">
          <div className="card"><h4>Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={transversalDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
          <div className="card">
            <h4>{getTransversalChartTitle()}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transversalDataBar} onClick={handleTransversalChartClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Puntaje Promedio" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            {(transversalNonEvaluable.length > 0 || transversalEvaluations.length > 0) && (
              <div className="card" style={{flex: 1}}>
                <h4>Métricas Adicionales</h4>
                <p><strong>{pluralize(transversalEvaluations.length, 'Evaluación Realizada', 'Evaluaciones Realizadas')}:</strong> {transversalEvaluations.length}</p>
                {transversalNonEvaluable.map(metric => (
                   <div key={metric.name}>
                    {metric.type === 'select' ? (
                      <>
                        <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                        <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                          {Object.entries(metric.counts).map(([option, count]) => (
                            <li key={option}>{pluralize(count, option)}: {count}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p><strong>{pluralize(metric.count, metric.name)}:</strong> {metric.count}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {transversalExecutiveAverages.length > 0 && renderExecutiveSummary(transversalExecutiveAverages, 'Aptitudes Transversales')}
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
                <h3>{modalTitle}</h3>
                <ul className="config-list" style={{marginTop: '1.5rem'}}>
                    {modalData.map(avg => (
                        <li key={avg.name} className="config-list-item">
                            <span>{avg.name}</span>
                            <span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
