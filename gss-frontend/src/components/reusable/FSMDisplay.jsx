import React from 'react';
import './FSMDisplay.css';

// WIP

const FSMDisplay = ({ state, children }) => {
    return (
        <div className="fsm-display">
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return null;
                const isActive = child.props.value === state;
                return React.cloneElement(child, { isActive, index });
            })}
        </div>
    );
};

const FSMState = ({ value, isActive, children }) => {
    return (
        <div className={`fsm-state ${isActive ? 'active' : ''}`}>
            <div className="fsm-circle" />
            <div className="fsm-label">{children}</div>
        </div>
    );
};

export { FSMDisplay, FSMState };

