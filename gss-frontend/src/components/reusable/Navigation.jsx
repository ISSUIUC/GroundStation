import React, { useState } from 'react';
import './Navigation.css';

export const Navigation = ({ tab_callback, menuOpen, children }) => {

    const toggleMenu = () => tab_callback(!menuOpen);

    return (
        <div className={`navigation ${menuOpen ? 'open' : ''}`}>
            <div
                className="toggle-area"
                onClick={toggleMenu}
            >
                <button className="arrow">
                    {menuOpen ? '❮' : '❯'}
                </button>
            </div>
            <div className="tabs">
                {React.Children.map(children, (child) =>
                    React.cloneElement(child, {
                        onClick: () => tab_callback(false),
                    })
                )}
            </div>
        </div>
    );
};

export const NavigationTab = ({ value, onClick, children }) => (
    <div className="navigation-tab" onClick={onClick}>
        {children}
    </div>
);
