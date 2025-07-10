import React from 'react';
import Tooltip from './Tooltip';
import { stripHtml } from '../utils/textUtils'; // Importar la nueva utilidad
import './LabelWithDescription.css';

const LabelWithDescription = ({ item, title }) => {
    // Si el item no existe, simplemente mostramos el título.
    if (!item) {
        return <span>{title}</span>;
    }

    const showAsTooltip = item.displayAsTooltip ?? false;
    const plainTextDescription = stripHtml(item.description); // Limpiar el HTML para el tooltip

    return (
        <div className="label-with-description">
            <div className="label-title">
                {title && <span>{title}</span>}
                {showAsTooltip && plainTextDescription && (
                    <Tooltip text={plainTextDescription}>
                        <span className="info-icon">i</span>
                    </Tooltip>
                )}
            </div>
            {!showAsTooltip && item.description && item.displayDescription && (
                // Para la descripción desplegada, usamos el HTML original
                <div className="description-text" dangerouslySetInnerHTML={{ __html: item.description }} />
            )}
        </div>
    );
};

export default LabelWithDescription;
