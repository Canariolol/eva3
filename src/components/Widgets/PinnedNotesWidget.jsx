import React, { useState, useEffect } from 'react';
import { useGlobalContext } from '../../context/GlobalContext';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PinnedNotesWidget = ({ widget, tabId, userRole, isEditing, onEditingComplete }) => {
    const [notes, setNotes] = useState(widget.notes || '');

    // Si el padre nos dice que ya no estamos editando, salimos del modo de edición
    useEffect(() => {
        if (!isEditing) {
            setNotes(widget.notes || '');
        }
    }, [isEditing, widget.notes]);

    const handleSave = async () => {
        await updateDoc(doc(db, 'customTabs', tabId, 'widgets', widget.id), { notes });
        onEditingComplete(); // Notificar al padre que hemos terminado
    };

    return (
        <div>
            {isEditing && userRole === 'admin' ? (
                <>
                    <textarea
                        className="form-control"
                        rows="5"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ height: '100%', resize: 'none' }}
                    />
                    <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={handleSave} className="btn btn-primary">Guardar</button>
                        <button onClick={onEditingComplete} className="btn btn-secondary">Cancelar</button>
                    </div>
                </>
            ) : (
                <div style={{ height: '100%' }}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>
                        {widget.notes || 'Haz clic en el lápiz para editar...'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PinnedNotesWidget;
