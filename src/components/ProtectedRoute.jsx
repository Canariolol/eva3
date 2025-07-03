import React from 'react';
import { useAuth } from '../context/AuthContext'; // Corregido: apunto a la carpeta correcta
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // Si no hay usuario, redirige a la página de inicio.
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
