import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomTooltip from '../Dashboard/CustomTooltip';

const QuickChartWidget = ({ widget, tabId, isEditing, onEditingComplete }) => {
    const { criteria, evaluations, executives } = useGlobalContext();
    
    const [config, setConfig] = useState({
        criterionId: widget.criterionId || '',
        chartType: widget.chartType || 'bar'
    });

    useEffect(() => {
        if (isEditing) {
            setConfig({
                criterionId: widget.criterionId || '',
                chartType: widget.chartType || 'bar'
            });
        }
    }, [isEditing, widget]);

    const selectedCriterion = useMemo(() => {
        if (!widget.criterionId) return null;
        return criteria.find(c => c.id === widget.criterionId);
    }, [widget.criterionId, criteria]);

    const chartData = useMemo(() => {
        if (!selectedCriterion) return [];

        return executives.map(exec => {
            const relevantEvals = evaluations.filter(
                e => e.executive === exec.Nombre && e.scores && typeof e.scores[selectedCriterion.name] === 'number'
            );
            if (relevantEvals.length === 0) return null;

            const totalScore = relevantEvals.reduce((sum, e) => sum + e.scores[selectedCriterion.name], 0);
            const average = totalScore / relevantEvals.length;
            
            return {
                name: exec.Nombre,
                shortName: exec.Nombre.split(' ')[0],
                'Puntaje': average,
            };
        }).filter(Boolean);

    }, [selectedCriterion, evaluations, executives]);

    const handleSave = async () => {
        await updateDoc(doc(db, 'customTabs', tabId, 'widgets', widget.id), config);
        onEditingComplete(config); // Devolver la nueva configuración al padre
    };

    const renderChart = () => {
        const chartType = widget.chartType || 'bar';
        if (chartData.length === 0) {
            return <p style={{textAlign: 'center', padding: '1rem'}}>No hay datos para mostrar con la configuración actual.</p>;
        }

        const commonProps = {
            width: "100%",
            height: 250,
            data: chartData,
            margin: { top: 5, right: 20, left: 0, bottom: 40 }
        };

        if (chartType === 'line') {
            return (
                <ResponsiveContainer {...commonProps}>
                    <LineChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 10]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Puntaje" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer {...commonProps}>
                <BarChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortName" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Puntaje" fill={'#8884d8'} />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div>
            {isEditing ? (
                 <div className="widget-config">
                    <h5>Configurar Gráfico</h5>
                    <div className="form-group">
                        <label>Criterio a Graficar</label>
                        <select
                            className="form-control"
                            value={config.criterionId}
                            onChange={(e) => setConfig({...config, criterionId: e.target.value})}
                        >
                            <option value="" disabled>Selecciona un criterio</option>
                            {criteria.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="form-group">
                        <label>Tipo de Gráfico</label>
                        <select
                            className="form-control"
                            value={config.chartType}
                            onChange={(e) => setConfig({...config, chartType: e.target.value})}
                        >
                            <option value="bar">Barras</option>
                            <option value="line">Líneas</option>
                        </select>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                        <button className="btn btn-secondary" onClick={() => onEditingComplete()}>Cancelar</button>
                    </div>
                </div>
            ) : (
                renderChart()
            )}
        </div>
    );
};

export default QuickChartWidget;
