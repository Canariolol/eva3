import React, { useState, useCallback } from 'react';
import { SketchPicker } from 'react-color';
import './ColorPicker.css';

const ColorPicker = ({ color, onChange }) => {
    const [displayColorPicker, setDisplayColorPicker] = useState(false);

    const handleClick = () => {
        setDisplayColorPicker(!displayColorPicker);
    };

    const handleClose = () => {
        setDisplayColorPicker(false);
    };

    // Usamos useCallback para que la función no se recree en cada render
    const handleChange = useCallback((newColor) => {
        onChange(newColor.hex);
    }, [onChange]);

    return (
        <div>
            <div className="color-swatch-container" onClick={handleClick}>
                <div className="color-swatch-preview" style={{ backgroundColor: color }} />
            </div>
            {displayColorPicker ? (
                <div className="color-picker-popover">
                    <div className="color-picker-cover" onClick={handleClose} />
                    <SketchPicker color={color} onChange={handleChange} />
                </div>
            ) : null}
        </div>
    );
};

export default ColorPicker;
