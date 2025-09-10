import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const { currentUser, companyId: authCompanyId, workgroupId: authWorkgroupId, userRole } = useAuth();
    
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
    // 1. 'dashboardType' reemplaza a 'uiPreset' para controlar solo el dashboard
    const [dashboardType, setDashboardType] = useState(() => localStorage.getItem('dashboardType') || 'modern');
    const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('darkMode') === 'true'));
    
    // Estados para Superadmin
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [availableWorkgroups, setAvailableWorkgroups] = useState([]);
    const [selectedWorkgroupId, setSelectedWorkgroupId] = useState(null);

    const [showOnboarding, setShowOnboarding] = useState(false);

    // Guardar la preferencia del tipo de dashboard en localStorage
    useEffect(() => { localStorage.setItem('dashboardType', dashboardType); }, [dashboardType]);
    useEffect(() => {
        document.body.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    useEffect(() => {
        const fetchWorkgroupsForAdmin = async () => {
            setAvailableWorkgroups([]);
            setSelectedWorkgroupId(null);

            if (userRole === 'superadmin' && selectedCompanyId) {
                try {
                    const workgroupsRef = collection(db, 'companies', selectedCompanyId, 'workgroups');
                    const snapshot = await getDocs(workgroupsRef);
                    const workgroupsData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id }));
                    setAvailableWorkgroups(workgroupsData);

                    if (workgroupsData.length > 0) {
                        const defaultWg = workgroupsData.find(wg => wg.id === 'default-workgroup');
                        setSelectedWorkgroupId(defaultWg ? defaultWg.id : workgroupsData[0].id);
                    }
                } catch (error) { console.error("Error fetching workgroups for admin:", error); }
            }
        };
        fetchWorkgroupsForAdmin();
    }, [selectedCompanyId, userRole]);

    const toggleDarkMode = () => setDarkMode(p => !p);

    const fetchData = useCallback(async () => {
        const companyIdToFetch = userRole === 'superadmin' ? selectedCompanyId : authCompanyId;
        const workgroupIdToFetch = userRole === 'superadmin' ? selectedWorkgroupId : authWorkgroupId;

        if (!currentUser || !companyIdToFetch || !workgroupIdToFetch) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const workgroupRef = doc(db, 'companies', companyIdToFetch, 'workgroups', workgroupIdToFetch);
            const collectionsToFetch = {
                executives: collection(workgroupRef, 'executives'),
                evaluations: collection(workgroupRef, 'evaluations'),
                criteria: query(collection(workgroupRef, 'criteria'), orderBy('name')),
                nonEvaluableCriteria: query(collection(workgroupRef, 'nonEvaluableCriteria'), orderBy('order')),
                evaluationSections: query(collection(workgroupRef, 'evaluationSections'), orderBy('order')),
                aptitudeSubsections: query(collection(workgroupRef, 'aptitudeSubsections'), orderBy('order')),
                executiveFields: query(collection(workgroupRef, 'executiveFields'), orderBy('order')),
                customTabs: query(collection(workgroupRef, 'customTabs'), orderBy('order')),
                headerInfo: collection(workgroupRef, 'headerInfo')
            };
            
            const promises = Object.values(collectionsToFetch).map(getDocs);
            const snapshots = await Promise.all(promises);

            const [ execSnap, evalsSnap, critSnap, nonEvalCritSnap, evalSecSnap, aptSubSnap, execFieldsSnap, tabsSnap, headerSnap ] = snapshots;
            
            setExecutives(execSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setEvaluations(evalsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCriteria(critSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setNonEvaluableCriteria(nonEvalCritSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setEvaluationSections(evalSecSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setAptitudeSubsections(aptSubSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setExecutiveFields(execFieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCustomTabs(tabsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            if (!headerSnap.empty) setHeaderInfo(headerSnap.docs[0].data());
            else setHeaderInfo({ company: 'N/A', area: 'N/A', manager: 'N/A' });
            
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, authCompanyId, authWorkgroupId, userRole, selectedCompanyId, selectedWorkgroupId]);

    useEffect(() => {
        if (userRole === 'superadmin' && (!selectedCompanyId || !selectedWorkgroupId)) {
            setExecutives([]); setEvaluations([]);
            return;
        }
        fetchData();
    }, [fetchData, userRole, selectedCompanyId, selectedWorkgroupId]);

    const value = {
        executives, criteria, nonEvaluableCriteria, evaluations, aptitudeSubsections,
        executiveFields, evaluationSections, customTabs, headerInfo,
        executiveData, loading, error, darkMode, showOnboarding,
        dashboardType, setDashboardType, // Exponemos el nuevo estado y su setter
        refreshData: fetchData,
        toggleDarkMode, setShowOnboarding,
        setSelectedCompanyId, selectedCompanyId,
        availableWorkgroups, selectedWorkgroupId, setSelectedWorkgroupId
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
