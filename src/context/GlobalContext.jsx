import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, setDoc, addDoc } from 'firebase/firestore';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [aptitudeSubsections, setAptitudeSubsections] = useState([]);
    const [executiveFields, setExecutiveFields] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });
    const [headerInfoId, setHeaderInfoId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // Don't set loading to true here to avoid showing loading on refresh
        // setLoading(true); 
        try {
            const [
                fieldsSnap,
                executivesSnap,
                criteriaSnap,
                nonEvaluableCriteriaSnap,
                evaluationsSnap,
                subsectionsSnap,
                headerSnap
            ] = await Promise.all([
                getDocs(query(collection(db, 'executiveFields'), orderBy('order'))),
                getDocs(query(collection(db, 'executives'), orderBy('Nombre'))),
                getDocs(query(collection(db, 'criteria'), orderBy('name'))),
                getDocs(query(collection(db, 'nonEvaluableCriteria'), orderBy('name'))),
                getDocs(query(collection(db, 'evaluations'), orderBy('evaluationDate', 'desc'))),
                getDocs(query(collection(db, 'aptitudeSubsections'), orderBy('order'))),
                getDocs(collection(db, 'headerInfo'))
            ]);
            
             if (fieldsSnap.empty) {
                const defaultFields = [
                    { name: 'Nombre', order: 1, isDefault: true },
                    { name: 'Cargo', order: 2, isDefault: true },
                    { name: 'Área', order: 3, isDefault: true }
                ];
                await Promise.all(defaultFields.map(field => addDoc(collection(db, 'executiveFields'), field)));
                const newFieldsSnap = await getDocs(query(collection(db, 'executiveFields'), orderBy('order')));
                setExecutiveFields(newFieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setExecutiveFields(fieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }

            setExecutives(executivesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCriteria(criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setNonEvaluableCriteria(nonEvaluableCriteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setEvaluations(evaluationsSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                evaluationDate: d.data().evaluationDate?.toDate(),
                managementDate: d.data().managementDate?.toDate()
            })));
            setAptitudeSubsections(subsectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            if (!headerSnap.empty) {
                const headerDoc = headerSnap.docs[0];
                setHeaderInfo(headerDoc.data());
                setHeaderInfoId(headerDoc.id);
            }

        } catch (err) {
            console.error("Error fetching global data:", err);
            setError("Error al cargar los datos. Por favor, recarga la página.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value = {
        executives,
        criteria,
        nonEvaluableCriteria,
        evaluations,
        aptitudeSubsections,
        executiveFields,
        headerInfo,
        headerInfoId,
        loading,
        error,
        refreshData: fetchData,
        setExecutiveFields,
        setHeaderInfo,
        setHeaderInfoId
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
