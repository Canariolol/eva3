import React, { useState } from 'react';
import { Bot, Mail, UploadCloud, Send, X, Minus, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Herramientas.css'; 

// --- Subcomponente del Modal ---
const ResultsModal = ({ title, isOpen, isMinimized, onClose, onMinimize, children }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                className={`results-modal ${isMinimized ? 'minimized' : 'maximized'}`}
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <div className="modal-actions">
                        <button onClick={onMinimize} className="modal-button">{isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}</button>
                        <button onClick={onClose} className="modal-button close"><X size={16} /></button>
                    </div>
                </div>
                {!isMinimized && <div className="modal-content">{children}</div>}
            </motion.div>
        )}
    </AnimatePresence>
);

// --- Componente Principal ---
const Herramientas = () => {
    const { userRole, currentUser } = useAuth();
    
    // Estados para Herramientas
    const [file, setFile] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [gmailFilters, setGmailFilters] = useState({ from: '', to: '', subject: '', filterId: '' });
    
    // Estados del Modal y Carga
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalMinimized, setIsModalMinimized] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => e.target.files[0] && setFile(e.target.files[0]);

    const handleAnalyzeDocument = () => {
        if (!file || !prompt) return alert("Por favor, sube un archivo y escribe una pregunta.");
        setModalTitle(`Análisis de: ${file.name}`);
        setModalContent(<p>Procesando documento... (Respuesta simulada)</p>);
        setIsModalOpen(true);
        setIsModalMinimized(false);
    };

    const handleSearchEmails = async () => {
        setLoading(true);
        setModalTitle("Resultados de Búsqueda en Gmail");
        setModalContent(<p>Buscando correos, esto puede tardar un momento...</p>);
        setIsModalOpen(true);
        setIsModalMinimized(false);

        try {
            const token = await currentUser.getIdToken();
            const functionUrl = `https://southamerica-west1-eva3-1b284.cloudfunctions.net/gmail_api_handler/api/emails`;
            
            const params = new URLSearchParams();
            if (gmailFilters.filterId) {
                params.append('filterId', gmailFilters.filterId);
            } else {
                if (gmailFilters.from) params.append('from', gmailFilters.from);
                if (gmailFilters.to) params.append('to', gmailFilters.to);
                if (gmailFilters.subject) params.append('subject', gmailFilters.subject);
            }

            const response = await fetch(`${functionUrl}?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error en la solicitud a la API");
            }

            const result = await response.json();
            
            // Renderizamos los resultados reales en el modal
            setModalContent(
                <div>
                    <p className="text-sm mb-4">Consulta ejecutada: <code className="bg-gray-100 dark:bg-zinc-700 p-1 rounded">{result.data.query}</code></p>
                    <div className="space-y-3">
                        {result.data.details.map(email => (
                            <div key={email.thread_id} className="p-3 bg-gray-50 dark:bg-zinc-700 rounded">
                                <p className="font-semibold">{email.subject}</p>
                                <p className="text-sm text-gray-600 dark:text-zinc-400">De: {email.from}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        } catch (error) {
            setModalContent(<p className="text-red-500">Error: {error.message}</p>);
        } finally {
            setLoading(false);
        }
    };
    
    const showHardcodedFilters = userRole === 'superadmin' || currentUser?.email === 'catherine.trivino@west-ingenieria.cl';

    const handleFilterPresetChange = (e) => {
        const value = e.target.value;
        setGmailFilters({ from: '', to: '', subject: '', filterId: value });
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Herramientas</h1>
                <p className="text-gray-600 dark:text-zinc-400 mb-8">Accede a herramientas avanzadas.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Card de Análisis de Documentos */}
                    <div className="tool-card">
                         <div className="tool-card-header">
                            <div className="tool-icon bg-purple-100 text-purple-600"><Bot /></div>
                            <div>
                                <h2 className="tool-card-title">Analizador de Documentos IA</h2>
                                <span className="badge bg-purple-200 text-purple-800">Premium</span>
                            </div>
                        </div>
                        <p className="tool-card-description">Extrae información específica de documentos usando IA.</p>
                        <div className="dropzone" onClick={() => document.getElementById('file-upload').click()}>
                            <UploadCloud className="text-gray-400" size={32} />
                            <p>{file ? `Archivo: ${file.name}` : 'Arrastra un archivo aquí'}</p>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="¿Qué información necesitas extraer?" className="form-control mt-4" rows="3"></textarea>
                        <button onClick={handleAnalyzeDocument} className="btn btn-primary w-full mt-4"><Send size={16} className="mr-2" /> Analizar</button>
                    </div>

                    {/* Card de Integración Gmail */}
                    <div className="tool-card">
                        <div className="tool-card-header">
                            <div className="tool-icon bg-red-100 text-red-600"><Mail /></div>
                            <div>
                                <h2 className="tool-card-title">Integración Gmail</h2>
                                <span className="badge bg-red-200 text-red-800">Pro</span>
                            </div>
                        </div>
                        <p className="tool-card-description">Busca en tu correo con filtros avanzados.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Configuraciones Guardadas</label>
                                <select className="form-control" value={gmailFilters.filterId} onChange={handleFilterPresetChange}>
                                    <option value="">Filtro Personalizado</option>
                                    {showHardcodedFilters && <option value="hardcoded_west">Filtro West Ingeniería</option>}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label">Remitente</label><input type="text" value={gmailFilters.from} onChange={(e) => setGmailFilters(prev => ({...prev, from: e.target.value, filterId: ''}))} className="form-control" /></div>
                                <div><label className="label">Destinatario</label><input type="text" value={gmailFilters.to} onChange={(e) => setGmailFilters(prev => ({...prev, to: e.target.value, filterId: ''}))} className="form-control" /></div>
                            </div>
                            <div><label className="label">Asunto</label><input type="text" value={gmailFilters.subject} onChange={(e) => setGmailFilters(prev => ({...prev, subject: e.target.value, filterId: ''}))} className="form-control" /></div>
                        </div>
                        <button onClick={handleSearchEmails} className="btn btn-primary w-full mt-6" disabled={loading}>{loading ? 'Buscando...' : <><Send size={16} className="mr-2" /> Buscar en Gmail</>}</button>
                    </div>
                </div>
            </div>
            <ResultsModal 
                title={modalTitle} isOpen={isModalOpen} isMinimized={isModalMinimized}
                onClose={() => setIsModalOpen(false)} onMinimize={() => setIsModalMinimized(!isModalMinimized)}
            >
                {modalContent}
            </ResultsModal>
        </>
    );
};

export default Herramientas;
