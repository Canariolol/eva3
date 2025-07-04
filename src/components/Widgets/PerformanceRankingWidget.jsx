import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PerformanceRankingWidget = ({ widget, tabId, isEditing, onEditingComplete }) => {
    const { evaluations, evaluationSections } = useGlobalContext();
    const [selectedSectionId, setSelectedSectionId] = useState(widget.sectionId || '');

    useEffect(() => {
        if (!isEditing) {
            setSelectedSectionId(widget.sectionId || '');
        }
    }, [isEditing, widget.sectionId]);

    const selectedSection = useMemo(() => {
        return evaluationSections.find(s => s.id === widget.sectionId);
    }, [widget.sectionId, evaluationSections]);

    const rankedExecutives = useMemo(() => {
        if (!selectedSection) return [];
        
        const sectionEvals = evaluations.filter(e => e.section === selectedSection.name);
        const executiveData = {};

        sectionEvals.forEach(ev => {
            if (!executiveData[ev.executive]) {
                executiveData[ev.executive] = { scores: [], count: 0 };
            }
            const scores = Object.values(ev.scores);
            if (scores.length > 0) {
                const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                executiveData[ev.executive].scores.push(avgScore);
                executiveData[ev.executive].count++;
            }
        });

        return Object.entries(executiveData)
            .map(([name, data]) => ({
                name,
                average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
            }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 5);

    }, [selectedSection, evaluations]);

    const handleSave = async () => {
        await updateDoc(doc(db, 'customTabs', tabId, 'widgets', widget.id), { sectionId: selectedSectionId });
        onEditingComplete();
    };

    return (
        <div>
            {isEditing ? (
                 <div className="widget-config">
                    <h5>Configurar Ranking</h5>
                    <select
                        className="form-control"
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                        <option value="" disabled>Selecciona una sección</option>
                        {evaluationSections.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={handleSave} className="btn btn-primary">Guardar</button>
                        <button onClick={onEditingComplete} className="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            ) : (
                <ul className="config-list performance-ranking-list">
                    {rankedExecutives.length > 0 ? (
                        rankedExecutives.map((exec, index) => (
                            <li key={exec.name} className="config-list-item">
                                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                    <span className="ranking-position">{index + 1}</span>
                                    <span>{exec.name}</span>
                                </div>
                                <span className="evaluation-avg">{exec.average.toFixed(2)}</span>
                            </li>
                        ))
                    ) : (
                        <p>No hay datos para este ranking.</p>
                    )}
                </ul>
            )}
        </div>
    );
};

export default PerformanceRankingWidget;
