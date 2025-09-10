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
    
    // Estados para los custom claims del usuario
    const [userRole, setUserRole] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [workgroupId, setWorkgroupId] = useState(null);

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
                    const idTokenResult = await user.getIdTokenResult();
                    const claims = idTokenResult.claims;
                    
                    // Seteamos los estados con los valores de los claims
                    setUserRole(claims.role || null);
                    setCompanyId(claims.companyId || null);
                    setWorkgroupId(claims.workgroupId || null);

                } catch (error) {
                    console.error("Error fetching user claims:", error);
                    // Limpiamos en caso de error
                    setUserRole(null);
                    setCompanyId(null);
                    setWorkgroupId(null);
                }
            } else {
                // Si no hay usuario, reseteamos los estados
                setUserRole(null);
                setCompanyId(null);
                setWorkgroupId(null);
            }
            
            setLoading(false);
        });
        
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        companyId,
        workgroupId,
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
