import React from 'react';

const AdditionalMetricsCard = ({ title, evaluations, nonEvaluable, overallAverage, color }) => {
    
    const pluralize = (count, singular, plural) => (count === 1 ? singular : plural || `${singular}s`);

    return (
        <div className="card" style={{flex: 1, minWidth: '400px'}}>
            <h4 className="card-title" style={{ backgroundColor: color + '20', color: color }}>{title}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', height: 'calc(100% - 40px)' }}>
                <div style={{ flex: 1, paddingRight: '1rem', overflowY: 'auto' }}>
                    <p><strong>{pluralize(evaluations.length, 'Evaluación Realizada', 'Evaluaciones Realizadas')}:</strong> {evaluations.length}</p>
                    {nonEvaluable.map(metric => (
                        <div key={metric.name}>
                        {metric.type === 'select' ? (
                            <>
                            <p style={{marginTop: '1rem'}}><strong>{metric.name}:</strong></p>
                            <ul style={{listStylePosition: 'inside', paddingLeft: '1rem', margin: 0}}>
                                {Object.entries(metric.counts).map(([option, count]) => (
                                <li key={option}>{option}: {count}</li>
                                ))}
                            </ul>
                            </>
                        ) : (
                            <p><strong>{pluralize(metric.count, metric.name, metric.name)}:</strong> {metric.count}</p>
                        )}
                        </div>
                    ))}
                </div>
                
                {overallAverage > 0 && (
                <>
                    <div style={{ borderLeft: '1px solid #ccc', margin: '0 1rem' }}></div>
                    <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingLeft: '1rem' }}>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#6c757d', textAlign: 'center' }}>Promedio General</p>
                        <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 'bold', lineHeight: 1.2, color: color }}>
                            {overallAverage.toFixed(2)}
                        </p>
                    </div>
                </>
                )}
            </div>
        </div>
    );
};

export default AdditionalMetricsCard;
