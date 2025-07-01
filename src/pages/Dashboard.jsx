import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const truncateName = (name) => {
    const words = name.split(' ');
    if (words.length > 1) {
        return `${words[0]}...`;
    }
    return name;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <p className="label" style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{payload[0].payload.name}</p>
        <p className="intro" style={{ margin: '5px 0 0' }}>
          <span style={{ color: payload[0].fill }}>{`${payload[0].name}: `}</span>
          <span style={{ fontWeight: 'bold' }}>{payload[0].value.toFixed(2)}</span>
        </p>
      </div>
    );
  }

  return null;
};

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
        newDateEntry[key] = parseFloat((executiveScores.reduce((a, b) => a + b, 0) / executiveScores.length).toFixed(2));
      }
    });
    return newDateEntry;
  });
};

const processDataForBarChart = (evaluations, section, criteriaConfig, chartState = null) => {
  const sectionEvaluations = evaluations.filter(e => e.section === section);

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
                shortName: truncateName(name),
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
                shortName: truncateName(name),
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
                shortName: truncateName(name),
                'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        }
    }
  }

  const dataByCriterion = sectionEvaluations.reduce((acc, curr) => {
    Object.entries(curr.scores).forEach(([criterion, score]) => {
      if (!acc[criterion]) acc[criterion] = [];
      acc[criterion].push(score);
    });
    return acc;
  }, {});

  return Object.entries(dataByCriterion).map(([name, scores]) => ({
    name: name,
    shortName: truncateName(name),
    'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
  }));
};

