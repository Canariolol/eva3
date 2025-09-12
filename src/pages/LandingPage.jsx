import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

        // --- Estados para el formulario de contacto ---
        const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
        const [isSending, setIsSending] = useState(false);
        const [formResponse, setFormResponse] = useState({ type: '', message: '' });
    
        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setContactForm(prev => ({ ...prev, [name]: value }));
        };
    

    

    // --- Navigation & Action Handlers ---
    const showLogin = () => navigate('/login');
    const showRegister = () => navigate('/signup');

    const handleContactForm = async (event) => {
        event.preventDefault();
        setIsSending(true);
        setFormResponse({ type: '', message: '' });

        try {
            // Asegúrate de que esta URL coincida con la de tu Cloud Function
            const response = await fetch('https://southamerica-west1-eva3-1b284.cloudfunctions.net/gmail_api_handler/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al enviar el mensaje.');
            }

            setFormResponse({ type: 'success', message: '¡Mensaje enviado con éxito! Gracias por contactarnos.' });
            setContactForm({ name: '', email: '', company: '', message: '' }); // Limpia el formulario

        } catch (error) {
            setFormResponse({ type: 'error', message: error.message });
        } finally {
            setIsSending(false);
        }
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
                                <h1 className="text-2xl font-bold text-primary">Eva3</h1>
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
                               <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Evaluaciones 360°</li>
                               <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Matriz de competencias</li>
                               <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Planes de desarrollo</li>
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
                                <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Reportes automatizados</li>
                                <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Insights con IA</li>
                                <li className="flex items-center text-gray-600"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Exportación múltiple</li>
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
                        <div className="text-center">
                            <div className="relative mb-8">
                                <div className="bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-sm">
                                    <div className="bg-blue-50 rounded-lg h-40 flex items-center justify-center border-2 border-dashed border-blue-200">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="text-white font-bold text-lg">1</span>
                                            </div>
                                            <p className="text-blue-600 font-medium text-sm">Configuración Inicial</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Configura tu Equipo</h3>
                            <p className="text-gray-600">Agrega a los miembros de tu equipo y define roles, responsabilidades y objetivos específicos.</p>
                        </div>
                        <div className="text-center">
                            <div className="relative mb-8">
                                <div className="bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-sm">
                                    <div className="bg-green-50 rounded-lg h-40 flex items-center justify-center border-2 border-dashed border-green-200">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="text-white font-bold text-lg">2</span>
                                            </div>
                                            <p className="text-green-600 font-medium text-sm">Monitoreo Activo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Monitorea el Progreso</h3>
                            <p className="text-gray-600">Observa en tiempo real el rendimiento, colaboración y productividad de cada miembro del equipo.</p>
                        </div>
                        <div className="text-center">
                            <div className="relative mb-8">
                                <div className="bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-sm">
                                    <div className="bg-amber-50 rounded-lg h-40 flex items-center justify-center border-2 border-dashed border-amber-200">
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <span className="text-white font-bold text-lg">3</span>
                                            </div>
                                            <p className="text-amber-600 font-medium text-sm">Optimización</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Optimiza Resultados</h3>
                            <p className="text-gray-600">Recibe insights y recomendaciones para mejorar continuamente el rendimiento del equipo.</p>
                        </div>
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
                        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary transition-colors">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Básico</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-primary">$29</span>
                                <span className="text-gray-600">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Hasta 10 miembros</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Reportes básicos</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Soporte por email</li>
                            </ul>
                            <button onClick={() => selectPlan('basico')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold transition-colors">Comenzar</button>
                        </div>
                        <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-primary relative transform scale-105">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">Más Popular</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Profesional</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-primary">$79</span>
                                <span className="text-gray-600">/mes</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Hasta 50 miembros</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Análisis avanzado</li>
                                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin
                ="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Integraciones</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Soporte prioritario</li>
                </ul>
                <button onClick={() => selectPlan('profesional')} className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg font-semibold transition-colors">Comenzar</button>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-primary transition-colors">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                <div className="mb-6">
                <span className="text-4xl font-bold text-primary">$199</span>
                <span className="text-gray-600">/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Miembros ilimitados</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>IA personalizada</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>API completa</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Soporte 24/7</li>
                </ul>
                <button onClick={() => selectPlan('enterprise')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold transition-colors">Contactar</button>
                </div>
                </div>
                </div>
                </section>

                {/* About Section */}
                <section id="nosotros" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Sobre TeamInsight</h2>
                <p className="text-lg text-gray-600 mb-6">
                Somos una empresa dedicada a revolucionar la forma en que las organizaciones gestionan y optimizan el rendimiento de sus equipos de trabajo.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                Con más de 5 años de experiencia en el sector, hemos ayudado a cientos de empresas a mejorar su productividad, comunicación y resultados a través de nuestras herramientas inteligentes de monitoreo y evaluación.
                </p>
                <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-primary mb-2">500+</div>
                    <div className="text-gray-600">Empresas Confían</div>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-3xl font-bold text-primary mb-2">50K+</div>
                    <div className="text-gray-600">Usuarios Activos</div>
                </div>
                </div>
                <button onClick={showRegister} className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Únete a Nosotros
                </button>
                </div>
                <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-blue-200">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <p className="text-blue-600 font-medium">Nuestro Equipo</p>
                        <p className="text-blue-500 text-sm">Foto del equipo de trabajo</p>
                    </div>
                </div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary rounded-full opacity-10"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent rounded-full opacity-10"></div>
                </div>
                </div>
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
                <div className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4 border-2 border-dashed border-gray-300">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">María González</h4>
                    <p className="text-gray-600 text-sm">CEO, TechCorp</p>
                </div>
                </div>
                <p className="text-gray-600 italic">"TeamInsight transformó completamente la forma en que gestionamos nuestros equipos. La productividad aumentó un 40% en solo 3 meses."</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4 border-2 border-dashed border-gray-300">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">Carlos Ruiz</h4>
                    <p className="text-gray-600 text-sm">Director de RRHH, InnovaCorp</p>
                </div>
                </div>
                <p className="text-gray-600 italic">"Los reportes inteligentes nos ayudan a tomar decisiones basadas en datos reales. Es una herramienta indispensable."</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-8">
                <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4 border-2 border-dashed border-gray-300">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">Ana Martínez</h4>
                    <p className="text-gray-600 text-sm">Gerente de Proyectos, StartupXYZ</p>
                </div>
                </div>
                <p className="text-gray-600 italic">"La facilidad de uso y la potencia de las herramientas de análisis superaron nuestras expectativas. Altamente recomendado."</p>
                </div>
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
                <div>
                <div className="space-y-8">
                <div className="flex items-start">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                        <p className="text-gray-600">contacto@teaminsight.com</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Teléfono</h3>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oficina</h3>
                        <p className="text-gray-600">123 Business Ave, Suite 100<br/>Ciudad, País 12345</p>
                    </div>
                </div>
                </div>
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="bg-gray-50 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-gray-200">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        <p className="text-gray-500 font-medium">Nuestra Oficina</p>
                        <p className="text-gray-400 text-sm">Foto del edificio/oficina</p>
                    </div>
                </div>
                </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-8">
                    {formResponse.message && (
                        <div className={`rounded-lg p-4 mb-6 ${formResponse.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'}`}>
                            <p>{formResponse.message}</p>
                        </div>
                    )}
                    <form onSubmit={handleContactForm}>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                <input type="text" name="name" value={contactForm.name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" name="email" value={contactForm.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                            <input type="text" name="company" value={contactForm.company} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                            <textarea rows="4" name="message" value={contactForm.message} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                        </div>
                        <button type="submit" disabled={isSending} className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400">
                            {isSending ? 'Enviando...' : 'Enviar Mensaje'}
                        </button>
                    </form>
                </div>
                </div>
                </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8">
                <div>
                <h3 className="text-2xl font-bold mb-4">TeamInsight</h3>
                <p className="text-gray-400 mb-4">Potenciando equipos de trabajo con tecnología inteligente.</p>
                <div className="w-24 h-12 bg-gray-700 rounded flex items-center justify-center border border-dashed border-gray-600">
                <span className="text-gray-500 text-xs">Logo</span>
                </div>
                </div>
                <div>
                <h4 className="text-lg font-semibold mb-4">Producto</h4>
                <ul className="space-y-2 text-gray-400">
                <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#planes" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integraciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                </ul>
                </div>
                <div>
                <h4 className="text-lg font-semibold mb-4">Empresa</h4>
                <ul className="space-y-2 text-gray-400">
                <li><a href="#nosotros" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prensa</a></li>
                </ul>
                </div>
                <div>
                <h4 className="text-lg font-semibold mb-4">Soporte</h4>
                <ul className="space-y-2 text-gray-400">
                <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Estado del Sistema</a></li>
                </ul>
                </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 TeamInsight. Todos los derechos reservados.</p>
                </div>
                </div>
                </footer>
                </div>
                );
                };

                export default LandingPage;
