import React from 'react';

const CustomTooltip = ({ active, payload, scaleType }) => {
    if (active && payload && payload.length) {
        const barColor = payload[0].fill;
        const data = payload[0].payload;
        const resolvedScaleType = data.scaleType || '1-10';
        
        let displayValue = '';
        if (scaleType === 'binary') {
           displayValue = `${payload[0].value.toFixed(1)}%`;
       } else {
           // Numeric is a score 0-10, so we multiply by 10
           displayValue = `${(payload[0].value * 1).toFixed(0)}`;
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
