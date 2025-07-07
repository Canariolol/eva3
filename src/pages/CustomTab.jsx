import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Importar Widgets y su Shell
import WidgetShell from '../components/Widgets/WidgetShell';
import PinnedNotesWidget from '../components/Widgets/PinnedNotesWidget';
import KeyMetricsWidget from '../components/Widgets/KeyMetricsWidget';
import RecentActivityWidget from '../components/Widgets/RecentActivityWidget';
import PerformanceRankingWidget from '../components/Widgets/PerformanceRankingWidget';
import QuickChartWidget from '../components/Widgets/QuickChartWidget';
import NeedsAttentionWidget from '../components/Widgets/NeedsAttentionWidget';

// Importar Estilos
import './CustomTab.css';
import '../components/Widgets/WidgetShell.css';
import '../components/Widgets/KeyMetricsWidget.css';
import '../components/Widgets/RecentActivityWidget.css';
import '../components/Widgets/PerformanceRankingWidget.css';
import '../components/Widgets/QuickChartWidget.css';
import '../components/Widgets/NeedsAttentionWidget.css';


const ResponsiveGridLayout = WidthProvider(Responsive);

// --- MODAL PARA AÑADIR WIDGETS ---
const AddWidgetModal = ({ onSelect, onClose }) => {
    const widgetTypes = [
        { id: 'pinnedNotes', name: 'Notas Adheribles', description: 'Un espacio para texto y recordatorios.' },
        { id: 'keyMetrics', name: 'Métricas Clave', description: 'Muestra el promedio de un criterio específico.' },
        { id: 'recentActivity', name: 'Actividad Reciente', description: 'Muestra las últimas evaluaciones registradas.' },
        { id: 'performanceRanking', name: 'Ranking de Desempeño', description: 'Muestra un top 5 de ejecutivos por sección.' },
        { id: 'quickChart', name: 'Gráfico Rápido', description: 'Visualiza un criterio con un gráfico de barras o líneas.' },
        { id: 'needsAttention', name: 'Necesita Atención', description: 'Alerta sobre ejecutivos que cumplen una condición.' },
    ];

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>Añadir Widget</h2>
                <ul className="config-list">
                    {widgetTypes.map(widget => (
                        <li key={widget.id} className="config-list-item" onClick={() => onSelect(widget.id)}>
                            <div>
                                <strong>{widget.name}</strong>
                                <p style={{ margin: 0, color: '#6c757d' }}>{widget.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


// --- PÁGINA PRINCIPAL ---
const CustomTab = () => {
    const { tabId } = useParams();
    const { customTabs, evaluationSections, criteria } = useGlobalContext();
    const { userRole } = useAuth();
    
    const [currentTab, setCurrentTab] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [layouts, setLayouts] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWidgetId, setEditingWidgetId] = useState(null);

    useEffect(() => {
        const foundTab = customTabs.find(tab => tab.id === tabId);
        setCurrentTab(foundTab);
    }, [tabId, customTabs]);
    
    const fetchWidgets = useCallback(async () => {
        if (!tabId) return;
        const widgetsCollection = collection(db, 'customTabs', tabId, 'widgets');
        const widgetSnapshot = await getDocs(widgetsCollection);
        const fetchedWidgets = widgetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWidgets(fetchedWidgets);
    }, [tabId]);

    useEffect(() => {
        fetchWidgets();
    }, [fetchWidgets]);

    const handleAddWidget = async (widgetType) => {
        const newWidget = { 
            type: widgetType,
            layout: { x: 0, y: Infinity, w: 4, h: 5 }
        };
        const newWidgetRef = await addDoc(collection(db, 'customTabs', tabId, 'widgets'), newWidget);
        fetchWidgets();
        const configurableWidgets = ['pinnedNotes', 'keyMetrics', 'performanceRanking', 'quickChart', 'needsAttention'];
        if (configurableWidgets.includes(widgetType)) {
            setEditingWidgetId(newWidgetRef.id);
        }
        setIsModalOpen(false);
    };

    const handleDeleteWidget = async (widgetId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este widget?')) {
            await deleteDoc(doc(db, 'customTabs', tabId, 'widgets', widgetId));
            fetchWidgets();
        }
    };
    
    const onLayoutChange = (layout, allLayouts) => {
        const updatedWidgets = widgets.map(widget => {
            const layoutItem = layout.find(item => item.i === widget.id);
            return layoutItem ? { ...widget, layout: { ...widget.layout, ...layoutItem } } : widget;
        });
        setWidgets(updatedWidgets);
        setLayouts(allLayouts);
        
        const batch = writeBatch(db);
        layout.forEach(item => {
            const widgetRef = doc(db, 'customTabs', tabId, 'widgets', item.i);
            batch.update(widgetRef, {
                'layout.x': item.x,
                'layout.y': item.y,
                'layout.w': item.w,
                'layout.h': item.h,
            });
        });
        batch.commit();
    };
    
    const handleInteractionStart = () => {
        document.body.classList.add('is-resizing');
    };
    
    const handleInteractionStop = () => {
        document.body.classList.remove('is-resizing');
    };
    
    const handleEditingComplete = (widgetId, newConfig) => {
        if (newConfig) {
            setWidgets(prevWidgets =>
                prevWidgets.map(w =>
                    w.id === widgetId ? { ...w, ...newConfig } : w
                )
            );
        }
        setEditingWidgetId(null);
    };

    const renderWidget = (widget) => {
        const props = {
            key: widget.id,
            widget,
            tabId,
            userRole,
            isEditing: editingWidgetId === widget.id,
            onEditingComplete: (newConfig) => handleEditingComplete(widget.id, newConfig),
        };
        const components = {
            pinnedNotes: <PinnedNotesWidget {...props} />,
            keyMetrics: <KeyMetricsWidget {...props} />,
            recentActivity: <RecentActivityWidget {...props} />,
            performanceRanking: <PerformanceRankingWidget {...props} />,
            quickChart: <QuickChartWidget {...props} />,
            needsAttention: <NeedsAttentionWidget {...props} />,
        };
        return components[widget.type] || null;
    };
    
    const getWidgetTitle = useMemo(() => (widget) => {
        const defaultTitles = {
            pinnedNotes: 'Notas Adheribles',
            keyMetrics: 'Métricas Clave',
            recentActivity: 'Actividad Reciente',
            performanceRanking: 'Ranking de Desempeño',
            quickChart: 'Gráfico Rápido',
            needsAttention: 'Necesita Atención',
        };
        
        if (widget.type === 'needsAttention' && widget.trackingId) {
            const source = widget.trackingType === 'section' ? evaluationSections : criteria;
            const item = source.find(i => i.id === widget.trackingId);
            return item ? `Atención: ${item.name}` : 'Necesita Atención';
        }

        if (widget.type === 'quickChart' && widget.criterionId) {
            const item = criteria.find(c => c.id === widget.criterionId);
            return item ? `Gráfico: ${item.name}` : 'Gráfico Rápido';
        }
        
        return defaultTitles[widget.type] || 'Widget';
    }, [evaluationSections, criteria]);

    const configurableWidgets = ['pinnedNotes', 'keyMetrics', 'performanceRanking', 'quickChart', 'needsAttention'];

    if (!currentTab) {
        return <div>Cargando pestaña...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h1>{currentTab.name}</h1>
                    <p className="page-subtitle">Arrastra y redimensiona los widgets para organizar tu espacio de trabajo.</p>
                </div>
                {userRole === 'admin' && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        Añadir Widget
                    </button>
                )}
            </div>

            {isModalOpen && (
                <AddWidgetModal 
                    onSelect={handleAddWidget}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                onLayoutChange={onLayoutChange}
                onDragStart={handleInteractionStart}
                onDragStop={handleInteractionStop}
                onResizeStart={handleInteractionStart}
                onResizeStop={handleInteractionStop}
                isDraggable={userRole === 'admin'}
                isResizable={userRole === 'admin'}
                draggableHandle=".widget-header"
                compactType="vertical"
            >
                {widgets.map(widget => (
                    <div key={widget.id} data-grid={widget.layout || { x: 0, y: 0, w: 4, h: 5 }}>
                        <WidgetShell
                            title={getWidgetTitle(widget)}
                            userRole={userRole}
                            onDelete={() => handleDeleteWidget(widget.id)}
                            onEdit={configurableWidgets.includes(widget.type) ? () => setEditingWidgetId(widget.id) : null}
                            isEditable={configurableWidgets.includes(widget.type)}
                        >
                            {renderWidget(widget)}
                        </WidgetShell>
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
};

export default CustomTab;
