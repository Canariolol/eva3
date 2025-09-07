import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';

// Layouts
import ClassicLayout from './layouts/ClassicLayout'; 
import ModernLayout from './layouts/ModernLayout'; // Ahora se usará

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

// Styles
import './App.css';
import './styles/dark-mode.css';

const AppLayoutController = () => {
    const { uiPreset, loading: globalLoading, error } = useGlobalContext();
    const { loading: authLoading } = useAuth();

    if (authLoading || globalLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }
    
    // Ahora esta lógica está activa
    if (uiPreset === 'modern') {
        return <ModernLayout />;
    }

    return <ClassicLayout />;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <AppLayoutController />
                    </ProtectedRoute>
                }
            >
                {/* Las rutas anidadas son renderizadas por el <Outlet /> en cada layout */}
                <Route index element={<Dashboard />} />
                <Route path="team" element={<Team />} />
                <Route path="correos" element={<CorreosYCasos />} />
                <Route path="tabs/:tabId" element={<CustomTab />} />
                <Route path="reportes-de-area" element={<ProtectedRoute allowedRoles={['admin']}><ReportesDeArea /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['admin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['admin']}><Configuration /></ProtectedRoute>} />
            </Route>
            
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
