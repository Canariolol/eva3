import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Building, UserPlus, LayoutDashboard, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useGlobalContext } from '../context/GlobalContext';

const WizardStep = ({ step, title, children }) => (
    <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
        <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">{title}</h3>
        {children}
    </motion.div>
);

const OnboardingWizard = ({ onFinish }) => {
    const { currentUser, companyId } = useAuth();
    const { refreshData } = useGlobalContext();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // --- ESTADOS PARA EL PASO 2: AÑADIR EJECUTIVOS ---
    const [newExecutive, setNewExecutive] = useState({ Nombre: '', Cargo: '', Email: '' });
    const [addedExecutives, setAddedExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExecutive(prev => ({ ...prev, [name]: value }));
    };

    const handleAddExecutive = async (e) => {
        e.preventDefault();
        if (!newExecutive.Nombre || !newExecutive.Cargo || !newExecutive.Email) {
            setError("Por favor, completa todos los campos.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const executivesColRef = collection(db, 'companies', companyId, 'executives');
            await addDoc(executivesColRef, newExecutive);
            
            setAddedExecutives(prev => [...prev, newExecutive]);
            setNewExecutive({ Nombre: '', Cargo: '', Email: '' }); // Limpiar formulario
            
        } catch (err) {
            console.error("Error adding executive:", err);
            setError("No se pudo añadir el miembro. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            await refreshData(); // Actualiza el context con los nuevos ejecutivos
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
            >
                <div className="p-10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                            <Rocket className="text-white h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">¡Bienvenido, {currentUser?.displayName || 'Manager'}!</h2>
                        <p className="text-gray-600 dark:text-zinc-400 text-lg">Vamos a configurar tu espacio de trabajo.</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mb-10">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="px-10 pb-10 overflow-y-auto flex-grow">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <WizardStep key={1} step={1} title="Información de tu Organización">
                                <p className="text-gray-600 dark:text-zinc-400">Esta información la puedes cambiar más tarde en la sección de Configuración.</p>
                                {/* Formulario del paso 1... */}
                            </WizardStep>
                        )}
                        {currentStep === 2 && (
                            <WizardStep key={2} step={2} title="Añade tu Primer Miembro de Equipo">
                                <form onSubmit={handleAddExecutive} className="flex items-end gap-4 mb-6">
                                    <div className="flex-grow"><label className="label">Nombre</label><input type="text" name="Nombre" value={newExecutive.Nombre} onChange={handleInputChange} className="form-control" /></div>
                                    <div className="flex-grow"><label className="label">Cargo</label><input type="text" name="Cargo" value={newExecutive.Cargo} onChange={handleInputChange} className="form-control" /></div>
                                    <div className="flex-grow"><label className="label">Email</label><input type="email" name="Email" value={newExecutive.Email} onChange={handleInputChange} className="form-control" /></div>
                                    <button type="submit" className="btn btn-primary h-10" disabled={loading}>{loading ? '...' : <UserPlus size={20} />}</button>
                                </form>
                                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                                <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4 space-y-3">
                                    {addedExecutives.length === 0 ? (
                                        <p className="text-center text-gray-500 dark:text-zinc-400">Los miembros que añadas aparecerán aquí.</p>
                                    ) : (
                                        addedExecutives.map((exec, index) => (
                                            <div key={index} className="flex justify-between items-center bg-white dark:bg-zinc-600 p-3 rounded">
                                                <div>
                                                    <p className="font-semibold">{exec.Nombre}</p>
                                                    <p className="text-sm text-gray-500 dark:text-zinc-300">{exec.Cargo}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-zinc-300">{exec.Email}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </WizardStep>
                        )}
                        {currentStep === 3 && (
                             <WizardStep key={3} step={3} title="¡Todo Listo!">
                                <div className="text-center p-8">
                                    <LayoutDashboard className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                    <p className="text-lg text-gray-600 dark:text-zinc-400">Tu dashboard está listo para ser explorado. ¡Comienza a evaluar y a potenciar a tu equipo!</p>
                                </div>
                            </WizardStep>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="flex justify-between mt-auto p-10 border-t border-gray-200 dark:border-zinc-700">
                    <button onClick={handlePrev} className={`btn btn-secondary ${currentStep === 1 ? 'invisible' : ''}`}>Anterior</button>
                    <div className="flex items-center gap-4">
                        {currentStep < totalSteps && <button onClick={onFinish} className="text-sm text-gray-600 dark:text-zinc-400 hover:underline">Omitir por ahora</button>}
                        <button onClick={handleNext} className="btn btn-primary">
                            {currentStep === totalSteps ? 'Ir al Dashboard' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingWizard;
