import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
// --- RUTAS CORREGIDAS ---
import ModernSidebar from '../components/ModernSidebar';
import ModernHeader from '../components/ModernHeader';
import Footer from '../components/Footer';
import { useGlobalContext } from '../context/GlobalContext';

// Importamos los nuevos estilos para el layout
import './ModernLayout.css';

const ModernLayout = () => {
    const location = useLocation();
    // --- ERROR DE SINTAXIS CORREGIDO ---
    const { darkMode } = useGlobalContext(); // Obtenemos el estado del modo oscuro

    // Agregamos la clase 'dark' al body para que los estilos globales funcionen
    React.useEffect(() => {
        document.body.classList.toggle('dark', darkMode);
    }, [darkMode]);

    return (
        // El div principal ahora controla el color de fondo base
        <div className={`modern-layout-container ${darkMode ? 'dark' : ''}`}>
            <ModernSidebar />
            <div className="content-panel">
                <ModernHeader />
                <main className="main-content-area">
                     <TransitionGroup component={null}>
                        <CSSTransition key={location.pathname} classNames="page-fade" timeout={300}>
                            <div className="page-container">
                                <Outlet />
                            </div>
                        </CSSTransition>
                    </TransitionGroup>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ModernLayout;
