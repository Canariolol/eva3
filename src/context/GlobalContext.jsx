import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext'; // Ahora obtenemos el rol y companyId de aquí

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    // Obtenemos currentUser, companyId y el rol directamente del AuthContext
    const { currentUser, companyId, userRole } = useAuth();
    
    // Los estados de datos permanecen igual
    const [executives, setExecutives] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [nonEvaluableCriteria, setNonEvaluableCriteria] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [aptitudeSubsections, setAptitudeSubsections] = useState([]);
    const [executiveFields, setExecutiveFields] = useState([]);
    const [evaluationSections, setEvaluationSections] = useState([]);
    const [customTabs, setCustomTabs] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });

    // Estado para el perfil del ejecutivo (si el usuario es uno)
    const [executiveData, setExecutiveData] = useState(null);

    // Estados de la UI (loading, error, presets)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uiPreset, setUiPreset] = useState(() => localStorage.getItem('uiPreset') || 'classic');
    const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('darkMode') === 'true'));

    // Efectos para guardar presets y modo oscuro en localStorage
    useEffect(() => { localStorage.setItem('uiPreset', uiPreset); }, [uiPreset]);
    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleUiPreset = () => setUiPreset(p => (p === 'classic' ? 'modern' : 'classic'));
    const toggleDarkMode = () => setDarkMode(p => !p);

    // --- FETCHDATA REFACTORIZADO ---
    const fetchData = useCallback(async () => {
        // La condición ahora es tener un companyId, no solo un usuario
        if (!currentUser || !companyId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Construimos la ruta base a los datos de la compañía
            const companyRef = doc(db, 'companies', companyId);

            const collectionsToFetch = {
                executiveFields: query(collection(companyRef, 'executiveFields'), orderBy('order')),
                executives: query(collection(companyRef, 'executives'), orderBy('Nombre')),
                criteria: query(collection(companyRef, 'criteria'), orderBy('name')),
                nonEvaluableCriteria: query(collection(companyRef, 'nonEvaluableCriteria'), orderBy('name')),
                evaluations: query(collection(companyRef, 'evaluations'), orderBy('evaluationDate', 'desc')),
                aptitudeSubsections: query(collection(companyRef, 'aptitudeSubsections'), orderBy('order')),
                evaluationSections: query(collection(companyRef, 'evaluationSections'), orderBy('order')),
                customTabs: collection(companyRef, 'customTabs'),
                headerInfo: collection(companyRef, 'headerInfo') // Asumiendo que es una subcolección
            };

            const promises = Object.values(collectionsToFetch).map(getDocs);
            const snapshots = await Promise.all(promises);
            const keys = Object.keys(collectionsToFetch);

            const data = snapshots.reduce((acc, snap, index) => {
                acc[keys[index]] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                return acc;
            }, {});

            // Actualizamos todos los estados con los nuevos datos anidados
            setExecutiveFields(data.executiveFields);
            setExecutives(data.executives);
            setCriteria(data.criteria);
            setNonEvaluableCriteria(data.nonEvaluableCriteria);
            setEvaluations(data.evaluations.map(e => ({...e, evaluationDate: e.evaluationDate?.toDate(), managementDate: e.managementDate?.toDate()})));
            setAptitudeSubsections(data.aptitudeSubsections);
            setEvaluationSections(data.evaluationSections);
            setCustomTabs(data.customTabs);
            if (data.headerInfo.length > 0) {
                setHeaderInfo(data.headerInfo[0]);
            }

        } catch (err) {
            console.error("Error fetching company data:", err);
            setError("Error al cargar los datos de la compañía.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- LÓGICA DE ROL DE EJECUTIVO ---
    useEffect(() => {
        // Esta lógica ahora solo se encarga de encontrar el perfil del ejecutivo.
        // El 'rol' ya viene del AuthContext.
        if (userRole === 'executive' && executives.length > 0) {
            const matchingExecutive = executives.find(exec => 
                exec.Email && exec.Email.toLowerCase() === currentUser.email.toLowerCase()
            );
            setExecutiveData(matchingExecutive || null);
        } else {
            setExecutiveData(null);
        }
    }, [currentUser, userRole, executives]);

    const value = {
        // Los datos de la compañía
        executives, criteria, nonEvaluableCriteria, evaluations, aptitudeSubsections,
        executiveFields, evaluationSections, customTabs, headerInfo,
        // El perfil del ejecutivo
        executiveData,
        // Estado de la app
        loading, error, darkMode, uiPreset,
        // Funciones
        refreshData: fetchData,
        toggleDarkMode,
        toggleUiPreset,
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
