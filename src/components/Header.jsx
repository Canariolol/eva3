import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Header.css';

const Header = () => {
    const [headerInfo, setHeaderInfo] = useState({ company: '', area: '', manager: '' });

    useEffect(() => {
        const fetchHeaderInfo = async () => {
            const querySnapshot = await getDocs(collection(db, 'headerInfo'));
            if (!querySnapshot.empty) {
                setHeaderInfo(querySnapshot.docs[0].data());
            }
        };
        fetchHeaderInfo();
    }, []);

    return (
        <header className="app-header">
            <p className="company-name">{headerInfo.company}</p>
            <h1 className="area-name">{headerInfo.area}</h1>
            <p className="manager-name">Encargad@: {headerInfo.manager}</p>
        </header>
    );
};

export default Header;
