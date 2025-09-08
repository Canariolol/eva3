import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const { currentUser, companyId, userRole } = useAuth();
    
    // Estados de datos
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [aptitudeSubsections, setAptitudeSubsections] = useState([]);
    const [executiveFields, setExecutiveFields] = useState([]);
    const [evaluationSections, setEvaluationSections] = useState([]);
    const [customTabs, setCustomTabs] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });
    const [executiveData, setExecutiveData] = useState(null);

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uiPreset, setUiPreset] = useState(() => localStorage.getItem('uiPreset') || 'classic');
    const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('darkMode') === 'true'));
    
    // --- NUEVO ESTADO PARA EL WIZARD ---
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => { localStorage.setItem('uiPreset', uiPreset); }, [uiPreset]);
    useEffect(() => {
        document.body.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleUiPreset = () => setUiPreset(p => (p === 'classic' ? 'modern' : 'classic'));
    const toggleDarkMode = () => setDarkMode(p => !p);

    const fetchData = useCallback(async () => {
        if (!currentUser || !companyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const companyRef = doc(db, 'companies', companyId);
            const collectionsToFetch = {
                executives: collection(companyRef, 'executives'),
                headerInfo: collection(companyRef, 'headerInfo'),
                // ... (el resto de las colecciones)
            };
            const promises = Object.values(collectionsToFetch).map(getDocs);
            const snapshots = await Promise.all(promises);

            const executivesSnap = snapshots[0];
            const headerSnap = snapshots[1];
            
            setExecutives(executivesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            if (!headerSnap.empty) {
                setHeaderInfo(headerSnap.docs[0].data());
                 // --- LÓGICA DEL WIZARD ---
                // Si no hay industria, es un usuario nuevo.
                if (!headerSnap.docs[0].data().industry && userRole === 'manager') {
                    setShowOnboarding(true);
                }
            }
            
        } catch (err) {
            console.error("Error fetching company data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, companyId, userRole]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value = {
        executives, criteria, nonEvaluableCriteria, evaluations, aptitudeSubsections,
        executiveFields, evaluationSections, customTabs, headerInfo,
        executiveData, loading, error, darkMode, uiPreset, showOnboarding,
        refreshData: fetchData,
        toggleDarkMode,
        toggleUiPreset,
        setShowOnboarding // Exponemos la función para poder cerrar el wizard
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
