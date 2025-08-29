import React, { useState } from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FiGrid, FiUsers, FiEdit, FiSettings, FiChevronsLeft, FiChevronsRight, FiMail, FiFileText } from 'react-icons/fi';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
import CorreosYCasos from './pages/CorreosYCasos';
import ReportesDeArea from './pages/ReportesDeArea';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';
import './styles/dark-mode.css';
import Footer from './components/Footer';
import Header from './components/Header';
import './components/Header.css';
import DarkModeToggle from './components/DarkModeToggle';

const AppLayout = () => {
    const { loading: globalLoading, error, customTabs } = useGlobalContext();
    const { userRole, loading: authLoading } = useAuth();
    const location = useLocation();
    const projectId = db.app.options.projectId;
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const toggleSidebarCollapse = () => setSidebarCollapsed(!isSidebarCollapsed);

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
             <button className="sidebar-toggle" onClick={toggleSidebar}>☰</button>
            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Eva3</h3>
                    <span>Evaluaciones, Calidad y Monitoreo</span>
                </div>
                <ul className="nav-list">
                    <li><NavLink to="/app" end><FiGrid /><span>Dashboard</span></NavLink></li>
                    <li><NavLink to="/app/team"><FiUsers /><span>Equipo</span></NavLink></li>
                    <li><NavLink to="/app/correos"><FiMail /><span>Correos & Casos</span></NavLink></li>
                    
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to="/app/reportes-de-area"><FiFileText /><span>Reportes de Área</span></NavLink></li>
                        </>
                    )}
                    
                    {customTabs.map(tab => (
                        <li key={tab.id}><NavLink to={`/app/tabs/${tab.id}`}><FiEdit /><span>{tab.name}</span></NavLink></li>
                    ))}
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to="/app/evaluate"><FiEdit /><span>Evaluar</span></NavLink></li>
                            <li><NavLink to="/app/configuration"><FiSettings /><span>Configuración</span></NavLink></li>
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

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="team" element={<Team />} />
                <Route path="correos" element={<ProtectedRoute allowedRoles={['admin', 'executive']}><CorreosYCasos /></ProtectedRoute>} />
                <Route path="tabs/:tabId" element={<ProtectedRoute allowedRoles={['admin', 'executive']}><CustomTab /></ProtectedRoute>} />
                <Route path="reportes-de-area" element={<ProtectedRoute allowedRoles={['admin']}><ReportesDeArea /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['admin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['admin']}><Configuration /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default App;