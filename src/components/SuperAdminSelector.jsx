import React, { useState, useEffect, useRef } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { getAllCompanies } from '../firebase';
import { ChevronDown } from 'lucide-react';
import './SuperAdminSelector.css';

const SuperAdminSelector = () => {
    const { 
        darkMode,
        selectedCompanyId, setSelectedCompanyId,
        availableWorkgroups, selectedWorkgroupId, setSelectedWorkgroupId 
    } = useGlobalContext();

    const [companies, setCompanies] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            const companyList = await getAllCompanies();
            setCompanies(companyList);
            if (companyList.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(companyList[0].id);
            }
        };
        fetchCompanies();
    }, [selectedCompanyId, setSelectedCompanyId]);

    // Hook para cerrar el menú al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleCompanySelect = (companyId) => {
        if (companyId !== selectedCompanyId) {
            setSelectedCompanyId(companyId);
        }
    };

    const handleWorkgroupSelect = (workgroupId) => {
        setSelectedWorkgroupId(workgroupId);
        setIsOpen(false); // Cierra el menú al seleccionar un workgroup
    };

    const getSelectedCompanyName = () => companies.find(c => c.id === selectedCompanyId)?.headerInfo?.company || 'Seleccionar';
    const getSelectedWorkgroupName = () => availableWorkgroups.find(wg => wg.id === selectedWorkgroupId)?.name || '...';

    return (
        <div className="super-admin-selector" ref={wrapperRef}>
            <button className={`selector-button ${darkMode ? 'dark' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span>{getSelectedCompanyName()} / <strong>{getSelectedWorkgroupName()}</strong></span>
                <ChevronDown size={16} />
            </button>
            {isOpen && (
                <div className={`selector-dropdown ${darkMode ? 'dark' : ''}`}>
                    <div className={`selector-header ${darkMode ? 'dark' : ''}`}>COMPAÑÍA</div>
                    {companies.map(company => (
                        <div key={company.id} onMouseEnter={() => handleCompanySelect(company.id)} className={`selector-item ${darkMode ? 'dark' : ''} ${company.id === selectedCompanyId ? 'active' : ''}`}>
                            {company.headerInfo?.company || company.id}
                        </div>
                    ))}
                    {availableWorkgroups.length > 0 && (
                        <>
                            <div className={`selector-header ${darkMode ? 'dark' : ''}`}>GRUPO DE TRABAJO</div>
                            {availableWorkgroups.map(wg => (
                                <div key={wg.id} onClick={() => handleWorkgroupSelect(wg.id)} className={`selector-item ${darkMode ? 'dark' : ''} ${wg.id === selectedWorkgroupId ? 'active' : ''}`}>
                                    {wg.name}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SuperAdminSelector;
