import React, { useState, useRef, useEffect } from 'react';
import './CollapsibleCard.css';

const CollapsibleCard = ({ children, maxHeight = 400 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsible, setIsCollapsible] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        // Check if the content is taller than the max height
        if (contentRef.current && contentRef.current.scrollHeight > maxHeight) {
            setIsCollapsible(true);
        } else {
            setIsCollapsible(false);
        }
    }, [children, maxHeight]);

    return (
        <div className={`collapsible-card ${isExpanded ? 'expanded' : ''} ${isCollapsible ? 'collapsible' : ''}`}>
            <div
                className="collapsible-content"
                ref={contentRef}
                style={{ maxHeight: isExpanded || !isCollapsible ? 'none' : `${maxHeight}px` }}
            >
                {children}
            </div>
            {isCollapsible && (
                <div className="collapsible-footer">
                    {!isExpanded && <div className="fader"></div>}
                    <button onClick={() => setIsExpanded(!isExpanded)} className="btn btn-secondary">
                        {isExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CollapsibleCard;
