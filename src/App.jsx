import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGlobalContext } from './context/GlobalContext';
import { useAuth } from './context/AuthContext';

// Componentes y Páginas
import ClassicLayout from './layouts/ClassicLayout'; 
import ModernLayout from './layouts/ModernLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import Team from './pages/Team';
import Evaluate from './pages/Evaluate';
import Configuration from './pages/Configuration';
import CustomTab from './pages/CustomTab';
import CorreosYCasos from './pages/CorreosYCasos';
import ReportesDeArea from './pages/ReportesDeArea';
import Alertas from './pages/Alertas';
import Contactos from './pages/Contactos';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingWizard from './components/OnboardingWizard'; // <-- IMPORTAMOS EL WIZARD

// Estilos
import './App.css';
import './styles/dark-mode.css';

const AppLayoutController = () => {
    const { uiPreset, loading: globalLoading, error, showOnboarding, setShowOnboarding } = useGlobalContext();
    const { currentUser, loading: authLoading } = useAuth();

    if (authLoading || globalLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando aplicación...</h1></div>;
    }

    if (error) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>{error}</h1></div>;
    }

    // Lógica para mostrar el Wizard
    if (showOnboarding) {
        return <OnboardingWizard user={currentUser} onFinish={() => setShowOnboarding(false)} />;
    }
    
    // Si no se muestra el wizard, renderiza el layout normal
    return uiPreset === 'modern' ? <ModernLayout /> : <ClassicLayout />;
};

const DashboardController = () => {
    const { uiPreset } = useGlobalContext();
    return uiPreset === 'modern' ? <ModernDashboard /> : <Dashboard />;
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
                <Route index element={<DashboardController />} />
                <Route path="team" element={<Team />} />
                <Route path="correos" element={<CorreosYCasos />} />
                <Route path="tabs/:tabId" element={<CustomTab />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="contactos" element={<Contactos />} />
                <Route path="reportes-de-area" element={<ProtectedRoute allowedRoles={['superadmin']}><ReportesDeArea /></ProtectedRoute>} />
                <Route path="evaluate" element={<ProtectedRoute allowedRoles={['superadmin']}><Evaluate /></ProtectedRoute>} />
                <Route path="configuration" element={<ProtectedRoute allowedRoles={['superadmin']}><Configuration /></ProtectedRoute>} />
            </Route>
            
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
