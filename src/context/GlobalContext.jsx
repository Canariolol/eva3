import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const { currentUser, companyId: authCompanyId, userRole } = useAuth(); // Renombramos companyId para claridad
    
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
    
    // --- ESTADO PARA SUPERADMIN ---
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => { localStorage.setItem('uiPreset', uiPreset); }, [uiPreset]);
    useEffect(() => {
        document.body.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleUiPreset = () => setUiPreset(p => (p === 'classic' ? 'modern' : 'classic'));
    const toggleDarkMode = () => setDarkMode(p => !p);

    const fetchData = useCallback(async () => {
        // Determinamos qué companyId usar
        const companyIdToFetch = userRole === 'superadmin' ? selectedCompanyId : authCompanyId;

        if (!currentUser || !companyIdToFetch) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const companyRef = doc(db, 'companies', companyIdToFetch);
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
                if (!headerSnap.docs[0].data().industry && userRole === 'manager') {
                    setShowOnboarding(true);
                }
            } else {
                 // Si no hay headerInfo (ej. el superadmin cambia a una compañía nueva)
                 // reseteamos la información para no mostrar datos viejos.
                setHeaderInfo({ company: 'N/A', area: 'N/A', manager: 'N/A' });
            }
            
        } catch (err) {
            console.error("Error fetching company data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, authCompanyId, userRole, selectedCompanyId]); // Agregamos selectedCompanyId a las dependencias

    useEffect(() => {
        // Si el usuario es superadmin, esperamos a que se seleccione una compañía
        // Si no, cargamos los datos inmediatamente.
        if (userRole === 'superadmin' && !selectedCompanyId) {
            // Podríamos establecer un estado de "esperando selección" aquí si quisiéramos
            return;
        }
        fetchData();
    }, [fetchData, userRole, selectedCompanyId]);

    const value = {
        executives, criteria, nonEvaluableCriteria, evaluations, aptitudeSubsections,
        executiveFields, evaluationSections, customTabs, headerInfo,
        executiveData, loading, error, darkMode, uiPreset, showOnboarding,
        refreshData: fetchData,
        toggleDarkMode,
        toggleUiPreset,
        setShowOnboarding,
        setSelectedCompanyId, // Exponemos la función para que el Header la use
        selectedCompanyId
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
