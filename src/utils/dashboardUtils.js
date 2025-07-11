// src/utils/dashboardUtils.js

/**
 * Normaliza un puntaje a una escala de 0 a 100 según el tipo de escala.
 * @param {number} score El puntaje original.
 * @param {string} scaleType El tipo de escala ('1-10', '1-5', 'binary', 'percentage').
 * @returns {number} El puntaje normalizado a 100.
 */
export const normalizeScore = (score, scaleType) => {
    if (score === undefined || score === null) return 0;

    switch (scaleType) {
        case '1-10':
            return ((score - 1) / 9) * 100;
        case '1-5':
            return ((score - 1) / 4) * 100;
        case 'binary':
            return score === 10 ? 100 : 0;
        case 'percentage':
            return score;
        default:
            return ((score - 1) / 9) * 100;
    }
};

const truncateName = (name) => {
    if (typeof name !== 'string') return '';
    const words = name.split(' ');
    if (words.length > 1) return `${words[0]}...`;
    return name;
};

export const processDataForLineChart = (evaluations, dateField) => {
    const dataByDate = evaluations.reduce((acc, curr) => {
        const dateValue = curr[dateField];
        if (!dateValue || typeof dateValue.toISOString !== 'function') return acc;

        const dateKey = dateValue.toISOString().slice(0, 10);
        
        if (!acc[dateKey]) {
            const day = String(dateValue.getDate()).padStart(2, '0');
            const month = String(dateValue.getMonth() + 1).padStart(2, '0'); // Se suma 1 porque getMonth() es base 0
            
            acc[dateKey] = { 
                date: `${day}/${month}`, 
                originalDate: dateValue 
            };
        }
        
        if (!acc[dateKey][curr.executive]) {
            acc[dateKey][curr.executive] = [];
        }

        const scores = Object.values(curr.scores);
        if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            acc[dateKey][curr.executive].push(avgScore);
        }
        return acc;
    }, {});

    const dataArray = Object.values(dataByDate);

    dataArray.sort((a, b) => a.originalDate - b.originalDate);

    return dataArray.map(dateEntry => {
        const newDateEntry = { date: dateEntry.date };
        Object.keys(dateEntry).forEach(key => {
            if (key !== 'date' && key !== 'originalDate') {
                const executiveScores = dateEntry[key];
                const avgScore = executiveScores.reduce((a, b) => a + b, 0) / executiveScores.length;
                newDateEntry[key] = parseFloat(avgScore.toFixed(2));
            }
        });
        return newDateEntry;
    });
};

export const processDataForBarChart = (sectionEvaluations, sectionName, criteriaConfig, chartState) => {
    if (!sectionEvaluations || sectionEvaluations.length === 0) return [];

    const criterionToSubsectionMap = criteriaConfig.reduce((acc, c) => {
        if (c.section === sectionName) {
             acc[c.name] = c.subsection || null;
        }
        return acc;
    }, {});
    
    const hasSubsections = Object.values(criterionToSubsectionMap).some(s => s !== null);

    if (hasSubsections) {
        const { view, selectedItem } = chartState;
        switch (view) {
            case 'byCriterionOfSubsection': {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        if (criterionToSubsectionMap[criterionName] === selectedItem) {
                            if (!data[criterionName]) data[criterionName] = [];
                            data[criterionName].push(score);
                        }
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
            }
            case 'allCriteria': {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        if (!data[criterionName]) data[criterionName] = [];
                        data[criterionName].push(score);
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
            }
            case 'bySubsection':
            default: {
                const data = {};
                sectionEvaluations.forEach(ev => {
                    Object.entries(ev.scores).forEach(([criterionName, score]) => {
                        const subsection = criterionToSubsectionMap[criterionName] || 'Criterios Generales';
                        if (!data[subsection]) data[subsection] = [];
                        data[subsection].push(score);
                    });
                });
                return Object.entries(data).map(([name, scores]) => ({ name, shortName: truncateName(name), 'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length }));
            }
        }
    }
    
    const dataByCriterion = sectionEvaluations.reduce((acc, curr) => {
        Object.entries(curr.scores).forEach(([criterion, score]) => {
            if (!acc[criterion]) acc[criterion] = [];
            acc[criterion].push(score);
        });
        return acc;
    }, {});
    return Object.entries(dataByCriterion).map(([name, scores]) => ({
        name: name,
        shortName: truncateName(name),
        'Puntaje Promedio': scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
};

export const processNonEvaluableData = (sectionEvaluations, nonEvaluableCriteria, sectionName, executives) => {
    const trackedCriteria = nonEvaluableCriteria.filter(c => c.section === sectionName && (c.trackInDashboard || c.trackEmptyInDashboard));
    let metrics = [];

    trackedCriteria.forEach(criterion => {
        if (criterion.trackInDashboard) {
            if (criterion.inputType === 'select') {
                const counts = (criterion.options || []).reduce((acc, option) => ({ ...acc, [option]: 0 }), {});
                sectionEvaluations.forEach(ev => {
                    const value = ev.nonEvaluableData?.[criterion.name];
                    if (value && counts.hasOwnProperty(value)) counts[value]++;
                });
                metrics.push({ name: criterion.name, type: 'select', counts });
            } else {
                const count = sectionEvaluations.reduce((acc, ev) => (ev.nonEvaluableData?.[criterion.name] ? acc + 1 : acc), 0);
                metrics.push({ name: `${criterion.name}`, type: 'text', count });
            }
        }

        if (criterion.trackEmptyInDashboard) {
            const emptyEvals = [];
            let respondedCount = 0;
            sectionEvaluations.forEach(ev => {
                const value = ev.nonEvaluableData?.[criterion.name];
                if (!value || value.trim() === '' || value.toLowerCase() === 'n/a') {
                    const executive = executives.find(exec => exec.Nombre === ev.executive);
                    emptyEvals.push({ 
                        id: ev.id, 
                        executive: ev.executive, 
                        date: ev.evaluationDate,
                        managementDate: ev.managementDate,
                        executiveId: executive ? executive.id : null
                    });
                } else {
                    respondedCount++;
                }
            });

            const metricName = `${criterion.name}`;
            const summary = {
                'Ingresados': respondedCount,
                'Sin Ingreso (N/A)': emptyEvals.length
            };
            
            metrics.push({ 
                name: metricName, 
                type: 'summary', 
                summary: summary,
                emptyEvaluations: emptyEvals
            });
        }
    });

    return metrics;
};

export const processExecutiveAverages = (sectionEvaluations) => {
    const executiveData = {};
    sectionEvaluations.forEach(ev => {
        if (!executiveData[ev.executive]) executiveData[ev.executive] = { scores: [] };
        const scores = Object.values(ev.scores);
        if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            executiveData[ev.executive].scores.push(avgScore);
        }
    });
    return Object.entries(executiveData).map(([name, data]) => ({
        name,
        average: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0
    })).sort((a, b) => b.average - a.average);
};
