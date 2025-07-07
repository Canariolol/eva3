import React from 'react';
import './ColorPicker.css';

const PRESET_COLORS = [
    '#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#dc3545', 
    '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8'
];

const ColorPicker = ({ selectedColor, onChange }) => {
    return (
        <div className="color-picker-grid">
            {PRESET_COLORS.map(color => (
                <div
                    key={color}
                    className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                />
            ))}
        </div>
    );
};

export default ColorPicker;
