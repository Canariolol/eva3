import React from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
    const { darkMode, toggleDarkMode } = useGlobalContext();

    return (
        <div className="dark-mode-toggle">
            <label htmlFor="dark-mode-switch">
                <input
                    id="dark-mode-switch"
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    aria-label="Toggle dark mode"
                />
                <span className="slider"></span>
            </label>
        </div>
    );
};

export default DarkModeToggle;
