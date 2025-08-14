import React from 'react';

const CustomTooltip = ({ active, payload, scaleType }) => {
    if (active && payload && payload.length) {
        const barColor = payload[0].fill;
        const value = payload[0].value;
        let displayValue;

        if (scaleType === 'binary') {
            displayValue = value === 1 ? 'Cumple' : 'No Cumple';
        } else {
            displayValue = value.toFixed(2);
        }

        return (
            <div className="recharts-custom-tooltip" style={{ border: `1px solid ${barColor}` }}>
                <p className="recharts-tooltip-label" style={{ color: barColor, borderBottom: `1px solid ${barColor}50` }}>
                    {payload[0].payload.name}
                </p>
                <p className="recharts-tooltip-intro" style={{ color: barColor }}>
                    <span>{`${payload[0].name}: `}</span>
                    <span style={{ fontWeight: 'bold' }}>{displayValue}</span>
                </p>
            </div>
        );
    }
    return null;
};

export default CustomTooltip;
