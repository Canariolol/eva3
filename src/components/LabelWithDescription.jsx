import React from 'react';
import Tooltip from './Tooltip';

const LabelWithDescription = ({ item, title }) => {
    // Si el item no existe, simplemente mostramos el título.
    if (!item) {
        return <span>{title}</span>;
    }

    const showAsTooltip = item.showDescriptionAsTooltip ?? true; // Por defecto es tooltip

    return (
        <div className="label-with-description">
            <div className="label-title">
                <span>{title}</span>
                {showAsTooltip && item.description && (
                    <Tooltip text={item.description}>
                        <span className="info-icon">i</span>
                    </Tooltip>
                )}
            </div>
            {!showAsTooltip && item.description && (
                <p className="description-text">{item.description}</p>
            )}
        </div>
    );
};

export default LabelWithDescription;
