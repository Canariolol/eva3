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
import ManageCustomTabs from '../components/Configuration/ManageCustomTabs'; // Importar el nuevo componente
import CollapsibleCard from '../components/CollapsibleCard';

const Configuration = () => {
    // Toda la lógica y el estado se quedan en el componente padre
    const { 
        executives, 
        criteria, 
        nonEvaluableCriteria, 
        aptitudeSubsections, 
        executiveFields, 
        evaluationSections,
        customTabs, // Añadir customTabs del contexto
        headerInfo,
        headerInfoId,
        refreshData,
        setHeaderInfo,
    } = useGlobalContext();
    const { currentUser } = useAuth();

    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [editConfig, setEditConfig] = useState({ collection: '', fields: [] });

    // --- Todas las funciones de manejo de datos ---
    
    const handleEditClick = (item, collection, fields) => {
        setItemToEdit(item);
        setEditConfig({ collection, fields });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedItem) => {
        if (!editedItem.id) return;
        const { id, ...dataToSave } = editedItem;
        if (editConfig.collection === 'nonEvaluableCriteria' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        }
        await updateDoc(doc(db, editConfig.collection, id), dataToSave);
        await refreshData();
        setIsEditModalOpen(false);
        setItemToEdit(null);
    };

    const handleSaveEvaluationSection = async (newSection) => {
        const maxOrder = evaluationSections.reduce((max, section) => Math.max(section.order || 0, max), 0);
        await addDoc(collection(db, 'evaluationSections'), { ...newSection, order: maxOrder + 1 });
        await refreshData();
    };

    const handleSaveHeaderInfo = async (e) => {
        e.preventDefault();
        try {
            if (headerInfoId) {
                await setDoc(doc(db, 'headerInfo', headerInfoId), headerInfo);
            } else {
                await addDoc(collection(db, 'headerInfo'), headerInfo);
            }
            await refreshData();
        } catch (err) {
            setError('Error al guardar la información del encabezado.');
        }
    };
    
    const handleSaveField = async (newField) => {
        if (!newField.name) return;
        const maxOrder = executiveFields.reduce((max, field) => Math.max(field.order || 0, max), 0);
        await addDoc(collection(db, 'executiveFields'), { name: newField.name, order: maxOrder + 1, isDefault: false });
        await refreshData();
    };

    const handleSaveExecutive = async (newExecutive) => {
        if (Object.values(newExecutive).some(val => !val)) return; 
        await addDoc(collection(db, 'executives'), newExecutive);
        await refreshData();
    };
    
    const handleSaveCriterion = async (newCriterion) => {
        if (!newCriterion.name || !newCriterion.section) return;
        await addDoc(collection(db, 'criteria'), newCriterion);
        await refreshData();
    };
    
    const handleSaveSubsection = async (newSubsection) => {
        if (!newSubsection.name || !newSubsection.section) return;
        const sameSectionSubs = aptitudeSubsections.filter(s => s.section === newSubsection.section);
        const maxOrder = sameSectionSubs.reduce((max, sub) => Math.max(sub.order || 0, max), 0);
        await addDoc(collection(db, 'aptitudeSubsections'), { ...newSubsection, order: maxOrder + 1 });
        await refreshData();
    };

    const handleSaveNonEvaluableCriterion = async (newNonEvaluableCriterion) => {
        if (!newNonEvaluableCriterion.name || !newNonEvaluableCriterion.section) return;
        const dataToSave = { ...newNonEvaluableCriterion };
        if (dataToSave.inputType === 'select' && typeof dataToSave.options === 'string') {
            dataToSave.options = dataToSave.options.split(',').map(opt => opt.trim());
        } else if (dataToSave.inputType === 'text') {
            delete dataToSave.options;
        }
        await addDoc(collection(db, 'nonEvaluableCriteria'), dataToSave);
        await refreshData();
    };

    const handleSaveCustomTab = async (newTab) => {
        await addDoc(collection(db, 'customTabs'), newTab);
        await refreshData();
    };

    const handleDelete = async (collectionName, id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
             if (collectionName === 'evaluationSections') {
                const sectionToDelete = evaluationSections.find(s => s.id === id);
                if (sectionToDelete.isDefault) {
                     setError('No se pueden eliminar las secciones por defecto.');
                     setTimeout(() => setError(''), 5000);
                     return;
                }
                const criteriaUsingSection = criteria.filter(c => c.section === sectionToDelete?.name);
                const nonEvaluableCriteriaUsingSection = nonEvaluableCriteria.filter(c => c.section === sectionToDelete?.name);
                 if (criteriaUsingSection.length > 0 || nonEvaluableCriteriaUsingSection.length > 0) {
                    setError(`No se puede eliminar la sección porque está en uso.`);
                    setTimeout(() => setError(''), 5000);
                    return;
                }
            }
            await deleteDoc(doc(db, collectionName, id));
            await refreshData();
        }
    };
    
    const handleMoveSection = async (sectionId, direction) => {
        const sections = [...evaluationSections].sort((a,b) => a.order - b.order);
        const index = sections.findIndex(s => s.id === sectionId);
        if (index === -1) return;
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= sections.length) return;
        const section1 = sections[index];
        const section2 = sections[swapIndex];
        const batch = writeBatch(db);
        batch.update(doc(db, 'evaluationSections', section1.id), { order: section2.order });
        batch.update(doc(db, 'evaluationSections', section2.id), { order: section1.order });
        await batch.commit();
        await refreshData();
    };

    const handleMoveSubsection = async (subsectionId, sectionName, direction) => {
        const subsOfSection = aptitudeSubsections
            .filter(s => s.section === sectionName)
            .sort((a, b) => a.order - b.order);

        const index = subsOfSection.findIndex(s => s.id === subsectionId);
        if (index === -1) return;
    
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
        if (swapIndex < 0 || swapIndex >= subsOfSection.length) return;
    
        const sub1 = subsOfSection[index];
        const sub2 = subsOfSection[swapIndex];
    
        const batch = writeBatch(db);
        batch.update(doc(db, 'aptitudeSubsections', sub1.id), { order: sub2.order });
        batch.update(doc(db, 'aptitudeSubsections', sub2.id), { order: sub1.order });
    
        await batch.commit();
        await refreshData();
    };


    const getNonEvaluableSubtitle = (item) => {
        const parts = [];
        parts.push(item.inputType === 'select' ? 'Desplegable' : 'Texto');
        if (item.trackInDashboard) parts.push('Seguimiento Detallado');
        if (item.trackEmptyInDashboard) parts.push('Conteo Vacíos');
        return `(${parts.join(', ')})`;
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
        { name: 'inputType', label: 'Tipo de Campo', type: 'select', options: [{value: 'text', label: 'Texto'}, {value: 'select', label: 'Desplegable'}] },
        ...(item.inputType === 'select' ? [{ name: 'options', label: 'Opciones (separadas por comas)'}] : []),
        { name: 'trackInDashboard', label: 'Seguimiento Detallado', type: 'checkbox', checkboxLabel: 'Mostrar desglose de valores en Dashboard' },
        { name: 'trackEmptyInDashboard', label: 'Conteo de Vacíos', type: 'checkbox', checkboxLabel: 'Contar valores N/A o vacíos en Dashboard' }
    ];
    
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
                    onMove={handleMoveSection}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                 />

                <ManageSubsections
                    evaluationSections={evaluationSections}
                    aptitudeSubsections={aptitudeSubsections}
                    currentUser={currentUser}
                    handleSaveSubsection={handleSaveSubsection}
                    handleEditClick={handleEditClick}
                    handleMoveSubsection={handleMoveSubsection}
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

                <ManageCustomTabs
                    customTabs={customTabs}
                    onSave={handleSaveCustomTab}
                    onDelete={(tabId) => handleDelete('customTabs', tabId)}
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
