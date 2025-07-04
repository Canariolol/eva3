import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const NeedsAttentionWidget = ({ widget, tabId, isEditing, onEditingComplete }) => {
    const { evaluations, evaluationSections, criteria, executives } = useGlobalContext();

    const [config, setConfig] = useState({
        trackingType: widget.trackingType || 'section',
        trackingId: widget.trackingId || '',
        condition: widget.condition || 'less_than',
        threshold: widget.threshold || 5,
    });
    
    useEffect(() => {
        if (!isEditing) {
            setConfig({
                trackingType: widget.trackingType || 'section',
                trackingId: widget.trackingId || '',
                condition: widget.condition || 'less_than',
                threshold: widget.threshold || 5,
            });
        }
    }, [isEditing, widget]);

    const deservingAttention = useMemo(() => {
        if (!config.trackingId) return [];

        return executives.map(exec => {
            let average = 0;
            let relevantEvals = [];

            if (config.trackingType === 'section') {
                const section = evaluationSections.find(s => s.id === config.trackingId);
                if (!section) return null;

                relevantEvals = evaluations.filter(
                    e => e.executive === exec.Nombre && e.section === section.name
                );

                if (relevantEvals.length > 0) {
                    const totalScore = relevantEvals.reduce((sum, e) => {
                        const scores = Object.values(e.scores);
                        return sum + (scores.reduce((a, b) => a + b, 0) / scores.length);
                    }, 0);
                    average = totalScore / relevantEvals.length;
                }

            } else { // trackingType === 'criterion'
                const criterion = criteria.find(c => c.id === config.trackingId);
                if (!criterion) return null;

                relevantEvals = evaluations.filter(
                    e => e.executive === exec.Nombre && typeof e.scores?.[criterion.name] === 'number'
                );

                if (relevantEvals.length > 0) {
                    const totalScore = relevantEvals.reduce((sum, e) => sum + e.scores[criterion.name], 0);
                    average = totalScore / relevantEvals.length;
                }
            }

            if (relevantEvals.length === 0) return null;

            if ((config.condition === 'less_than' && average < config.threshold) ||
                (config.condition === 'greater_than' && average > config.threshold)) {
                return { name: exec.Nombre, average: average.toFixed(2) };
            }
            return null;
        }).filter(Boolean);
    }, [config, evaluations, evaluationSections, criteria, executives]);

    const handleSave = async () => {
        await updateDoc(doc(db, 'customTabs', tabId, 'widgets', widget.id), config);
        onEditingComplete();
    };

    return (
        <div>
            {isEditing ? (
                <div className="widget-config">
                    <div className="form-group">
                        <label>Tipo de Seguimiento</label>
                        <select className="form-control" value={config.trackingType} onChange={e => setConfig({...config, trackingType: e.target.value, trackingId: ''})}>
                            <option value="section">Sección Completa</option>
                            <option value="criterion">Criterio Individual</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>{config.trackingType === 'section' ? 'Sección a Monitorear' : 'Criterio a Monitorear'}</label>
                        <select className="form-control" value={config.trackingId} onChange={e => setConfig({...config, trackingId: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            {(config.trackingType === 'section' ? evaluationSections : criteria).map(item => 
                                <option key={item.id} value={item.id}>{item.name}</option>
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Condición</label>
                        <select className="form-control" value={config.condition} onChange={e => setConfig({...config, condition: e.target.value})}>
                            <option value="less_than">Promedio MENOR que</option>
                            <option value="greater_than">Promedio MAYOR que</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Valor Umbral (0-10)</label>
                        <input type="number" step="0.1" min="0" max="10" className="form-control" value={config.threshold} onChange={e => setConfig({...config, threshold: parseFloat(e.target.value) || 0})} />
                    </div>
                     <div style={{display: 'flex', gap: '1rem'}}>
                        <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                        <button className="btn btn-secondary" onClick={onEditingComplete}>Cancelar</button>
                    </div>
                </div>
            ) : (
                <ul className="config-list">
                    {deservingAttention.length > 0 ? (
                        deservingAttention.map(exec => (
                            <li key={exec.name} className="config-list-item">
                                <span>{exec.name}</span>
                                <span className="evaluation-avg" style={{color: 'var(--color-danger)'}}>{exec.average}</span>
                            </li>
                        ))
                    ) : (
                        <p>Nadie cumple los criterios de atención.</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default NeedsAttentionWidget;
