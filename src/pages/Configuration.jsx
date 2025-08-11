import React, { useState, useEffect } from 'react';
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
        executives, 
        criteria, 
        nonEvaluableCriteria, 
        aptitudeSubsections, 
        executiveFields, 
        evaluationSections,
        customTabs,
        headerInfo,
        headerInfoId,
        refreshData, // La función clave de nuestro GlobalContext
        setHeaderInfo,
    } = useGlobalContext();
    const { currentUser } = useAuth();
    
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });
    
    // Función centralizada para mostrar errores temporalmente
    const showTemporaryError = (message) => {
        setError(message);
        setTimeout(() => setError(''), 5000);
    };

    // --- LÓGICA DE EDICIÓN (MODAL) ---
    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedItem) => {
        if (!editedItem.id) return;
        const { id, ...dataToSave } = editedItem;
        try {
            if (editConfig.collection === 'nonEvaluableCriteria' && typeof dataToSave.options === 'string') {
                dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
            }
            await updateDoc(doc(db, editConfig.collection, id), dataToSave);
            await refreshData(); // Actualiza el estado global
        } catch (err) {
            showTemporaryError(`Error al actualizar: ${err.message}`);
        } finally {
            setIsEditModalOpen(false);
            setItemToEdit(null);
        }
    };
    
    // --- LÓGICA DE GUARDADO (CREACIÓN) ---
    const handleSave = async (collectionName, data) => {
        try {
            await addDoc(collection(db, collectionName), data);
            await refreshData(); // Actualiza el estado global
        } catch (err) {
            showTemporaryError(`Error al guardar: ${err.message}`);
        }
    };
    
    const handleSaveCriterion = (newCriterion) => {
        if (!newCriterion.name || !newCriterion.section) return;
        handleSave('criteria', newCriterion);
    };

    const handleSaveNonEvaluableCriterion = (newNonEvaluableCriterion) => {
        if (!newNonEvaluableCriterion.name || !newNonEvaluableCriterion.section) return;
        const dataToSave = { ...newNonEvaluableCriterion };
        if (dataToSave.inputType === 'select' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        } else if (dataToSave.inputType !== 'select') {
            delete dataToSave.options;
        }
        handleSave('nonEvaluableCriteria', dataToSave);
    };

    const handleSaveExecutive = (newExecutive) => {
        if (Object.values(newExecutive).some(val => !val)) return;
        handleSave('executives', newExecutive);
    };
    
    const handleSaveField = async (newField) => {
        if (!newField.name) return;
        const maxOrder = executiveFields.reduce((max, field) => Math.max(field.order || 0, max), 0);
        await handleSave('executiveFields', { ...newField, order: maxOrder + 1, isDefault: false });
    };

    const handleSaveEvaluationSection = async (newSection) => {
        const maxOrder = evaluationSections.reduce((max, section) => Math.max(section.order || 0, max), 0);
        await handleSave('evaluationSections', { ...newSection, order: maxOrder + 1 });
    };
    
    const handleSaveSubsection = async (newSubsection) => {
        if (!newSubsection.name || !newSubsection.section) return;
        const sameSectionSubs = aptitudeSubsections.filter(s => s.section === newSubsection.section);
        const maxOrder = sameSectionSubs.reduce((max, sub) => Math.max(sub.order || 0, max), 0);
        await handleSave('aptitudeSubsections', { ...newSubsection, order: maxOrder + 1 });
    };

    const handleSaveCustomTab = (newTab) => {
        handleSave('customTabs', newTab);
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

    // --- LÓGICA DE BORRADO ---
    const handleDelete = async (collectionName, id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
        
        try {
            if (collectionName === 'evaluationSections') {
                const sectionToDelete = evaluationSections.find(s => s.id === id);
                if (sectionToDelete?.isDefault) {
                    throw new Error('No se pueden eliminar las secciones por defecto.');
                }
                const isUsed = criteria.some(c => c.section === sectionToDelete?.name) || nonEvaluableCriteria.some(c => c.section === sectionToDelete?.name);
                if (isUsed) {
                    throw new Error('No se puede eliminar la sección porque está en uso.');
                }
            }
            await deleteDoc(doc(db, collectionName, id));
            await refreshData(); // Actualiza el estado global
        } catch (err) {
            showTemporaryError(err.message);
        }
    };
    
    // --- LÓGICA DE ORDENAMIENTO ---
    const handleMove = async (collectionName, items, itemId, direction) => {
        const sortedItems = [...items].sort((a, b) => a.order - b.order);
        const index = sortedItems.findIndex(item => item.id === itemId);
        if (index === -1) return;

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= sortedItems.length) return;

        const item1 = sortedItems[index];
        const item2 = sortedItems[swapIndex];

        try {
            const batch = writeBatch(db);
            batch.update(doc(db, collectionName, item1.id), { order: item2.order });
            batch.update(doc(db, collectionName, item2.id), { order: item1.order });
            await batch.commit();
            await refreshData(); // Actualiza el estado global
        } catch (err) {
            showTemporaryError(`Error al reordenar: ${err.message}`);
        }
    };
    
    const getEvaluableEditFields = (item) => [
        { name: 'name', label: 'Nombre del Criterio' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'section', label: 'Sección', type: 'select', options: evaluationSections.map(s => ({ value: s.name, label: s.name })) },
        { name: 'subsection', label: 'Subsección', type: 'select', options: [{value: '', label: 'Sin Subsección'}, ...aptitudeSubsections.filter(s => s.section === item.section).map(s => ({value: s.name, label: s.name}))] }
    ];
    
    const getNonEvaluableEditFields = (item) => [
        { name: 'name', label: 'Nombre del Criterio' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'section', label: 'Sección', type: 'select', options: evaluationSections.map(s => ({ value: s.name, label: s.name })) },
        { name: 'inputType', label: 'Tipo de Campo', type: 'select', options: [{value: 'text', label: 'Texto'}, {value: 'select', label: 'Desplegable'}, {value: 'date', label: 'Fecha'}] },
        ...(item.inputType === 'select' ? [{ name: 'options', label: 'Opciones (separadas por comas)'}] : []),
        { name: 'trackInDashboard', label: 'Seguimiento Detallado', type: 'checkbox', checkboxLabel: 'Mostrar desglose de valores en Dashboard' },
        { name: 'trackEmptyInDashboard', label: 'Conteo de Vacíos', type: 'checkbox', checkboxLabel: 'Contar valores N/A o vacíos en Dashboard' }
    ];
    
     const getNonEvaluableSubtitle = (item) => {
        const parts = [];
        parts.push(item.inputType === 'select' ? 'Desplegable' : (item.inputType === 'date' ? 'Fecha' : 'Texto'));
        if (item.trackInDashboard) parts.push('Seguimiento Detallado');
        if (item.trackEmptyInDashboard) parts.push('Conteo Vacíos');
        return `(${parts.join(', ')})`;
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
                
                <ManageExecutives 
                    executives={executives}
                    executiveFields={executiveFields}
                    currentUser={currentUser}
                    handleSaveExecutive={handleSaveExecutive}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />

                 <ManageSections 
                    evaluationSections={evaluationSections}
                    currentUser={currentUser}
                    onSave={handleSaveEvaluationSection}
                    onMove={(sectionId, direction) => handleMove('evaluationSections', evaluationSections, sectionId, direction)}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                 />

                <ManageSubsections
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    currentUser={currentUser}
                    handleSaveSubsection={handleSaveSubsection}
                    handleEditClick={handleEditClick}
                    handleMoveSubsection={(subId, secName, dir) => handleMove('aptitudeSubsections', aptitudeSubsections.filter(s => s.section === secName), subId, dir)}
                    handleDelete={handleDelete}
                />
                
                <ManageEvaluableCriteria
                    criteria={criteria}
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    currentUser={currentUser}
                    handleSaveCriterion={handleSaveCriterion}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                    getEvaluableEditFields={getEvaluableEditFields}
                />

                <ManageNonEvaluableCriteria
                    nonEvaluableCriteria={nonEvaluableCriteria}
                    evaluationSections={evaluationSections}
                    currentUser={currentUser}
                    handleSaveNonEvaluableCriterion={handleSaveNonEvaluableCriterion}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                    getNonEvaluableSubtitle={getNonEvaluableSubtitle}
                    getNonEvaluableEditFields={(item) => getNonEvaluableEditFields(item)}
                />

                <ManageExecutiveFields
                    executiveFields={executiveFields}
                    currentUser={currentUser}
                    handleSaveField={handleSaveField}
                    handleEditClick={handleEditClick}
                    handleDelete={handleDelete}
                />
                
                <div className="card">
                    <h4 className="card-title card-title-primary">Información de la Organización</h4>
                    <CollapsibleCard>
                    {currentUser && (
                    <form onSubmit={handleSaveHeaderInfo}>
                        <div className="form-group">
                            <label>Nombre de la Empresa</label>
                            <input type="text" className="form-control" value={headerInfo.company || ''} onChange={(e) => setHeaderInfo({...headerInfo, company: e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Área de Evaluaciones</label>
                            <input type="text" className="form-control" value={headerInfo.area || ''} onChange={(e) => setHeaderInfo({...headerInfo, area: e.target.value})}/>
                        </div>
                        <div className="form-group">
                            <label>Nombre del Encargado</label>
                            <input type="text" className="form-control" value={headerInfo.manager || ''} onChange={(e) => setHeaderInfo({...headerInfo, manager: e.target.value})}/>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Guardar Información</button>
                    </form>
                    )}
                    </CollapsibleCard>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
