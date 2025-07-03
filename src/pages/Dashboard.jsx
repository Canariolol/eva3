import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import DashboardSection from '../components/Dashboard/DashboardSection';

const Dashboard = () => {
    const navigate = useNavigate();
    const { 
        evaluations, 
        criteria, 
        nonEvaluableCriteria, 
        evaluationSections,
        executives: allExecutives
    } = useGlobalContext();

    const handleEvaluationSelect = (evaluationId, executiveId) => {
        if (executiveId) {
            navigate(`/team?executiveId=${executiveId}&evaluationId=${evaluationId}`);
        } else {
            // Fallback por si no se encuentra el ID del ejecutivo
            navigate('/team');
        }
    };

    if (evaluations.length === 0) {
        return (
            <div>
                <h1>Dashboard</h1>
                <p>Aún no hay datos para mostrar. Ve a <b>Evaluar</b> para registrar la primera evaluación.</p>
            </div>
        );
    }
    
    const executivesInEvaluations = [...new Set(evaluations.map(e => e.executive))];
    const executiveColorMap = executivesInEvaluations.reduce((acc, exec, idx) => {
        acc[exec] = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1'][idx % 6];
        return acc;
    }, {});

    return (
        <>
            <h1>Dashboard de Evaluaciones</h1>
            
            {evaluationSections
                .filter(section => section.showInDashboard)
                .map((section) => (
                    <DashboardSection
                        key={section.id}
                        section={section}
                        evaluations={evaluations}
                        criteriaConfig={criteria}
                        nonEvaluableCriteria={nonEvaluableCriteria}
                        executives={allExecutives}
                        executiveColorMap={executiveColorMap}
                        onEvaluationSelect={handleEvaluationSelect}
                    />
                ))}
        </>
    );
};

export default Dashboard;
