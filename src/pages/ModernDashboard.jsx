import React from 'react';
// --- IMPORTACIÓN CORREGIDA ---
import { Users, ClipboardCheck, AlertTriangle, CheckCircle } from 'lucide-react'; 
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useGlobalContext } from '../context/GlobalContext';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler
);

// --- SUBCOMPONENTES VISUALES ---
const StatCard = ({ icon, value, label, change, color }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
        </div>
        {change && <p className={`text-sm font-medium ml-auto ${change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{change}</p>}
    </div>
);

const TeamMemberRow = ({ name, role, score, avatarColor }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${avatarColor}`}>
                {name.charAt(0)}
            </div>
            <div>
                <p className="font-semibold text-gray-800 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{role}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg text-gray-800 dark:text-white">{score}%</p>
            <p className="text-xs text-emerald-500">Excelente</p>
        </div>
    </div>
);

const TaskItem = ({ title, status, completed }) => (
    <div className="flex items-center gap-4 py-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${completed ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-zinc-100 dark:bg-zinc-700'}`}>
            {/* --- ICONO CORREGIDO --- */}
            {completed ? <CheckCircle className="text-emerald-500" /> : <ClipboardCheck className="text-zinc-500" />}
        </div>
        <div>
            <p className="font-semibold text-gray-800 dark:text-white">{title}</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{status}</p>
        </div>
    </div>
);


// --- COMPONENTE PRINCIPAL DEL DASHBOARD MODERNO ---
const ModernDashboard = () => {
    const { executives, evaluations, loading } = useGlobalContext();

    if (loading) {
        return <div className="p-6">Cargando datos del dashboard...</div>;
    }

    const totalExecutives = executives.length;
    const completedEvaluations = evaluations.length;
    const activeAlerts = 3; // Placeholder

    const topPerformers = [...executives]
        .sort((a, b) => (b.lastEvaluationScore || 0) - (a.lastEvaluationScore || 0))
        .slice(0, 3)
        .map((exec, i) => ({
            name: exec.Nombre,
            role: exec.Cargo || 'Sin Cargo',
            score: exec.lastEvaluationScore || 'N/A',
            avatarColor: ["bg-emerald-500", "bg-indigo-500", "bg-purple-500"][i]
        }));

    // --- DATOS PARA LOS GRÁFICOS ---
    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    const teamChartData = {
        labels: executives.map(e => e.Nombre),
        datasets: [{
            label: 'Puntaje Última Evaluación',
            data: executives.map(e => e.lastEvaluationScore || 0),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 2,
            borderRadius: 8
        }]
    };

    const tasks = [
        { title: "Completar evaluación de Carlos López", status: "Vence en 2 días", completed: false },
        { title: "Revisar reporte mensual", status: "Completado", completed: true },
        { title: "Agendar reunión de feedback", status: "Vence hoy", completed: false }
    ];

    return (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 min-h-full">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* --- ICONOS CORREGIDOS --- */}
                <StatCard icon={<Users className="text-white" />} value={totalExecutives} label="Miembros Activos" color="bg-blue-500" />
                <StatCard icon={<ClipboardCheck className="text-white" />} value={`${completedEvaluations}/${totalExecutives}`} label="Evaluaciones Completadas" color="bg-emerald-500" />
                <StatCard icon={<AlertTriangle className="text-white" />} value={activeAlerts} label="Alertas Activas" color="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tendencia del Equipo</h2>
                        <div className="h-80">
                             <Bar data={teamChartData} options={chartOptions} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tareas Pendientes</h2>
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                            {tasks.map((task, index) => <TaskItem key={index} {...task} />)}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top Performers</h2>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                        {topPerformers.length > 0 ? (
                            topPerformers.map((member, index) => <TeamMemberRow key={index} {...member} />)
                        ) : (
                            <p className="text-center text-zinc-500 py-8">No hay datos de evaluación para mostrar.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernDashboard;
