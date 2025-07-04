import React, { useState, useMemo, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const KeyMetricsWidget = ({ widget, tabId, isEditing, onEditingComplete }) => {
    const { criteria, evaluations } = useGlobalContext();
    const [selectedCriterionId, setSelectedCriterionId] = useState(widget.criterionId || '');

    useEffect(() => {
        if (!isEditing) {
            setSelectedCriterionId(widget.criterionId || '');
        }
    }, [isEditing, widget.criterionId]);
    
    const selectedCriterion = useMemo(() => {
        return criteria.find(c => c.id === widget.criterionId);
    }, [widget.criterionId, criteria]);

    const averageScore = useMemo(() => {
        if (!selectedCriterion) return 0;
        const relevantEvals = evaluations.filter(e => e.scores && typeof e.scores[selectedCriterion.name] === 'number');
        if (relevantEvals.length === 0) return 0;
        const totalScore = relevantEvals.reduce((sum, e) => sum + e.scores[selectedCriterion.name], 0);
        return totalScore / relevantEvals.length;
    }, [selectedCriterion, evaluations]);

    const handleSave = async () => {
        await updateDoc(doc(db, 'customTabs', tabId, 'widgets', widget.id), { criterionId: selectedCriterionId });
        onEditingComplete();
    };

    return (
        <div>
            {isEditing ? (
                <div className="widget-config">
                    <h5>Configurar Métrica</h5>
                    <select
                        className="form-control"
                        value={selectedCriterionId}
                        onChange={(e) => setSelectedCriterionId(e.target.value)}
                    >
                        <option value="" disabled>Selecciona un criterio</option>
                        {criteria.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={handleSave} className="btn btn-primary">Guardar</button>
                        <button onClick={onEditingComplete} className="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            ) : (
                <div className="metric-value">
                    {averageScore > 0 ? averageScore.toFixed(2) : 'N/A'}
                </div>
            )}
        </div>
    );
};

export default KeyMetricsWidget;
