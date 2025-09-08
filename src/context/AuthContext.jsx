import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- NUEVOS ESTADOS PARA ROLES Y COMPANY ID ---
    const [userRole, setUserRole] = useState(null);
    const [companyId, setCompanyId] = useState(null);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    // Obtenemos el token y sus claims
                    const tokenResult = await user.getIdTokenResult(true); // true fuerza la actualización
                    const claims = tokenResult.claims;
                    
                    // Asignamos los claims a nuestros estados
                    setUserRole(claims.role || null);
                    setCompanyId(claims.companyId || null);

                } catch (error) {
                    console.error("Error fetching custom claims:", error);
                    setUserRole(null);
                    setCompanyId(null);
                }
            } else {
                // Si no hay usuario, reseteamos los estados
                setUserRole(null);
                setCompanyId(null);
            }
            
            setLoading(false);
        });
        
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole, // <-- Se expone el rol
        companyId, // <-- Se expone el companyId
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
