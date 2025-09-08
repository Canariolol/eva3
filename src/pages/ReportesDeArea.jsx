import React, { useState, useMemo } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { Download, Filter, Save } from 'lucide-react';
import Papa from 'papaparse';

const ReportesDeArea = () => {
    const { evaluations, executives, criteria, nonEvaluableCriteria, loading } = useGlobalContext();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        executiveId: 'all',
    });

    // Memoizamos los datos filtrados para evitar recálculos innecesarios
    const filteredEvaluations = useMemo(() => {
        return evaluations.filter(ev => {
            const evalDate = ev.evaluationDate; // Ya es un objeto Date
            if (!evalDate) return false;

            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate && evalDate < startDate) return false;
            if (endDate && evalDate > endDate) return false;
            if (filters.executiveId !== 'all' && ev.executiveId !== filters.executiveId) return false;

            return true;
        });
    }, [evaluations, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = () => {
        if (filteredEvaluations.length === 0) {
            alert("No hay datos para exportar con los filtros seleccionados.");
            return;
        }

        // Estructuramos los datos para el CSV
        const dataForCsv = filteredEvaluations.map(ev => {
            const executive = executives.find(e => e.id === ev.executiveId);
            const baseData = {
                "ID Evaluacion": ev.id,
                "Fecha Evaluacion": ev.evaluationDate.toLocaleDateString('es-CL'),
                "ID Ejecutivo": ev.executiveId,
                "Nombre Ejecutivo": executive ? executive.Nombre : 'N/A',
                "Puntaje Total": ev.totalScore,
                "Comentarios Generales": ev.generalComments,
            };

            // Añadimos los puntajes de los criterios evaluables
            criteria.forEach(c => {
                baseData[`${c.name} (Puntaje)`] = ev.scores?.[c.id]?.score || 'N/A';
                baseData[`${c.name} (Comentario)`] = ev.scores?.[c.id]?.comment || '';
            });

            // Añadimos los valores de los criterios no evaluables
            nonEvaluableCriteria.forEach(c => {
                baseData[c.name] = ev.nonEvaluable?.[c.id] || 'N/A';
            });
            
            return baseData;
        });

        const csv = Papa.unparse(dataForCsv);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_evaluaciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <p>Cargando datos...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Central de Reportes</h1>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" disabled>
                        <Save size={16} className="mr-2" /> Guardar Reporte (Próximamente)
                    </button>
                    <button onClick={handleExport} className="btn btn-primary">
                        <Download size={16} className="mr-2" /> Exportar a CSV
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">Fecha Inicio</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-control" />
                    </div>
                    <div>
                        <label className="label">Fecha Fin</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-control" />
                    </div>
                    <div>
                        <label className="label">Ejecutivo</label>
                        <select name="executiveId" value={filters.executiveId} onChange={handleFilterChange} className="form-control">
                            <option value="all">Todos</option>
                            {executives.map(exec => (
                                <option key={exec.id} value={exec.id}>{exec.Nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">{filteredEvaluations.length} Evaluaciones Encontradas</h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Ejecutivo</th>
                                    <th>Puntaje Total</th>
                                    <th>Evaluado Por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEvaluations.map(ev => {
                                    const executive = executives.find(e => e.id === ev.executiveId);
                                    return (
                                        <tr key={ev.id}>
                                            <td>{ev.evaluationDate.toLocaleDateString('es-CL')}</td>
                                            <td>{executive ? executive.Nombre : 'N/A'}</td>
                                            <td>{ev.totalScore || 'N/A'}%</td>
                                            <td>{ev.evaluatedBy || 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportesDeArea;
