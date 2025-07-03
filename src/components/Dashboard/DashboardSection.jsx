import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TooltipComponent from '../Tooltip';
import CustomTooltip from './CustomTooltip';
import ExecutiveSummaryCard from './ExecutiveSummaryCard';
import AdditionalMetricsCard from './AdditionalMetricsCard';
import { 
    processDataForLineChart, 
    processDataForBarChart, 
    processNonEvaluableData, 
    processExecutiveAverages 
} from '../../utils/dashboardUtils';

const DashboardSection = ({ section, evaluations, criteriaConfig, nonEvaluableCriteria, executives, executiveColorMap, onEvaluationSelect, userRole }) => {
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

    const dateField = section.name === 'Calidad de Desempeño' ? 'managementDate' : 'evaluationDate';
    const lineData = useMemo(() => processDataForLineChart(sectionEvaluations.filter(e => e[dateField]), dateField), [sectionEvaluations, dateField]);
    const barData = useMemo(() => processDataForBarChart(sectionEvaluations, section.name, criteriaConfig, chartState), [sectionEvaluations, section.name, criteriaConfig, chartState]);
    const nonEvaluable = useMemo(() => processNonEvaluableData(sectionEvaluations, nonEvaluableCriteria, section.name, executives), [sectionEvaluations, nonEvaluableCriteria, section.name, executives]);
    const executiveAverages = useMemo(() => processExecutiveAverages(sectionEvaluations), [sectionEvaluations]);
    const overallAverage = useMemo(() => executiveAverages.reduce((sum, exec) => sum + exec.average, 0) / (executiveAverages.length || 1), [executiveAverages]);

    if (sectionEvaluations.length === 0) return null;
    
    const executivesInLineChart = useMemo(() => [...new Set(sectionEvaluations.map(e => e.executive))], [sectionEvaluations]);


    return (
        <section className="dashboard-section">
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <h2>{section.name}</h2>
                <TooltipComponent text={section.description || 'Sin descripción'} />
            </div>
            <div className="dashboard-grid">
                <div className="card">
                    <h4 className="card-title" style={{backgroundColor: section.color + '20', color: section.color}}>Progreso Comparativo</h4>
                    <ResponsiveContainer width="100%" height={300}><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 10]} /><Tooltip /><Legend />{executivesInLineChart.map(name => (<Line connectNulls={true} key={name} type="monotone" dataKey={name} stroke={executiveColorMap[name] || '#ccc'} activeDot={{ r: 8 }} />))}</LineChart></ResponsiveContainer>
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
                {(nonEvaluable.length > 0 || sectionEvaluations.length > 0) && 
                    <AdditionalMetricsCard 
                        title="Métricas Adicionales"
                        evaluations={sectionEvaluations}
                        nonEvaluable={nonEvaluable}
                        overallAverage={overallAverage}
                        color={section.color}
                        onEvaluationSelect={onEvaluationSelect}
                        userRole={userRole}
                    />
                }
                {executiveAverages.length > 0 && 
                    <ExecutiveSummaryCard 
                        averages={executiveAverages}
                        title={section.name}
                        color={section.color}
                    />
                }
            </div>
        </section>
    );
};

export default DashboardSection;
