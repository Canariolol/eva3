import React from 'react';
import './ScoreSelector.css';

const ScoreSelector = ({ value, onChange }) => {
    const scores = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
        <div className="score-selector">
            {scores.map(score => (
                <div
                    key={score}
                    className={`score-circle ${value === score ? 'selected' : ''}`}
                    onClick={() => onChange(score)}
                >
                    {score}
                </div>
            ))}
        </div>
    );
};

export default ScoreSelector;
