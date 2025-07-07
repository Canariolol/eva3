import React, { useState } from 'react';
import { Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
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

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    if (globalLoading || authLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }

    return (
        <div className="app-layout">
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
                    {/* Public links */}
                    <li><NavLink to="/" end>Dashboard</NavLink></li>
                    <li><NavLink to="/team">Equipo</NavLink></li>
                    
                    {/* Protected links */}
                    {customTabs.map(tab => (
                        <li key={tab.id}><NavLink to={`/tabs/${tab.id}`}>{tab.name}</NavLink></li>
                    ))}
                    {userRole === 'admin' && (
                        <>
                            <li><NavLink to="/evaluate">Evaluar</NavLink></li>
                            <li><NavLink to="/configuration">Configuración</NavLink></li>
                        </>
                    )}
                </ul>
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
                <Route path="tabs/:tabId" element={<ProtectedRoute allowedRoles={['admin', 'executive']}><CustomTab /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['admin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['admin']}><Configuration /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default App;
