import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalContext } from '../context/GlobalContext';
import { getAllCompanies } from '../firebase';
import Login from './Login';
import './Header.css';

const Header = () => {
    // 1. Obtenemos los nuevos estados y funciones del GlobalContext
    const { 
        headerInfo, 
        setSelectedCompanyId,
        availableWorkgroups, 
        selectedWorkgroupId, 
        setSelectedWorkgroupId 
    } = useGlobalContext();

    const { currentUser, logout, userRole } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // Estados para Superadmin
    const [companies, setCompanies] = useState([]);
    const [currentCompanyId, setCurrentCompanyId] = useState('');

    useEffect(() => {
        if (userRole === 'superadmin') {
            const fetchCompanies = async () => {
                const companyList = await getAllCompanies();
                setCompanies(companyList);
                if (companyList.length > 0) {
                    const firstCompanyId = companyList[0].id;
                    setCurrentCompanyId(firstCompanyId);
                    setSelectedCompanyId(firstCompanyId); // Esto disparará el efecto en GlobalContext para buscar workgroups
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
        setSelectedCompanyId(newCompanyId);
        // El workgroup se seleccionará automáticamente por defecto en el GlobalContext
    };

    // 3. Nueva función para manejar el cambio de workgroup
    const handleWorkgroupChange = (e) => {
        const newWorkgroupId = e.target.value;
        setSelectedWorkgroupId(newWorkgroupId);
    };

    return (
        <>
            <header className="app-header">
                <div className="header-info">
                    {userRole === 'superadmin' ? (
                        <>
                            <h1 className="area-name">Bienvenido, Superadmin</h1>
                            <div className="company-selector-group">
                                <div className="company-selector">
                                    <label htmlFor="company-select">Compañía:</label>
                                    <select id="company-select" value={currentCompanyId} onChange={handleCompanyChange}>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.headerInfo?.company || company.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* 2. Renderizado condicional del nuevo desplegable de Workgroups */}
                                {availableWorkgroups.length > 0 && (
                                    <div className="company-selector">
                                        <label htmlFor="workgroup-select">Grupo de Trabajo:</label>
                                        <select id="workgroup-select" value={selectedWorkgroupId || ''} onChange={handleWorkgroupChange}>
                                            {availableWorkgroups.map(wg => (
                                                <option key={wg.id} value={wg.id}>
                                                    {wg.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
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
