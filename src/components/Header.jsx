import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import { getAllCompanies } from '../firebase'; // Importamos la nueva función
import Login from './Login';
import './Header.css';

const Header = () => {
    const { headerInfo, setSelectedCompanyId } = useGlobalContext();
    const { currentUser, logout, userRole } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // --- ESTADOS PARA SUPERADMIN ---
    const [companies, setCompanies] = useState([]);
    const [currentCompanyId, setCurrentCompanyId] = useState('');

    useEffect(() => {
        // Si el usuario es superadmin, cargamos la lista de compañías
        if (userRole === 'superadmin') {
            const fetchCompanies = async () => {
                const companyList = await getAllCompanies();
                setCompanies(companyList);
                // Opcional: seleccionar la primera compañía por defecto
                if (companyList.length > 0) {
                    setCurrentCompanyId(companyList[0].id);
                    setSelectedCompanyId(companyList[0].id);
                }
            };
            fetchCompanies();
        }
    }, [userRole, setSelectedCompanyId]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    };

    const handleCompanyChange = (e) => {
        const newCompanyId = e.target.value;
        setCurrentCompanyId(newCompanyId);
        setSelectedCompanyId(newCompanyId); // Actualizamos el contexto global
    };

    return (
        <>
            <header className="app-header">
                <div className="header-info">
                    {userRole === 'superadmin' ? (
                        <>
                            <h1 className="area-name">Bienvenido, Superadmin</h1>
                            <div className="company-selector">
                                <label htmlFor="company-select">Viendo datos de:</label>
                                <select id="company-select" value={currentCompanyId} onChange={handleCompanyChange}>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.headerInfo?.company || company.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="company-name">{headerInfo.company}</p>
                            <h1 className="area-name">{headerInfo.area}</h1>
                            <p className="manager-name">Encargad@: {headerInfo.manager}</p>
                        </>
                    )}
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
