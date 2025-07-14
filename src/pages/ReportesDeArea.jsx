import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './ReportesDeArea.css'; // Importamos los nuevos estilos

// Registrar los componentes necesarios para Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// --- Componentes de Tarjetas de KPI ---
const KpiCard = ({ icon, bgColor, textColor, title, value }) => (
    <div className="kpi-card">
        <div className={`kpi-icon-wrapper`} style={{ backgroundColor: bgColor }}>
            {icon}
        </div>
        <div>
            <p className="kpi-label">{title}</p>
            <p className="kpi-value" style={{ color: textColor }}>{value}</p>
        </div>
    </div>
);

const KpiCardDistribution = ({ title, data }) => (
    <div className="kpi-card" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
        <p className="kpi-label mb-2">{title}</p>
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index}>
                    <p className="text-lg font-bold" style={{color: '#4f46e5'}}>
                        {item.percentage}
                        <span className="text-sm font-normal" style={{color: '#4b5563'}}> ({item.hours})</span>
                    </p>
                    <p className="text-xs" style={{color: '#6b7280'}}>{item.label}</p>
                </div>
            ))}
        </div>
    </div>
);

const ReportesDeArea = () => {
    // Datos para el gráfico de torta
    const chartData = {
        labels: ['N1 : Resuelto por Nivel 1', 'N3 : Escalado a Desarrollo', 'N2 : Escalado a Terreno', 'Resto : Cancelado, otro.'],
        datasets: [{
            label: 'Distribución de Tickets',
            data: [407, 108, 66, 4],
            backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#9ca3af'],
            hoverOffset: 4
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.parsed} tickets`;
                    }
                }
            },
            datalabels: {
                color: '#ffffff',
                font: { weight: 'bold', size: 14 },
                formatter: (value, context) => {
                    const datapoints = context.chart.data.datasets[0].data;
                    const total = datapoints.reduce((total, datapoint) => total + datapoint, 0);
                    const percentage = (value / total) * 100;
                    return percentage.toFixed(0) + '%';
                },
            }
        }
    };

    const SvgIcon = ({ color, d }) => (
        <svg className="w-8 h-8" style={{color}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d}></path>
        </svg>
    );

    return (
        <div className="report-container">
            <header className="report-header">
                <h1>Resumen Área Clientes - Placeholder</h1>
                <p>Mes de Junio 2025<br></br><br></br>
                <small>Se agregará selector de mes para generar un reporte dinámico y exportable.<br></br>
                Se agregarán botones para subir archivos .csv/.xlsx y generar los reportes, guardando los datos entregados en la DB.</small></p>
            </header>

            <section className="kpi-grid">
                <KpiCard 
                    icon={<SvgIcon color="#16a34a" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} 
                    bgColor="#dcfce7" 
                    textColor="#16a34a" 
                    title="Disponibilidad (SLA)" 
                    value="100%" 
                />
                <KpiCard 
                    icon={<SvgIcon color="#2563eb" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    bgColor="#dbeafe"
                    textColor="#2563eb"
                    title="Incidentes Mayores"
                    value="0"
                />
                <KpiCardDistribution
                    title="Distribución de Horas"
                    data={[
                        { percentage: '80%', hours: '1349.86h', label: 'Proyectos' },
                        { percentage: '20%', hours: '347.4h', label: 'Soporte N3' }
                    ]}
                />
                <KpiCard
                    icon={<SvgIcon color="#d97706" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    bgColor="#fef3c7"
                    textColor="#d97706"
                    title="Resueltos Nivel 1"
                    value="70%"
                />
            </section>

            <section className="main-grid">
                <div className="summary-card">
                    <h2>Resumen Mesa de Servicio</h2>
                    <div className="space-y-4">
                        <div className="summary-item">
                            <p>Tickets abiertos en Junio</p>
                            <span style={{color: '#3b82f6'}}>585</span>
                        </div>
                        <div className="summary-item">
                            <p>Tickets pendientes (Total al 30 junio)</p>
                            <span style={{color: '#ef4444'}}>88</span>
                        </div>
                        <div className="summary-sub-item">
                            <div className="flex">
                                <p>Escalados a N3</p>
                                <span>46</span>
                            </div>
                            <div className="flex">
                                <p>Escalados a Terreno</p>
                                <span>42</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <h2>Distribución de Tickets por Nivel (Junio)</h2>
                    <div className="chart-container">
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ReportesDeArea;
