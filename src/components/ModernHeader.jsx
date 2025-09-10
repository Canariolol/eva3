import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import SuperAdminSelector from './SuperAdminSelector'; // 1. Importar el nuevo componente
import { Sun, Moon, LayoutDashboard, Layout } from 'lucide-react';

const ModernHeader = () => {
    const { currentUser, userRole } = useAuth();
    // 2. Obtener los nuevos estados/setters del contexto
    const { headerInfo, darkMode, toggleDarkMode, dashboardType, setDashboardType } = useGlobalContext();

    const getInitials = (name) => {
        if (!name) return 'SA';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };
    
    return (
        <header className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-100 dark:border-zinc-700 px-8 py-6">
            <div className="flex items-center justify-between">
                {/* 3. Reemplazar el <select> con el nuevo componente SuperAdminSelector */}
                {userRole === 'superadmin' ? (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Vista de Superadmin
                        </h2>
                        <div className="mt-2">
                           <SuperAdminSelector />
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
                    {/* 4. Interruptor para el tipo de Dashboard */}
                    <button 
                        onClick={() => setDashboardType(dashboardType === 'modern' ? 'classic' : 'modern')} 
                        className="p-3 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700"
                        title={dashboardType === 'modern' ? "Cambiar a Dashboard Clásico" : "Cambiar a Dashboard Moderno"}
                    >
                        {dashboardType === 'modern' ? <Layout size={20} /> : <LayoutDashboard size={20} />}
                    </button>

                    <button 
                        onClick={toggleDarkMode} 
                        className="p-3 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700"
                        title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
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
