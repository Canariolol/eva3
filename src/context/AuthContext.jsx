import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useGlobalContext } from './GlobalContext';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const { executives } = useGlobalContext();
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [executiveData, setExecutiveData] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const determineRole = async () => {
            if (!currentUser) {
                setLoading(false);
                setUserRole(null);
                setExecutiveData(null);
                return;
            }

            setLoading(true);

            // 1. Comprobar si es un Administrador
            const adminRef = doc(db, 'admins', currentUser.email);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                setUserRole('admin');
                setExecutiveData(null); // Los admins no son ejecutivos
                setLoading(false);
                return;
            }

            // 2. Si no es admin, comprobar si es un Ejecutivo
            if (executives.length > 0) {
                const matchingExecutive = executives.find(exec => 
                    exec.Email && exec.Email.toLowerCase() === currentUser.email.toLowerCase()
                );

                if (matchingExecutive) {
                    setUserRole('executive');
                    setExecutiveData(matchingExecutive);
                } else {
                    // 3. Si no está en ninguna lista, no tiene rol
                    setUserRole(null);
                    setExecutiveData(null);
                }
            }
            
            setLoading(false);
        };

        determineRole();
    }, [currentUser, executives]);

    const value = {
        currentUser,
        userRole,
        executiveData,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
