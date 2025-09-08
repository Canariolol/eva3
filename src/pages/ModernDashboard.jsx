import React from 'react';
import { Users, ClipboardCheck, AlertTriangle } from 'lucide-react';
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

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, Filler
);

// --- SUBCOMPONENTES VISUALES ---
// Ahora el color de fondo se controla explícitamente con la prop `darkMode`
const StatCard = ({ icon, value, label, change, color, darkMode }) => (
    <div className={`${darkMode ? 'bg-zinc-800' : 'bg-white'} p-6 rounded-2xl shadow-sm flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value}</p>
            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{label}</p>
        </div>
        {change && <p className={`text-sm font-medium ml-auto ${change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{change}</p>}
    </div>
);

const TeamMemberRow = ({ name, role, score, avatarColor, darkMode }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${avatarColor}`}>{name.charAt(0)}</div>
            <div>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</p>
                <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{role}</p>
            </div>
        </div>
        <div className="text-right">
            <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{score}%</p>
            <p className="text-xs text-emerald-500">Excelente</p>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const ModernDashboard = () => {
    const { executives, evaluations, loading, darkMode } = useGlobalContext(); // Obtenemos darkMode

    if (loading) {
        return <div className="p-6">Cargando datos del dashboard...</div>;
    }

    const totalExecutives = executives.length;
    const completedEvaluations = evaluations.length;
    const activeAlerts = 3; 

    const topPerformers = [...executives]
        .sort((a, b) => (b.lastEvaluationScore || 0) - (a.lastEvaluationScore || 0))
        .slice(0, 3)
        .map((exec, i) => ({
            name: exec.Nombre,
            role: exec.Cargo || 'Sin Cargo',
            score: exec.lastEvaluationScore || 'N/A',
            avatarColor: ["bg-emerald-500", "bg-indigo-500", "bg-purple-500"][i]
        }));

    // Opciones de los gráficos adaptadas al modo oscuro
    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { 
                beginAtZero: true, 
                max: 100, 
                grid: { color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
            },
            x: { 
                grid: { display: false },
                ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
            }
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

    return (
        <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard icon={<Users className="text-white" />} value={totalExecutives} label="Miembros Activos" color="bg-blue-500" darkMode={darkMode} />
                <StatCard icon={<ClipboardCheck className="text-white" />} value={`${completedEvaluations}/${totalExecutives}`} label="Evaluaciones Completadas" color="bg-emerald-500" darkMode={darkMode} />
                <StatCard icon={<AlertTriangle className="text-white" />} value={activeAlerts} label="Alertas Activas" color="bg-yellow-500" darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-white'} p-6 rounded-2xl shadow-sm lg:col-span-2`}>
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Comparativa del Equipo</h2>
                    <div className="h-80">
                         <Bar data={teamChartData} options={chartOptions} />
                    </div>
                </div>

                <div className={`${darkMode ? 'bg-zinc-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Top Performers</h2>
                    <div className="divide-y divide-zinc-700 dark:divide-zinc-700">
                        {topPerformers.length > 0 ? (
                            topPerformers.map((member, index) => <TeamMemberRow key={index} {...member} darkMode={darkMode} />)
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
