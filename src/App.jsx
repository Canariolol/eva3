import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { FiGrid, FiUsers, FiEdit, FiSettings, FiChevronsLeft, FiChevronsRight, FiMail, FiFileText } from 'react-icons/fi';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
import CorreosYCasos from './pages/CorreosYCasos';
import ReportesDeArea from './pages/ReportesDeArea';
import Login from './pages/Login'; 
import SignUp from './pages/SignUp';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import Header from './components/Header';
import DarkModeToggle from './components/DarkModeToggle';

// Styles
import './App.css';
import './styles/dark-mode.css';
import './components/Header.css';


const AppLayout = () => {
    const { loading: globalLoading, error, customTabs } = useGlobalContext();
    const { userRole, loading: authLoading } = useAuth();
    const location = useLocation();
    const projectId = db.app.options.projectId;
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebarCollapse = () => setSidebarCollapsed(!isSidebarCollapsed);

    if (globalLoading || authLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }
    
    // Rename to avoid conflict with Route's element prop
    const oldDashboard = <Dashboard />;

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
                    
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to="/dashboard/reportes-de-area"><FiFileText /><span>Reportes de Área</span></NavLink></li>
                        </>
                    )}
                    
                    {customTabs.map(tab => (
                        <li key={tab.id}><NavLink to={`/dashboard/tabs/${tab.id}`}><FiEdit /><span>{tab.name}</span></NavLink></li>
                    ))}
                    {userRole === 'admin' && (
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

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected Dashboard Routes */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="team" element={<Team />} />
                <Route path="correos" element={<CorreosYCasos />} />
                <Route path="tabs/:tabId" element={<CustomTab />} />
                <Route path="reportes-de-area" element={<ProtectedRoute allowedRoles={['admin']}><ReportesDeArea /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['admin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['admin']}><Configuration /></ProtectedRoute>} />
            </Route>
            
            {/* Redirect legacy /app routes to /dashboard */}
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;