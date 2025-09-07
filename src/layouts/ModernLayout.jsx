import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ModernSidebar from '../components/ModernSidebar'; // Asumiendo que crearemos este componente
import Header from '../components/Header'; // Reutilizaremos el Header
import Footer from '../components/Footer'; // Reutilizaremos el Footer

// Importa los nuevos estilos para la UI moderna si son necesarios
// import './ModernLayout.css';

const ModernLayout = () => {
    const location = useLocation();

    return (
        <div className="modern-layout">
            <ModernSidebar />
            <div className="main-panel">
                <Header />
                <main className="main-content">
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
