import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    // --- Navigation & Action Handlers ---
    const showLogin = () => navigate('/login');
    const showRegister = () => navigate('/signup');

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
    
    // --- Side Effect for Smooth Scrolling ---
    useEffect(() => {
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

        // Cleanup function to remove event listeners
        return () => {
            anchors.forEach(anchor => {
                anchor.removeEventListener('click', handleClick);
            });
        };
    }, []);

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
            <section id="inicio" className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
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
                        <div className="relative mt-10 lg:mt-0">
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
                    {/* Feature content from original HTML */}
                </div>
            </section>
            
            {/* How it Works Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* How it works content from original HTML */}
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
                        {/* Pricing plans content */}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="nosotros" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* About section content */}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Lo que Dicen Nuestros Clientes</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Empresas de todo el mundo confían en TeamInsight</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                       {/* Testimonials content */}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contacto" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contáctanos</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">¿Tienes preguntas? Estamos aquí para ayudarte</p>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact section content */}
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                   {/* Footer content */}
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
