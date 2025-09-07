import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';

// Importa todos los componentes de las tarjetas
import EditModal from '../components/EditModal';
import ManageExecutives from '../components/Configuration/ManageExecutives';
import ManageSections from '../components/Configuration/ManageSections';
import ManageSubsections from '../components/Configuration/ManageSubsections';
import ManageEvaluableCriteria from '../components/Configuration/ManageEvaluableCriteria';
import ManageNonEvaluableCriteria from '../components/Configuration/ManageNonEvaluableCriteria';
import ManageExecutiveFields from '../components/Configuration/ManageExecutiveFields';
import ManageCustomTabs from '../components/Configuration/ManageCustomTabs';
import CollapsibleCard from '../components/CollapsibleCard';

const Configuration = () => {
    const { 
        executives, criteria, nonEvaluableCriteria, aptitudeSubsections, 
        executiveFields, evaluationSections, customTabs, headerInfo, 
        headerInfoId, refreshData, setHeaderInfo,
        // --- NUEVOS ESTADOS GLOBALES ---
        uiPreset,
        toggleUiPreset,
        darkMode,
        toggleDarkMode,
    } = useGlobalContext();
    const { currentUser } = useAuth();
    
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });
    
    // El resto de las funciones (showTemporaryError, handleEditClick, handleSave, etc.)
    // permanecen sin cambios, por lo que se omiten por brevedad en este comentario.
    // El código completo del archivo las incluirá.

    const showTemporaryError = (message) => {
        setError(message);
        setTimeout(() => setError(''), 5000);
    };

    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedItem) => {
        if (!editedItem.id) return;
        const { id, ...dataToSave } = editedItem;
        try {
            await updateDoc(doc(db, editConfig.collection, id), dataToSave);
            await refreshData();
        } catch (err) {
            showTemporaryError(`Error al actualizar: ${err.message}`);
        } finally {
            setIsEditModalOpen(false);
            setItemToEdit(null);
        }
    };
    
    const handleSave = async (collectionName, data) => {
        try {
            await addDoc(collection(db, collectionName), data);
            await refreshData();
        } catch (err) {
            showTemporaryError(`Error al guardar: ${err.message}`);
        }
    };
    
    const handleSaveHeaderInfo = async (e) => {
        e.preventDefault();
        try {
            const docRef = headerInfoId ? doc(db, 'headerInfo', headerInfoId) : doc(collection(db, 'headerInfo'));
            await setDoc(docRef, headerInfo);
            await refreshData();
        } catch (err) {
            showTemporaryError('Error al guardar la información del encabezado.');
        }
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm('¿Estás seguro?')) return;
        try {
            // Lógica de borrado (sin cambios)
            await deleteDoc(doc(db, collectionName, id));
            await refreshData();
        } catch (err) {
            showTemporaryError(err.message);
        }
    };
    
    return (
        <div>
            <h1>Configuración</h1>
            {isEditModalOpen && currentUser && (
                <EditModal 
                    item={itemToEdit}
                    onSave={handleSaveEdit}
                    onCancel={() => setIsEditModalOpen(false)}
                    fields={editConfig.fields}
                />
            )}
            {error && <p className="error-message">{error}</p>}
            <div className="config-grid">
                
                {/* --- NUEVA TARJETA DE APARIENCIA --- */}
                <div className="card">
                    <h4 className="card-title card-title-primary">Apariencia y Tema</h4>
                    <CollapsibleCard>
                        {currentUser && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Preset de Interfaz</span>
                                    <button onClick={toggleUiPreset} className="btn btn-secondary">
                                        {uiPreset === 'classic' ? 'Moderna' : 'Clásica'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Modo Oscuro</span>
                                    <button onClick={toggleDarkMode} className="btn btn-secondary">
                                        {darkMode ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </CollapsibleCard>
                </div>

                <div className="card">
                    <h4 className="card-title card-title-primary">Información de la Organización</h4>
                    <CollapsibleCard>
                    {currentUser && (
                    <form onSubmit={handleSaveHeaderInfo}>
                        <div className="form-group"><label>Nombre de la Empresa</label><input type="text" className="form-control" value={headerInfo.company || ''} onChange={(e) => setHeaderInfo({...headerInfo, company: e.target.value})}/></div>
                        <div className="form-group"><label>Área de Evaluaciones</label><input type="text" className="form-control" value={headerInfo.area || ''} onChange={(e) => setHeaderInfo({...headerInfo, area: e.target.value})}/></div>
                        <div className="form-group"><label>Nombre del Encargado</label><input type="text" className="form-control" value={headerInfo.manager || ''} onChange={(e) => setHeaderInfo({...headerInfo, manager: e.target.value})}/></div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Información</button>
                    </form>
                    )}
                    </CollapsibleCard>
                </div>
                
                <ManageExecutives 
                    executives={executives}
                    executiveFields={executiveFields}
                    currentUser={currentUser}
                    handleSaveExecutive={(newExec) => handleSave('executives', newExec)}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />

                 <ManageSections 
                    evaluationSections={evaluationSections}
                    currentUser={currentUser}
                    onSave={(newSection) => handleSave('evaluationSections', newSection)}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                 />

                <ManageSubsections
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    currentUser={currentUser}
                    handleSaveSubsection={(newSub) => handleSave('aptitudeSubsections', newSub)}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />
                
                <ManageEvaluableCriteria
                    criteria={criteria}
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    currentUser={currentUser}
                    handleSaveCriterion={(newCrit) => handleSave('criteria', newCrit)}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />

                <ManageNonEvaluableCriteria
                    nonEvaluableCriteria={nonEvaluableCriteria}
                    evaluationSections={evaluationSections}
                    currentUser={currentUser}
                    handleSaveNonEvaluableCriterion={(newNonCrit) => handleSave('nonEvaluableCriteria', newNonCrit)}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />

                <ManageExecutiveFields
                    executiveFields={executiveFields}
                    currentUser={currentUser}
                    handleSaveField={(newField) => handleSave('executiveFields', newField)}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />

            </div>
        </div>
    );
};

export default Configuration;