const processNonEvaluableData = (sectionEvaluations, nonEvaluableCriteria, section) => {
  const trackedCriteria = nonEvaluableCriteria.filter(c => c.section === section && (c.trackInDashboard || c.trackEmptyInDashboard));
  
  let metrics = [];

  trackedCriteria.forEach(criterion => {
    if (criterion.trackInDashboard) {
        if (criterion.inputType === 'select') {
          const counts = criterion.options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
          sectionEvaluations.forEach(ev => {
            const value = ev.nonEvaluableData?.[criterion.name];
            if (value && counts.hasOwnProperty(value)) {
              counts[value]++;
            }
          });
          metrics.push({ name: criterion.name, type: 'select', counts });
        } else {
          const count = sectionEvaluations.reduce((acc, ev) => (ev.nonEvaluableData?.[criterion.name] ? acc + 1 : acc), 0);
          metrics.push({ name: `${criterion.name} (Registrados)`, type: 'text', count });
        }
    }
    
    if (criterion.trackEmptyInDashboard) {
      let responded = 0;
      let pending = 0;
      sectionEvaluations.forEach(ev => {
        const value = ev.nonEvaluableData?.[criterion.name];
        if (!value || value.trim() === '' || value.toLowerCase() === 'n/a') {
          pending++;
        } else {
          responded++;
        }
      });
      
      metrics.push({
          name: `${criterion.name}(s)`,
          type: 'select', // Use 'select' type to be handled by the renderer
          counts: {
              'Ingresados': responded,
              'Sin ingreso (N/A)': pending,
          }
      });
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
    const { evaluations, criteria: criteriaConfig, nonEvaluableCriteria } = useGlobalContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [transversalChartState, setTransversalChartState] = useState({ view: 'bySubsection', selectedSubsection: null });

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

    if (evaluations.length === 0) return (<div><h1>Dashboard</h1><p>Aún no hay datos para mostrar. Ve a <b>Evaluar</b> para registrar la primera evaluación.</p></div>);
  
    const executives = [...new Set(evaluations.map(e => e.executive))];
    const executiveColorMap = executives.reduce((acc, exec, index) => {
        acc[exec] = COLORS[index % COLORS.length];
        return acc;
    }, {});

    const transversalEvaluations = evaluations.filter(e => e.section === 'Aptitudes Transversales');
    const transversalDataLine = processDataForLineChart(transversalEvaluations.filter(e => e.evaluationDate).sort((a,b) => a.evaluationDate - b.evaluationDate), 'evaluationDate');
    const transversalDataBar = processDataForBarChart(evaluations, 'Aptitudes Transversales', criteriaConfig, transversalChartState);
    const transversalNonEvaluable = processNonEvaluableData(transversalEvaluations, nonEvaluableCriteria, 'Aptitudes Transversales');
    const transversalExecutiveAverages = processExecutiveAverages(transversalEvaluations);
    const transversalOverallAverage = transversalEvaluations.length > 0
        ? transversalEvaluations.flatMap(e => Object.values(e.scores)).reduce((a, b) => a + b, 0) / transversalEvaluations.flatMap(e => Object.values(e.scores)).length
        : 0;
  
    const performanceEvaluations = evaluations.filter(e => e.section === 'Calidad de Desempeño');
    const performanceDataLine = processDataForLineChart(performanceEvaluations.filter(e => e.managementDate).sort((a,b) => a.managementDate - b.managementDate), 'managementDate');
    const performanceDataBar = processDataForBarChart(evaluations, 'Calidad de Desempeño', criteriaConfig);
    const performanceNonEvaluable = processNonEvaluableData(performanceEvaluations, nonEvaluableCriteria, 'Calidad de Desempeño');
    const performanceExecutiveAverages = processExecutiveAverages(performanceEvaluations);
    const performanceOverallAverage = performanceEvaluations.length > 0
        ? performanceEvaluations.flatMap(e => Object.values(e.scores)).reduce((a, b) => a + b, 0) / performanceEvaluations.flatMap(e => Object.values(e.scores)).length
        : 0;

    const pluralize = (count, singular, plural) => (count === 1 ? singular : plural || `${singular}s`);

    const renderExecutiveSummary = (averages, title) => (
        <div className="card" style={{ flex: 1 }}>
            <h4 className="card-title">{`Resumen por Ejecutivo: ${title}`}</h4>
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

    const renderAdditionalMetricsCard = (title, evaluations, nonEvaluable, overallAverage, color) => (
        <div className="card" style={{flex: 1}}>
        <h4 className={`card-title ${color === 'var(--color-primary)' ? 'card-title-primary' : 'card-title-success'}`}>{title}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', height: 'calc(100% - 2.5rem)' }}>
            <div style={{ flex: 1, paddingRight: '1rem', overflowY: 'auto' }}>
            <p><strong>{pluralize(evaluations.length, 'Evaluación Realizada', 'Evaluaciones Realizadas')}:</strong> {evaluations.length}</p>
            {nonEvaluable.map(metric => (
                <div key={metric.name}>
                {metric.type === 'select' ? (
                    <>
                    <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                    <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                        {Object.entries(metric.counts).map(([option, count]) => (
                        <li key={option}>{option}: {count}</li>
                        ))}
                    </ul>
                    </>
                ) : (
                    <p><strong>{pluralize(metric.count, metric.name, metric.name)}:</strong> {metric.count}</p>
                )}
                </div>
            ))}
            </div>
            
            {overallAverage > 0 && (
            <>
                <div style={{ borderLeft: '1px solid #ccc', margin: '0 1rem' }}></div>
                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingLeft: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color-light)', textAlign: 'center' }}>Promedio General</p>
                    <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 'bold', lineHeight: 1.2, color: color }}>
                        {overallAverage.toFixed(2)}
                    </p>
                </div>
            </>
            )}
        </div>
        </div>
    );

    return (
        <>
        <h1>Dashboard de Evaluaciones</h1>
        <section className="dashboard-section">
            <h2>Calidad de Desempeño</h2>
            <div className="dashboard-grid">
            <div className="card"><h4 className="card-title card-title-success">Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={performanceDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line connectNulls={true} key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
            <div className="card"><h4 className="card-title card-title-success">Promedio por Criterio</h4><ResponsiveContainer width="100%" height={300}><BarChart data={performanceDataBar} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }}/><YAxis domain={[0, 10]} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Puntaje Promedio" fill="var(--color-success)" /></BarChart></ResponsiveContainer></div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', alignItems: 'stretch' }}>
                {(performanceNonEvaluable.length > 0 || performanceEvaluations.length > 0) && 
                renderAdditionalMetricsCard('Métricas Adicionales', performanceEvaluations, performanceNonEvaluable, performanceOverallAverage, 'var(--color-success)')
                }
                {performanceExecutiveAverages.length > 0 && renderExecutiveSummary(performanceExecutiveAverages, 'Calidad de Desempeño')}
            </div>
        </section>
        <section className="dashboard-section">
            <h2>Aptitudes Transversales</h2>
            <div className="dashboard-grid">
            <div className="card"><h4 className="card-title card-title-primary">Progreso Comparativo</h4><ResponsiveContainer width="100%" height={300}><LineChart data={transversalDataLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line connectNulls={true} key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name]} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer></div>
            <div className="card">
                <h4 className="card-title card-title-primary">{getTransversalChartTitle()}</h4>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transversalDataBar} onClick={handleTransversalChartClick} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Puntaje Promedio" fill="var(--color-primary)" />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', alignItems: 'stretch' }}>
                {(transversalNonEvaluable.length > 0 || transversalEvaluations.length > 0) && 
                renderAdditionalMetricsCard('Métricas Adicionales', transversalEvaluations, transversalNonEvaluable, transversalOverallAverage, 'var(--color-primary)')
                }
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
