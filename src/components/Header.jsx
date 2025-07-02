import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import Login from './Login';
import './Header.css';

const Header = () => {
    const { headerInfo } = useGlobalContext();
    const { currentUser, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    };

    return (
        <>
            <header className="app-header">
                <div className="header-info">
                    <p className="company-name">{headerInfo.company}</p>
                    <h1 className="area-name">{headerInfo.area}</h1>
                    <p className="manager-name">Encargad@: {headerInfo.manager}</p>
                </div>
                <div className="auth-controls">
                    {currentUser ? (
                        <>
                            <span className="user-email">{currentUser.email}</span>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Cerrar Sesión
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary">
                            Identifícate
                        </button>
                    )}
                </div>
            </header>

            {isLoginModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{maxWidth: '450px'}}>
                        <button onClick={() => setIsLoginModalOpen(false)} className="modal-close-btn">&times;</button>
                        <Login onClose={() => setIsLoginModalOpen(false)} />
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
