import React, { useMemo } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';

const RecentActivityWidget = () => {
    const { evaluations } = useGlobalContext();

    const recentEvaluations = useMemo(() => {
        return [...evaluations]
            .sort((a, b) => b.evaluationDate - a.evaluationDate)
            .slice(0, 5);
    }, [evaluations]);

    return (
        <ul className="config-list recent-activity-list">
            {recentEvaluations.length > 0 ? (
                recentEvaluations.map(ev => (
                    <li key={ev.id} className="config-list-item">
                        <div>
                            <strong>{ev.executive}</strong>
                            <span className="evaluation-dates">{ev.section}</span>
                        </div>
                        <span className="evaluation-dates">
                            {ev.evaluationDate.toLocaleDateString('es-ES')}
                        </span>
                    </li>
                ))
            ) : (
                <p>No hay evaluaciones recientes.</p>
            )}
        </ul>
    );
};

export default RecentActivityWidget;
