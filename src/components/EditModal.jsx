import React, { useState, useEffect } from 'react';
import ColorPicker from './Configuration/ColorPicker';
import RichTextEditor from './RichTextEditor';
import './EditModal.css';

const EditModal = ({ item, onSave, onCancel, fields }) => {
    const [editedItem, setEditedItem] = useState(item);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Lógica de la alerta para el cambio de scaleType
        if (name === 'scaleType') {
            const originalScaleType = item.scaleType;
            if (originalScaleType && value !== originalScaleType) {
                const userConfirmed = window.confirm(
                    "No es recomendable cambiar la escala de una sección que ya contiene datos. " +
                    "Si necesitas implementar una evaluación con una escala nueva, se aconseja añadir y configurar una nueva sección. " +
                    "¿Estás seguro de que deseas continuar?"
                );
                if (!userConfirmed) {
                    // Si el usuario cancela, no hacemos nada y el valor no cambia
                    return; 
                }
            }
        }

        setEditedItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRichTextChange = (value, name) => {
        setEditedItem(prev => ({ ...prev, [name]: value }));
    };

    const handleColorChange = (color) => {
        setEditedItem(prev => ({ ...prev, color }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(editedItem);
    };

    const renderField = (field) => {
        switch (field.type) {
            case 'textarea':
                return <textarea name={field.name} value={editedItem[field.name] || ''} onChange={handleChange} className="form-control" rows="3" />;
            case 'richtext':
                return <RichTextEditor value={editedItem[field.name] || ''} onChange={(value) => handleRichTextChange(value, field.name)} />;
            case 'select':
                return (
                    <select name={field.name} value={editedItem[field.name] || ''} onChange={handleChange} className="form-control">
                        {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                );
            case 'checkbox':
                return (
                    <label style={{display: 'flex', alignItems: 'center'}}>
                        <input type="checkbox" name={field.name} checked={!!editedItem[field.name]} onChange={handleChange} />
                        <span style={{marginLeft: '10px'}}>{field.checkboxLabel || field.label}</span>
                    </label>
                );
            case 'color_picker':
                return <ColorPicker color={editedItem.color} onChange={handleColorChange} />;
            default:
                return <input type={field.type || 'text'} name={field.name} value={editedItem[field.name] || ''} onChange={handleChange} className="form-control" />;
        }
    };
    

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onCancel} className="modal-close-btn">&times;</button>
                <h2>Editar Elemento</h2>
                <form onSubmit={handleSubmit}>
                    {fields.map(field => (
                        <div className="form-group" key={field.name}>
                            <label>{field.type !== 'checkbox' && field.label}</label>
                            {renderField(field)}
                        </div>
                    ))}
                    <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                        <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;
