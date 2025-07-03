import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Muestra un loader mientras se determina el rol
        return <div>Cargando...</div>;
    }

    if (!userRole) {
        // Si no hay rol (o no está logueado), redirigir a login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Si el rol del usuario no está permitido, redirigir
        // Podrías tener una página de "No Autorizado" o simplemente redirigir al inicio.
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
