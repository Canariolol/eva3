import React from 'react';

const WidgetShell = ({ title, children, onDelete, onEdit, userRole, isEditable }) => {
    
    const handleEditClick = (e) => {
        e.stopPropagation(); 
        if (onEdit) onEdit();
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) onDelete();
    };

    return (
        <div className="widget-shell">
            <div className="widget-header">
                <h5>{title}</h5>
                {userRole === 'admin' && (
                    <div className="widget-controls">
                        {isEditable && <button className="btn-icon" onMouseDown={handleEditClick}>✏️</button>}
                        <button className="btn-icon btn-icon-danger" onMouseDown={handleDeleteClick}>🗑️</button>
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
