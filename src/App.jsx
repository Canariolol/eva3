import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';

// Layout
import ModernLayout from './layouts/ModernLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
import Herramientas from './pages/Herramientas';
import ReportesDeArea from './pages/ReportesDeArea';
import Alertas from './pages/Alertas';
import Contactos from './pages/Contactos';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingWizard from './components/OnboardingWizard';

// Styles
import './App.css';
import './styles/dark-mode.css';

const DashboardController = () => {
    const { dashboardType } = useGlobalContext();
    return dashboardType === 'modern' ? <ModernDashboard /> : <Dashboard />;
};

function App() {
    const { loading: globalLoading, error } = useGlobalContext();
    const { currentUser, loading: authLoading } = useAuth();
    
    if (authLoading || globalLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <ModernLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardController />} />
                <Route path="team" element={<Team />} />
                <Route path="herramientas" element={<Herramientas />} />
                <Route path="tabs/:tabId" element={<CustomTab />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="contactos" element={<Contactos />} />
                {/* 1. Rutas protegidas por rol específico */}
                <Route path="reportes-de-area" element={<ProtectedRoute allowedRoles={['superadmin']}><ReportesDeArea /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['superadmin']}><Evaluate /></ProtectedRoute>} />
                {/* 2. Ruta de configuración ahora solo para manager y superadmin */}
                <Route 
                    path="configuration" 
                    element={
                        <ProtectedRoute allowedRoles={['superadmin', 'manager']}>
                            <Configuration />
                        </ProtectedRoute>
                    } 
                />
            </Route>
            
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
