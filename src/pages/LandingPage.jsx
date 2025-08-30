import React, { useState, useEffect, useRef } from 'react';

const LandingPage = () => {
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

    const loginModalRef = useRef();
    const registerModalRef = useRef();

    // --- Modal Logic ---
    const showLogin = () => setLoginModalOpen(true);
    const showRegister = () => setRegisterModalOpen(true);

    const closeLoginModal = () => setLoginModalOpen(false);
    const closeRegisterModal = () => setRegisterModalOpen(false);

    const switchToRegister = () => {
        closeLoginModal();
        showRegister();
    };

    const switchToLogin = () => {
        closeRegisterModal();
        showLogin();
    };

    // --- Form Handlers ---
    const handleLogin = (event) => {
        event.preventDefault();
        alert('¡Bienvenido! En la versión real serías redirigido a tu dashboard personalizado.');
        closeLoginModal();
    };

    const handleRegister = (event) => {
        event.preventDefault();
        alert('¡Cuenta creada exitosamente! En la versión real recibirías un email de confirmación.');
        closeRegisterModal();
    };

    const handleContactForm = (event) => {
        event.preventDefault();
        alert('¡Mensaje enviado! En la versión real recibirías una confirmación por email.');
        event.target.reset();
    };

    const selectPlan = (plan) => {
        alert(`Has seleccionado el plan ${plan}. En la versión real serías redirigido al proceso de pago.`);
    };

    const showDemo = () => {
        alert('¡Demo disponible! En la versión real podrías explorar una versión interactiva de la plataforma.');
    };
    
    // --- Side Effects (useEffect) ---
    useEffect(() => {
        // Smooth scrolling for navigation links
        const anchors = document.querySelectorAll('a[href^="#"]');
        const handleClick = (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        };

        anchors.forEach(anchor => {
            anchor.addEventListener('click', handleClick);
        });

        // Close modals when clicking outside
        const handleOutsideClick = (event) => {
            if (loginModalRef.current && !loginModalRef.current.contains(event.target)) {
                if (isLoginModalOpen) closeLoginModal();
            }
            if (registerModalRef.current && !registerModalRef.current.contains(event.target)) {
                if (isRegisterModalOpen) closeRegisterModal();
            }
        };
        
        // Using mousedown to catch the click before it bubbles up
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            anchors.forEach(anchor => {
                anchor.removeEventListener('click', handleClick);
            });
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isLoginModalOpen, isRegisterModalOpen]); // Rerun if modal state changes to avoid stale closures

    return (
        <div className="bg-gray-50 font-sans">
            {/* Navigation */}
            <nav className="bg-white shadow-lg fixed w-full z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <h1 className="text-2xl font-bold text-primary">TeamInsight</h1>
                            </div>
                            <div className="hidden md:block ml-10">
                                <div className="flex items-baseline space-x-8">
                                    <a href="#inicio" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Inicio</a>
                                    <a href="#caracteristicas" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Características</a>
                                    <a href="#planes" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Planes</a>
                                    <a href="#nosotros" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Sobre Nosotros</a>
                                    <a href="#contacto" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Contacto</a>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={showLogin} className="text-primary hover:text-secondary px-4 py-2 text-sm font-medium transition-colors">Iniciar Sesión</button>
                            <button onClick={showRegister} className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Registrarse</button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="inicio" className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                Potencia el Rendimiento de tu <span className="text-primary">Equipo</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Evalúa, controla y monitorea el desempeño de tus equipos de trabajo con herramientas inteligentes y análisis en tiempo real.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={showRegister} className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg">
                                    Comenzar Gratis
                                </button>
                                <button onClick={showDemo} className="bg-white hover:bg-gray-50 text-primary px-8 py-4 rounded-lg text-lg font-semibold border-2 border-primary transition-colors">
                                    Ver Demo
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <p className="text-gray-500 font-medium">Dashboard Principal</p>
                                        <p className="text-gray-400 text-sm">Imagen del dashboard con métricas</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary rounded-full opacity-20"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent rounded-full opacity-20"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="caracteristicas" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Características Principales</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Herramientas completas para optimizar el rendimiento de tu equipo</p>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                        <div>
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Análisis en Tiempo Real</h3>
                            <p className="text-lg text-gray-600 mb-6">
                                Monitorea el rendimiento de tu equipo con métricas actualizadas al instante. Visualiza datos de productividad, colaboración y eficiencia en dashboards interactivos.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Dashboards personalizables
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Alertas automáticas
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Métricas avanzadas
                                </li>
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg">
                                <div className="bg-white rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-blue-200">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <p className="text-blue-600 font-medium">Gráficos de Análisis</p>
                                        <p className="text-blue-500 text-sm">Métricas en tiempo real</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                        <div className="lg:order-2">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Evaluación de Equipos</h3>
                            <p className="text-lg text-gray-600 mb-6">
                                Herramientas avanzadas para evaluar competencias, productividad y colaboración. Identifica fortalezas y áreas de mejora en cada miembro del equipo.
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Evaluaciones 360°
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Matriz de competencias
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Planes de desarrollo
                                </li>
                            </ul>
                        </div>
                        <div className="lg:order-1 relative">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg">
                                <div className="bg-white rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-green-200">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <p className="text-green-600 font-medium">Sistema de Evaluación</p>
                                        <p className="text-green-500 text-sm">Competencias y habilidades</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Reportes Inteligentes</h3>
                            <p className="text-lg text-gray-600 mb-6">
                                Genera reportes automáticos con insights accionables. Obtén recomendaciones basadas en IA para mejorar el rendimiento del equipo.
                            </p>
                             <ul className="space-y-2">
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Reportes automatizados
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Insights con IA
                                </li>
                                <li className="flex items-center text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Exportación múltiple
                                </li>
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 shadow-lg">
                                <div className="bg-white rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-amber-200">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-amber-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <p className="text-amber-600 font-medium">Reportes Avanzados</p>
                                        <p className="text-amber-500 text-sm">Insights y recomendaciones</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* How it Works Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Cómo Funciona?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Implementa TeamInsight en 3 simples pasos</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1, 2, 3 */}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="planes" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planes que se Adaptan a Ti</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Elige el plan perfecto para tu organización</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Pricing Plans */}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="nosotros" className="py-20 bg-gray-50">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* About content */}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Testimonials content */}
                </div>
            </section>

            {/* Contact Section */}
            <section id="contacto" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Contact form */}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                   {/* Footer content */}
                </div>
            </footer>

            {/* Modals */}
            {isLoginModalOpen && (
                <div id="loginModal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div ref={loginModalRef} className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h3>
                            <button onClick={closeLoginModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">
                                <strong>Demo:</strong> Este formulario es solo para demostración. En la versión real te llevaría a tu dashboard personalizado.
                            </p>
                        </div>
                        <form onSubmit={handleLogin}>
                            {/* Form fields */}
                             <button type="submit" className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg font-semibold transition-colors mb-4">
                                Iniciar Sesión
                            </button>
                            <p className="text-center text-gray-600">
                                ¿No tienes cuenta? <button type="button" onClick={switchToRegister} className="text-primary hover:underline">Regístrate</button>
                            </p>
                        </form>
                    </div>
                </div>
            )}

            {isRegisterModalOpen && (
                 <div id="registerModal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div ref={registerModalRef} className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                        {/* Register Modal Content */}
                         <p className="text-center text-gray-600">
                            ¿Ya tienes cuenta? <button type="button" onClick={switchToLogin} className="text-primary hover:underline">Inicia sesión</button>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
