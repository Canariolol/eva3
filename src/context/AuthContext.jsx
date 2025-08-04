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
        if (import.meta.env.DEV) {
            // En desarrollo, simplemente reseteamos el estado para simular un logout
            setCurrentUser(null);
            setUserRole(null);
            setExecutiveData(null);
            console.log("Simulated logout in dev mode.");
            return Promise.resolve();
        }
        return signOut(auth);
    };

    useEffect(() => {
        // For development environment, bypass Firebase auth and set user as admin.
        if (import.meta.env.DEV) {
            console.log("Running in development mode. Simulating admin user.");
            setCurrentUser({ email: "admin@dev.com", uid: "dev-admin-uid" });
            setUserRole('admin');
            setExecutiveData(null);
            setLoading(false);
        } else {
            const unsubscribe = onAuthStateChanged(auth, user => {
                setCurrentUser(user);
            });
            return unsubscribe;
        }
    }, []);

    useEffect(() => {
        // This effect should not run in development mode as we've already set the user.
        if (import.meta.env.DEV) {
            return;
        }

        const determineRole = async () => {
            if (!currentUser) {
                setLoading(false);
                setUserRole(null);
                setExecutiveData(null);
                return;
            }

            setLoading(true);

            // 1. Check if user is an Admin
            const adminRef = doc(db, 'admins', currentUser.email);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                setUserRole('admin');
                setExecutiveData(null); // Admins are not executives
                setLoading(false);
                return;
            }

            // 2. If not an admin, check if user is an Executive
            if (executives.length > 0) {
                const matchingExecutive = executives.find(exec => 
                    exec.Email && exec.Email.toLowerCase() === currentUser.email.toLowerCase()
                );

                if (matchingExecutive) {
                    setUserRole('executive');
                    setExecutiveData(matchingExecutive);
                } else {
                    // 3. If not in any list, user has no role
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
