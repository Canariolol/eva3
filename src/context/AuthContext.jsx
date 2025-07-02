import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Importar la instancia de auth centralizada

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        // DEVELOPMENT-ONLY: Bypasses the login screen for a smoother dev experience.
        // This entire block is removed from the production build.
        if (import.meta.env.DEV) {
            console.warn("MODO DESARROLLO: Autenticación omitida. Acceso de administrador concedido.");
            setCurrentUser({ email: 'dev@eva3.app', isDev: true });
            setLoading(false);
            return; // Skips the real authentication listener
        }

        // Production authentication logic
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
