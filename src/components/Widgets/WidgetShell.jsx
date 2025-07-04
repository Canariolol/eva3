import React from 'react';

const WidgetShell = ({ title, children, onDelete, onEdit, userRole, isEditable }) => {
    
    const handleEditClick = (e) => {
        e.stopPropagation(); // Detener la propagación para no activar el arrastre
        if (onEdit) onEdit();
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation(); // Detener la propagación para no activar el arrastre
        if (onDelete) onDelete();
    };

    return (
        <div className="widget-shell">
            <div className="widget-header">
                <h5>{title}</h5>
                {userRole === 'admin' && (
                    <div className="widget-controls">
                        {isEditable && <button className="btn-icon" onClick={handleEditClick}>✏️</button>}
                        <button className="btn-icon btn-icon-danger" onClick={handleDeleteClick}>🗑️</button>
                    </div>
                )}
            </div>
            <div className="widget-content">
                {children}
            </div>
        </div>
    );
};

export default WidgetShell;
