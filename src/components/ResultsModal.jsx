import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, ChevronsUpLeft } from 'lucide-react';
import './ResultsModal.css';

const ResultsModal = ({ title, isOpen, isMinimized, onClose, onMinimize, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`results-modal ${isMinimized ? 'minimized' : 'maximized'}`}
                    initial={isMinimized ? { y: 100, x: 100, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, y: 0, x: 0, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                >
                    <div className="modal-header">
                        <h3 className="modal-title">{title}</h3>
                        <div className="modal-actions">
                            <button onClick={onMinimize} className="modal-button">
                                {isMinimized ? <ChevronsUpLeft size={16} /> : <Minus size={16} />}
                            </button>
                            <button onClick={onClose} className="modal-button close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    {!isMinimized && (
                        <div className="modal-content">
                            {children}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResultsModal;
