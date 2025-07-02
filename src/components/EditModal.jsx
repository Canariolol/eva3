import React, { useState, useEffect } from 'react';

const EditModal = ({ item, onSave, onCancel, fields }) => {
    const [editedItem, setEditedItem] = useState(item);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditedItem(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSave(editedItem);
    };

    return (
        <div className="modal-backdrop">
            <form className="modal-content" onSubmit={handleSave}>
                <h2>Editar Elemento</h2>
                {fields.map(field => (
                    <div className="form-group" key={field.name}>
                        <label>{field.label}</label>
                        {field.type === 'select' ? (
                            <select
                                className="form-control"
                                name={field.name}
                                value={editedItem[field.name] || ''}
                                onChange={handleChange}
                            >
                                {field.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : field.type === 'checkbox' ? (
                            <div style={{marginTop: '0.5rem'}}>
                                <input
                                    type="checkbox"
                                    name={field.name}
                                    checked={editedItem[field.name] || false}
                                    onChange={handleChange}
                                />
                                <span style={{marginLeft: '0.5rem'}}>{field.checkboxLabel}</span>
                            </div>
                        ) : field.type === 'textarea' ? (
                            <textarea
                                className="form-control"
                                name={field.name}
                                value={editedItem[field.name] || ''}
                                onChange={handleChange}
                                rows="3"
                            />
                        ) : (
                            <input
                                type={field.type || 'text'}
                                className="form-control"
                                name={field.name}
                                value={editedItem[field.name] || ''}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                </div>
            </form>
        </div>
    );
};

export default EditModal;
