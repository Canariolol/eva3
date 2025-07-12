import React, { useState } from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FiGrid, FiUsers, FiEdit, FiSettings, FiChevronsLeft, FiChevronsRight, FiMail } from 'react-icons/fi'; // Importar íconos

import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
import CorreosYCasos from './pages/CorreosYCasos'; // <-- Importar la nueva página
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';
import Footer from './components/Footer';
import Header from './components/Header';
import './components/Header.css';

const AppLayout = () => {
    const { loading: globalLoading, error, customTabs } = useGlobalContext();
    const { userRole, loading: authLoading, currentUser } = useAuth();
    const location = useLocation();
    const projectId = db.app.options.projectId;
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // Estado para colapsar

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };
    
    const toggleSidebarCollapse = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
    };

    if (globalLoading || authLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }

    return (
        <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {import.meta.env.DEV && (
                <div style={{ position: 'fixed', top: '10px', right: '20px', backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', borderRadius: '5px', fontSize: '14px', zIndex: 9999 }}>
                    Conectado a: <strong>{projectId}</strong>
                </div>
            )}
             <button className="sidebar-toggle" onClick={toggleSidebar}>
                ☰
            </button>
            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Eva3</h3>
                    <span>Evaluaciones, Calidad y Monitoreo</span>
                </div>
                <ul className="nav-list">
                    <li><NavLink to="/" end><FiGrid /><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/team"><FiUsers /><span>Equipo</span></NavLink></li>
                    {/* Nueva pestaña de Correos y Casos */}
                    <li><NavLink to="/correos"><FiMail /><span>Correos & Casos</span></NavLink></li>
                    
                    {customTabs.map(tab => (
                        <li key={tab.id}><NavLink to={`/tabs/${tab.id}`}><FiEdit /><span>{tab.name}</span></NavLink></li>
                    ))}
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to="/evaluate"><FiEdit /><span>Evaluar</span></NavLink></li>
                            <li><NavLink to="/configuration"><FiSettings /><span>Configuración</span></NavLink></li>
                        </>
                    )}
                </ul>
                <button onClick={toggleSidebarCollapse} className="sidebar-collapse-toggle">
                    {isSidebarCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
                </button>
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

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AppLayout />}>
                {/* Public Routes */}
                <Route index element={<Dashboard />} />
                <Route path="team" element={<Team />} />

                {/* Protected Routes */}
                <Route path="correos" element={<ProtectedRoute allowedRoles={['admin', 'executive']}><CorreosYCasos /></ProtectedRoute>} />
                <Route path="tabs/:tabId" element={<ProtectedRoute allowedRoles={['admin', 'executive']}><CustomTab /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['admin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['admin']}><Configuration /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default App;
