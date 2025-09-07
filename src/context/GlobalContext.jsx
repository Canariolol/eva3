import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, writeBatch, addDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const { currentUser } = useAuth();
    
    // Data states
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [aptitudeSubsections, setAptitudeSubsections] = useState([]);
    const [executiveFields, setExecutiveFields] = useState([]);
    const [evaluationSections, setEvaluationSections] = useState([]);
    const [customTabs, setCustomTabs] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });
    const [headerInfoId, setHeaderInfoId] = useState(null);

    // User role states
    const [userRole, setUserRole] = useState(null);
    const [executiveData, setExecutiveData] = useState(null);

    // Loading & Error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- NEW: UI PRESET STATE ---
    const [uiPreset, setUiPreset] = useState(() => {
        try {
            const savedPreset = localStorage.getItem('uiPreset');
            return savedPreset ? JSON.parse(savedPreset) : 'classic'; // 'classic' is the default
        } catch (e) {
            console.error("Could not parse uiPreset from localStorage", e);
            return 'classic';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('uiPreset', JSON.stringify(uiPreset));
        } catch (e) {
            console.error("Could not save uiPreset to localStorage", e);
        }
    }, [uiPreset]);

    const toggleUiPreset = () => {
        setUiPreset(prevPreset => (prevPreset === 'classic' ? 'modern' : 'classic'));
    };

    // Dark Mode state (no changes)
    const [darkMode, setDarkMode] = useState(() => {
        try {
            const savedMode = localStorage.getItem('darkMode');
            return savedMode ? JSON.parse(savedMode) : false;
        } catch (e) {
            console.error("Could not parse dark mode from localStorage", e);
            return false;
        }
    });

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        try {
            localStorage.setItem('darkMode', JSON.stringify(darkMode));
        } catch (e) {
            console.error("Could not save dark mode to localStorage", e);
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(prevMode => !prevMode);

    // fetchData and role determination logic remain the same
    const fetchData = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [
                fieldsSnap, executivesSnap, criteriaSnap, nonEvaluableCriteriaSnap,
                evaluationsSnap, subsectionsSnap, sectionsSnap, customTabsSnap, headerSnap
            ] = await Promise.all([
                getDocs(query(collection(db, 'executiveFields'), orderBy('order'))),
                getDocs(query(collection(db, 'executives'), orderBy('Nombre'))),
                getDocs(query(collection(db, 'criteria'), orderBy('name'))),
                getDocs(query(collection(db, 'nonEvaluableCriteria'), orderBy('name'))),
                getDocs(query(collection(db, 'evaluations'), orderBy('evaluationDate', 'desc'))),
                getDocs(query(collection(db, 'aptitudeSubsections'), orderBy('order'))),
                getDocs(query(collection(db, 'evaluationSections'), orderBy('order'))),
                getDocs(collection(db, 'customTabs')),
                getDocs(collection(db, 'headerInfo'))
            ]);
            
            setExecutives(executivesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCriteria(criteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setNonEvaluableCriteria(nonEvaluableCriteriaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setEvaluations(evaluationsSnap.docs.map(d => ({
                id: d.id, ...d.data(),
                evaluationDate: d.data().evaluationDate?.toDate(),
                managementDate: d.data().managementDate?.toDate()
            })));
            setAptitudeSubsections(subsectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCustomTabs(customTabsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("Error fetching global data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        if (!currentUser) {
            setUserRole(null);
            setExecutiveData(null);
            return;
        }
        const determineRole = async () => {
            const adminRef = doc(db, 'admins', currentUser.email);
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists()) {
                setUserRole('admin');
                setExecutiveData(null);
                return;
            }
            if (executives.length > 0) {
                const matchingExecutive = executives.find(exec => 
                    exec.Email && exec.Email.toLowerCase() === currentUser.email.toLowerCase()
                );
                if (matchingExecutive) {
                    setUserRole('executive');
                    setExecutiveData(matchingExecutive);
                } else {
                    setUserRole(null);
                    setExecutiveData(null);
                }
            }
        };
        if (!loading) {
            determineRole();
        }
    }, [currentUser, executives, loading]);

    const value = {
        // Data and user role
        executives, criteria, nonEvaluableCriteria, evaluations, aptitudeSubsections,
        executiveFields, evaluationSections, customTabs, headerInfo, headerInfoId,
        userRole, executiveData,
        // App state
        loading, error, darkMode, uiPreset,
        // Functions
        refreshData: fetchData, setExecutiveFields, setHeaderInfo,
        setHeaderInfoId, toggleDarkMode, toggleUiPreset,
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
