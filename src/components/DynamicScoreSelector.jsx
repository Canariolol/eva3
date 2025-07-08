import React from 'react';
import ScoreSelector from './ScoreSelector'; // El selector numérico que ya teníamos

const DynamicScoreSelector = ({ scaleType, value, onChange }) => {
    switch (scaleType) {
        case '1-5':
            return <ScoreSelector min={1} max={5} value={value} onChange={onChange} />;
        
        case 'binary':
            return (
                <select className="form-control" value={value} onChange={e => onChange(Number(e.target.value))}>
                    <option value={10}>Cumple</option>
                    <option value={0}>No Cumple</option>
                </select>
            );

        case 'percentage':
            return (
                <select className="form-control" value={value} onChange={e => onChange(Number(e.target.value))}>
                    <option value={0}>0%</option>
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                </select>
            );

        case '1-10':
        default:
            return <ScoreSelector min={1} max={10} value={value} onChange={onChange} />;
    }
};

export default DynamicScoreSelector;
