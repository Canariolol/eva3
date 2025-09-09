import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import { getAllCompanies } from '../firebase'; // 1. Importar
import { Sun, Moon, ChevronDown } from 'lucide-react'; // ChevronDown para el selector

const ModernHeader = () => {
    // 2. Obtener userRole y funciones del contexto
    const { currentUser, userRole } = useAuth();
    const { headerInfo, darkMode, toggleDarkMode, setSelectedCompanyId } = useGlobalContext();

    // 3. Estados para el superadmin
    const [companies, setCompanies] = useState([]);
    const [currentCompanyId, setCurrentCompanyId] = useState('');

    // 4. Efecto para cargar las compañías si es superadmin
    useEffect(() => {
        if (userRole === 'superadmin') {
            const fetchCompanies = async () => {
                const companyList = await getAllCompanies();
                setCompanies(companyList);
                if (companyList.length > 0) {
                    // Inicializa el selector con la primera compañía o la que esté en el contexto global
                    const initialId = companyList[0].id;
                    setCurrentCompanyId(initialId);
                    setSelectedCompanyId(initialId);
                }
            };
            fetchCompanies();
        }
    }, [userRole, setSelectedCompanyId]);


    const getInitials = (name) => {
        if (!name) return 'SA'; // Super Admin
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };
    
    // 5. Handler para el cambio de compañía
    const handleCompanyChange = (e) => {
        const newCompanyId = e.target.value;
        setCurrentCompanyId(newCompanyId);
        setSelectedCompanyId(newCompanyId);
    };

    return (
        <header className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-100 dark:border-zinc-700 px-8 py-6">
            <div className="flex items-center justify-between">
                {/* 6. Renderizado condicional */}
                {userRole === 'superadmin' ? (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Vista de Superadmin
                        </h2>
                        <div className="relative mt-2">
                             <select 
                                value={currentCompanyId} 
                                onChange={handleCompanyChange}
                                className="appearance-none w-full md:w-auto bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 pr-8"
                            >
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.headerInfo?.company || company.id}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {headerInfo.company || 'Mi Compañía'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
                            {headerInfo.area || 'Área General'}
                        </p>
                    </div>
                )}
                
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={toggleDarkMode} 
                        className="p-3 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                ¡Hola, {currentUser?.displayName || (userRole === 'superadmin' ? 'Superadmin' : 'Usuario')}!
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                                {userRole === 'superadmin' ? 'Acceso Total' : (headerInfo.manager || 'Manager')}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold">
                                {getInitials(currentUser?.displayName)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ModernHeader;
