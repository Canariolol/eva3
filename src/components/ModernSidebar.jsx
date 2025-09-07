import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import DarkModeToggle from './DarkModeToggle';
import { FiGrid, FiUsers, FiEdit, FiSettings, FiMail, FiFileText, FiLogOut } from 'react-icons/fi';

// Importa los nuevos estilos para la sidebar moderna
import './ModernSidebar.css';

const ModernSidebar = () => {
    const { userRole, logout } = useAuth();
    const { customTabs } = useGlobalContext();

    return (
        <aside className="modern-sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">E³</div>
                <h1 className="logo-text">Eva3</h1>
            </div>
            <nav className="sidebar-nav">
                <p className="nav-section-title">Herramientas</p>
                <NavLink to="/dashboard" end><FiGrid /><span>Dashboard</span></NavLink>
                <NavLink to="/dashboard/team"><FiUsers /><span>Mi Equipo</span></NavLink>
                <NavLink to="/dashboard/correos"><FiMail /><span>Correos y Casos</span></NavLink>
                
                {userRole === 'admin' && (
                    <NavLink to="/dashboard/reportes-de-area"><FiFileText /><span>Reportes de Área</span></NavLink>
                )}

                {customTabs.length > 0 && (
                    <>
                        <p className="nav-section-title">Pestañas Personalizadas</p>
                        {customTabs.map(tab => (
                            <NavLink key={tab.id} to={`/dashboard/tabs/${tab.id}`}><FiEdit /><span>{tab.name}</span></NavLink>
                        ))}
                    </>
                )}
            </nav>
            <div className="sidebar-footer">
                <p className="nav-section-title">Configuración</p>
                {userRole === 'admin' && (
                    <>
                        <NavLink to="/dashboard/evaluate"><FiEdit /><span>Evaluar</span></NavLink>
                        <NavLink to="/dashboard/configuration"><FiSettings /><span>Configuración</span></NavLink>
                    </>
                )}
                <div className="divider"></div>
                <DarkModeToggle />
                <button onClick={logout} className="logout-button">
                    <FiLogOut />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default ModernSidebar;
