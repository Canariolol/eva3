import React, { useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext'; // Importamos useAuth
import { db } from '../firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';

// Importamos los componentes de las tarjetas (sin cambios)
import EditModal from '../components/EditModal';
import ManageExecutives from '../components/Configuration/ManageExecutives';
import ManageSections from '../components/Configuration/ManageSections';
import ManageSubsections from '../components/Configuration/ManageSubsections';
import ManageEvaluableCriteria from '../components/Configuration/ManageEvaluableCriteria';
import ManageNonEvaluableCriteria from '../components/Configuration/ManageNonEvaluableCriteria';
import ManageExecutiveFields from '../components/Configuration/ManageExecutiveFields';
import CollapsibleCard from '../components/CollapsibleCard';

const Configuration = () => {
    // Obtenemos los datos y funciones de los contextos
    const { 
        executives, criteria, nonEvaluableCriteria, aptitudeSubsections, 
        executiveFields, evaluationSections, headerInfo, refreshData, setHeaderInfo,
        uiPreset, toggleUiPreset, darkMode, toggleDarkMode
    } = useGlobalContext();
    
    // Obtenemos el companyId, que es crucial para la nueva estructura
    const { currentUser, companyId } = useAuth();
    
    // Estados locales (sin cambios)
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });

    const showTemporaryError = (message) => {
        setError(message);
        setTimeout(() => setError(''), 5000);
    };

    // --- FUNCIONES DE ESCRITURA REFACTORIZADAS ---

    // Función genérica para obtener la referencia a una subcolección de la compañía
    const getCompanyCollectionRef = (collectionName) => {
        if (!companyId) throw new Error("ID de la compañía no disponible.");
        return collection(db, 'companies', companyId, collectionName);
    };

    // Función genérica para obtener la referencia a un documento de la compañía
    const getCompanyDocRef = (collectionName, docId) => {
        if (!companyId) throw new Error("ID de la compañía no disponible.");
        if (!docId) throw new Error("ID del documento no disponible.");
        return doc(db, 'companies', companyId, collectionName, docId);
    };

    const handleSave = async (collectionName, data) => {
        try {
            const collectionRef = getCompanyCollectionRef(collectionName);
            await addDoc(collectionRef, data);
            await refreshData();
        } catch (err) {
            showTemporaryError(`Error al guardar: ${err.message}`);
        }
    };

    const handleSaveEdit = async (editedItem) => {
        const { id, ...dataToSave } = editedItem;
        try {
            const docRef = getCompanyDocRef(editConfig.collection, id);
            await updateDoc(docRef, dataToSave);
            await refreshData();
        } catch (err) {
            showTemporaryError(`Error al actualizar: ${err.message}`);
        } finally {
            setIsEditModalOpen(false);
        }
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
        try {
            const docRef = getCompanyDocRef(collectionName, id);
            await deleteDoc(docRef);
            await refreshData();
        } catch (err) {
            showTemporaryError(`Error al eliminar: ${err.message}`);
        }
    };

    const handleSaveHeaderInfo = async (e) => {
        e.preventDefault();
        try {
            // Asumimos que headerInfo es una colección con un único documento 'main'
            const docRef = getCompanyDocRef('headerInfo', 'main');
            await setDoc(docRef, headerInfo);
            await refreshData();
        } catch (err) {
            showTemporaryError('Error al guardar la información del encabezado.');
        }
    };

    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };
    
    return (
        <div>
            <h1>Configuración</h1>
            {isEditModalOpen && <EditModal item={itemToEdit} onSave={handleSaveEdit} onCancel={() => setIsEditModalOpen(false)} fields={editConfig.fields} />}
            {error && <p className="error-message">{error}</p>}
            
            <div className="config-grid">
                {/* Tarjeta de Apariencia */}
                <div className="card">
                    <h4 className="card-title card-title-primary">Apariencia y Tema</h4>
                    <CollapsibleCard>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Preset de Interfaz</span>
                                <button onClick={toggleUiPreset} className="btn btn-secondary">{uiPreset === 'classic' ? 'Moderna' : 'Clásica'}</button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Modo Oscuro</span>
                                <button onClick={toggleDarkMode} className="btn btn-secondary">{darkMode ? 'Desactivar' : 'Activar'}</button>
                            </div>
                        </div>
                    </CollapsibleCard>
                </div>

                {/* Tarjeta de Información de la Organización */}
                <div className="card">
                    <h4 className="card-title card-title-primary">Información de la Organización</h4>
                    <CollapsibleCard>
                        <form onSubmit={handleSaveHeaderInfo}>
                            <div className="form-group"><label>Nombre de la Empresa</label><input type="text" className="form-control" value={headerInfo.company || ''} onChange={(e) => setHeaderInfo({...headerInfo, company: e.target.value})}/></div>
                            <div className="form-group"><label>Área de Evaluaciones</label><input type="text" className="form-control" value={headerInfo.area || ''} onChange={(e) => setHeaderInfo({...headerInfo, area: e.target.value})}/></div>
                            <div className="form-group"><label>Nombre del Encargado</label><input type="text" className="form-control" value={headerInfo.manager || ''} onChange={(e) => setHeaderInfo({...headerInfo, manager: e.target.value})}/></div>
                            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar</button>
                        </form>
                    </CollapsibleCard>
                </div>

                {/* Componentes de Gestión (ahora pasan las funciones refactorizadas) */}
                <ManageExecutives 
                    executives={executives}
                    executiveFields={executiveFields}
                    handleSaveExecutive={(newExec) => handleSave('executives', newExec)}
                    handleEditClick={(item, fields) => handleEditClick(item, 'executives', fields)}
                    handleDelete={(id) => handleDelete('executives', id)}
                />
                <ManageSections 
                    evaluationSections={evaluationSections}
                    onSave={(newSection) => handleSave('evaluationSections', newSection)}
                    onEdit={(item, fields) => handleEditClick(item, 'evaluationSections', fields)}
                    onDelete={(id) => handleDelete('evaluationSections', id)}
                />
                <ManageSubsections
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    handleSaveSubsection={(newSub) => handleSave('aptitudeSubsections', newSub)}
                    handleEditClick={(item, fields) => handleEditClick(item, 'aptitudeSubsections', fields)}
                    handleDelete={(id) => handleDelete('aptitudeSubsections', id)}
                />
                <ManageEvaluableCriteria
                    criteria={criteria}
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    handleSaveCriterion={(newCrit) => handleSave('criteria', newCrit)}
                    handleEditClick={(item, fields) => handleEditClick(item, 'criteria', fields)}
                    handleDelete={(id) => handleDelete('criteria', id)}
                />
                <ManageNonEvaluableCriteria
                    nonEvaluableCriteria={nonEvaluableCriteria}
                    evaluationSections={evaluationSections}
                    handleSaveNonEvaluableCriterion={(newNonCrit) => handleSave('nonEvaluableCriteria', newNonCrit)}
                    handleEditClick={(item, fields) => handleEditClick(item, 'nonEvaluableCriteria', fields)}
                    handleDelete={(id) => handleDelete('nonEvaluableCriteria', id)}
                />
                <ManageExecutiveFields
                    executiveFields={executiveFields}
                    handleSaveField={(newField) => handleSave('executiveFields', newField)}
                    handleEditClick={(item, fields) => handleEditClick(item, 'executiveFields', fields)}
                    handleDelete={(id) => handleDelete('executiveFields', id)}
                />
            </div>
        </div>
    );
};

export default Configuration;
