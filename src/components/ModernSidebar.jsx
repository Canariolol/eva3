import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    BarChart3, Users, ClipboardCheck, Wrench, FileText, 
    Contact, Bell, Settings, LogOut 
} from 'lucide-react';

import './ModernSidebar.css';

const ModernSidebar = () => {
    const { userRole, logout } = useAuth();

    // Roles que pueden ver el enlace de Configuración
    const canViewConfiguration = ['superadmin', 'manager'];

    return (
        <aside className="modern-sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">E³</div>
                    <div className="logo-text-container">
                        <h1 className="logo-text">Eva3</h1>
                        <p className="logo-subtext">Evaluación de Equipos</p>
                    </div>
                </div>
            </div>
            
            <nav className="sidebar-nav">
                <NavItem to="/dashboard" icon={<BarChart3 />} label="Dashboard" />
                <NavItem to="/dashboard/team" icon={<Users />} label="Equipo" />
                <NavItem to="/dashboard/evaluate" icon={<ClipboardCheck />} label="Evaluar" />
                <NavItem to="/dashboard/herramientas" icon={<Wrench />} label="Herramientas" />
                <NavItem to="/dashboard/reportes-de-area" icon={<FileText />} label="Reportes" />
                <NavItem to="/dashboard/contactos" icon={<Contact />} label="Contactos" />
                <NavItem to="/dashboard/alertas" icon={<Bell />} alertCount={3} />
                
                {/* Renderizado condicional basado en el rol del usuario */}
                {canViewConfiguration.includes(userRole) && (
                    <NavItem to="/dashboard/configuration" icon={<Settings />} label="Configuración" />
                )}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="logout-button">
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

const NavItem = ({ to, icon, label, alertCount }) => (
    <NavLink to={to} end className="nav-item">
        <div className="nav-item-icon">{icon}</div>
        <span className="nav-item-label">{label}</span>
        {alertCount > 0 && (
            <span className="nav-item-alert">{alertCount}</span>
        )}
    </NavLink>
);

export default ModernSidebar;
