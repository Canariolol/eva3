import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TooltipComponent from '../Tooltip';
import CustomTooltip from './CustomTooltip';

// --- FUNCIONES DE PROCESAMIENTO DE DATOS ---

const truncateName = (name) => {
    if (typeof name !== 'string') return '';
    const words = name.split(' ');
    if (words.length > 1) return `${words[0]}...`;
    return name;
};

const processDataForLineChart = (evaluations, dateField) => {
    const dataByDate = evaluations.reduce((acc, curr) => {
        const dateValue = curr[dateField];
        if (!dateValue || typeof dateValue.toLocaleDateString !== 'function') return acc;
        const date = dateValue.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        if (!acc[date]) acc[date] = { date };
        if (!acc[date][curr.executive]) acc[date][curr.executive] = [];
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

const processDataForBarChart = (sectionEvaluations, sectionName, criteriaConfig, chartState) => {
    if (!sectionEvaluations || sectionEvaluations.length === 0) return [];

    const criterionToSubsectionMap = criteriaConfig.reduce((acc, c) => {
        if (c.section === sectionName) {
             acc[c.name] = c.subsection || null;
        }
        return acc;
    }, {});
    
    const hasSubsections = Object.values(criterionToSubsectionMap).some(s => s !== null);

    if (hasSubsections) {
        const { view, selectedItem } = chartState;
        switch (view) {
            case 'byCriterionOfSubsection': {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        if (criterionToSubsectionMap[criterionName] === selectedItem) {
                            if (!data[criterionName]) data[criterionName] = [];
                            data[criterionName].push(score);
                        }
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
            }
            case 'allCriteria': {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        if (!data[criterionName]) data[criterionName] = [];
                        data[criterionName].push(score);
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
            }
            case 'bySubsection':
            default: {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        const subsection = criterionToSubsectionMap[criterionName] || 'Criterios Generales';
                        if (!data[subsection]) data[subsection] = [];
                        data[subsection].push(score);
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
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

const processNonEvaluableData = (sectionEvaluations, nonEvaluableCriteria, sectionName) => {
    const trackedCriteria = nonEvaluableCriteria.filter(c => c.section === sectionName && (c.trackInDashboard || c.trackEmptyInDashboard));
    let metrics = [];
    trackedCriteria.forEach(criterion => {
        if (criterion.trackInDashboard) {
            if (criterion.inputType === 'select') {
                const counts = (criterion.options || []).reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
                sectionEvaluations.forEach(ev => {
                    const value = ev.nonEvaluableData?.[criterion.name];
                    if (value && counts.hasOwnProperty(value)) counts[value]++;
                });
                metrics.push({ name: criterion.name, type: 'select', counts });
            } else {
                const count = sectionEvaluations.reduce((acc, ev) => (ev.nonEvaluableData?.[criterion.name] ? acc + 1 : acc), 0);
                metrics.push({ name: `${criterion.name} (Registrados)`, type: 'text', count });
            }
        }
        if (criterion.trackEmptyInDashboard) {
            let responded = 0, pending = 0;
            sectionEvaluations.forEach(ev => {
                const value = ev.nonEvaluableData?.[criterion.name];
                (!value || value.trim() === '' || value.toLowerCase() === 'n/a') ? pending++ : responded++;
            });
            metrics.push({ name: `${criterion.name} (Resumen)`, type: 'select', counts: { 'Respondidos': responded, 'Pendientes (N/A)': pending }});
        }
    });
    return metrics;
};

const processExecutiveAverages = (sectionEvaluations) => {
    const executiveData = {};
    sectionEvaluations.forEach(ev => {
        if (!executiveData[ev.executive]) executiveData[ev.executive] = { scores: [] };
        const scores = Object.values(ev.scores);
        if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            executiveData[ev.executive].scores.push(avgScore);
        }
    });
    return Object.entries(executiveData).map(([name, data]) => ({
        name,
        average: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
    })).sort((a, b) => b.average - a.average);
};

// --- COMPONENTE PRINCIPAL ---

const DashboardSection = ({ section, evaluations, criteriaConfig, nonEvaluableCriteria, executives, executiveColorMap }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');
    const [chartState, setChartState] = useState({ view: 'bySubsection', selectedItem: null });

    const sectionEvaluations = useMemo(() => evaluations.filter(e => e.section === section.name), [evaluations, section.name]);

    const hasSubsections = useMemo(() => criteriaConfig.some(c => c.section === section.name && c.subsection), [criteriaConfig, section.name]);

    const handleChartClick = (data) => {
        if (!hasSubsections || !data || !data.activePayload || !data.activePayload.length) return;
        
        const clickedItemName = data.activePayload[0].payload.name;
        setChartState(currentState => {
            switch (currentState.view) {
                case 'bySubsection': 
                    return { view: 'byCriterionOfSubsection', selectedItem: clickedItemName };
                case 'byCriterionOfSubsection': 
                    return { view: 'allCriteria', selectedItem: null };
                case 'allCriteria': 
                    return { view: 'bySubsection', selectedItem: null };
                default: 
                    return { view: 'bySubsection', selectedItem: null };
            }
        });
    };

    const getChartTitle = () => {
        if (!hasSubsections) return 'Promedio por Criterio';
        const { view, selectedItem } = chartState;
        switch (view) {
            case 'byCriterionOfSubsection': return `Detalle: ${selectedItem}`;
            case 'allCriteria': return 'Promedio por Criterio (Todos)';
            default: return 'Promedio por Subsección';
        }
    };

    const openModal = (data, title) => {
        setModalData(data);
        setModalTitle(title);
        setIsModalOpen(true);
    };

    const pluralize = (count, singular, plural) => (count === 1 ? singular : plural || `${singular}s`);

    const renderExecutiveSummary = (averages, title, color) => (
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
            <h4 className="card-title" style={{backgroundColor: color + '20', color: color}}>{`Resumen por Ejecutivo: ${title}`}</h4>
            <ul className="config-list">
                {averages.slice(0, 5).map(avg => (
                    <li key={avg.name} className="config-list-item"><span>{avg.name}</span><span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span></li>
                ))}
            </ul>
            {averages.length > 5 && (<button className="btn-link" onClick={() => openModal(averages, `Resumen completo: ${title}`)}>Ver más...</button>)}
        </div>
    );

    const renderAdditionalMetricsCard = (title, evaluations, nonEvaluable, overallAverage, color) => (
         <div className="card" style={{flex: 1, minWidth: '400px'}}>
            <h4 className="card-title" style={{ backgroundColor: color + '20', color: color }}>{title}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', height: 'calc(100% - 40px)' }}>
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
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#6c757d', textAlign: 'center' }}>Promedio General</p>
                        <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 'bold', lineHeight: 1.2, color: color }}>{overallAverage.toFixed(2)}</p>
                    </div>
                </>
                )}
            </div>
        </div>
    );

    const dateField = section.name === 'Calidad de Desempeño' ? 'managementDate' : 'evaluationDate';
    const lineData = useMemo(() => processDataForLineChart(sectionEvaluations.filter(e => e[dateField]), dateField), [sectionEvaluations, dateField]);
    const barData = useMemo(() => processDataForBarChart(sectionEvaluations, section.name, criteriaConfig, chartState), [sectionEvaluations, section.name, criteriaConfig, chartState]);
    const nonEvaluable = useMemo(() => processNonEvaluableData(sectionEvaluations, nonEvaluableCriteria, section.name), [sectionEvaluations, nonEvaluableCriteria, section.name]);
    const executiveAverages = useMemo(() => processExecutiveAverages(sectionEvaluations), [sectionEvaluations]);
    const overallAverage = useMemo(() => executiveAverages.reduce((sum, exec) => sum + exec.average, 0) / (executiveAverages.length || 1), [executiveAverages]);

    return (
        <section className="dashboard-section">
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <h2>{section.name}</h2>
                <TooltipComponent text={section.description || 'Sin descripción'} />
            </div>
            <div className="dashboard-grid">
                <div className="card">
                    <h4 className="card-title" style={{backgroundColor: section.color + '20', color: section.color}}>Progreso Comparativo</h4>
                    <ResponsiveContainer width="100%" height={300}><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executives.map(name => (<Line connectNulls={true} key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name] || '#ccc'} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer>
                </div>
                <div className="card">
                    <h4 className="card-title" style={{backgroundColor: section.color + '20', color: section.color}}>
                        <span>{getChartTitle()}</span>
                        {hasSubsections && <span className="chart-click-hint">Haz click en el gráfico para mayor detalle</span>}
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} onClick={handleChartClick} margin={{ top: 5, right: 20, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }}/><YAxis domain={[0, 10]} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Puntaje Promedio" fill={section.color} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem', alignItems: 'stretch' }}>
                {(nonEvaluable.length > 0 || sectionEvaluations.length > 0) && renderAdditionalMetricsCard('Métricas Adicionales', sectionEvaluations, nonEvaluable, overallAverage, section.color)}
                {executiveAverages.length > 0 && renderExecutiveSummary(executiveAverages, section.name, section.color)}
            </div>
             {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
                        <h3>{modalTitle}</h3>
                        <ul className="config-list" style={{marginTop: '1.5rem'}}>
                            {modalData.map(avg => (<li key={avg.name} className="config-list-item"><span>{avg.name}</span><span style={{fontWeight: 'bold'}}>{avg.average.toFixed(2)}</span></li>))}
                        </ul>
                    </div>
                </div>
            )}
        </section>
    );
};

export default DashboardSection;
