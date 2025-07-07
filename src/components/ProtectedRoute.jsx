import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Muestra un loader mientras se determina el rol
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h1>Cargando...</h1></div>;
    }

    // Si no hay usuario, redirige a la página de login
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // Si el rol del usuario no está en la lista de roles permitidos, redirigir a la página principal
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
