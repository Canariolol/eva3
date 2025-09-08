import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FiGrid, FiUsers, FiEdit, FiSettings, FiChevronsLeft, FiChevronsRight, FiMail, FiFileText } from 'react-icons/fi';

import Header from '../components/Header';
import Footer from '../components/Footer';
import DarkModeToggle from '../components/DarkModeToggle';

const ClassicLayout = () => {
    const { customTabs } = useGlobalContext();
    const { userRole } = useAuth(); // Obtenemos el nuevo rol del AuthContext
    const location = useLocation();
    const projectId = db.app.options.projectId;
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebarCollapse = () => setSidebarCollapsed(!isSidebarCollapsed);

    return (
        <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {import.meta.env.DEV && (
                <div style={{ position: 'fixed', top: '10px', right: '20px', backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', borderRadius: '5px', fontSize: '14px', zIndex: 9999 }}>
                    Conectado a: <strong>{projectId}</strong>
                </div>
            )}
            <nav className={`sidebar open`}>
                <div className="sidebar-header">
                    <h3>Eva3</h3>
                    <span>Evaluaciones, Calidad y Monitoreo</span>
                </div>
                <ul className="nav-list">
                    <li><NavLink to="/dashboard" end><FiGrid /><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/dashboard/team"><FiUsers /><span>Equipo</span></NavLink></li>
                    <li><NavLink to="/dashboard/correos"><FiMail /><span>Correos & Casos</span></NavLink></li>
                    
                    {/* --- CAMBIO DE LÓGICA DE ROL --- */}
                    {userRole === 'superadmin' && (
                        <li><NavLink to="/dashboard/reportes-de-area"><FiFileText /><span>Reportes de Área</span></NavLink></li>
                    )}
                    
                    {customTabs.map(tab => (
                        <li key={tab.id}><NavLink to={`/dashboard/tabs/${tab.id}`}><FiEdit /><span>{tab.name}</span></NavLink></li>
                    ))}

                    {/* --- CAMBIO DE LÓGICA DE ROL --- */}
                    {userRole === 'superadmin' && (
                        <>
                            <li><NavLink to="/dashboard/evaluate"><FiEdit /><span>Evaluar</span></NavLink></li>
                            <li><NavLink to="/dashboard/configuration"><FiSettings /><span>Configuración</span></NavLink></li>
                        </>
                    )}
                </ul>
                 <div className="sidebar-footer">
                    <DarkModeToggle />
                    <button onClick={toggleSidebarCollapse} className="sidebar-collapse-toggle">
                        {isSidebarCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
                    </button>
                </div>
            </nav>
            <div className="main-panel">
                <Header />
                <main className="main-content">
                    <TransitionGroup component={null}>
                        <CSSTransition key={location.pathname} classNames="page-fade" timeout={300}>
                            <div className="page-container"><Outlet /></div>
                        </CSSTransition>
                    </TransitionGroup>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ClassicLayout;
