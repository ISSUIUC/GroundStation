import React from 'react';
import './AngleGauge.css';

export const AngleGauge = ({ angle, limit }) => {
    const normalizedAngle = Math.max(0, Math.min(angle, 90)); // Clamp between 0 and 180
    const is_overflow = angle > 90;

    return (
        <div className="gauge-container">
            <div className="gauge">
                <div className='gauge-bg' 
                style={{
                    backgroundImage: `conic-gradient(var(--gauge-bg) 0deg, var(--gauge-bg) ${limit}deg, var(--gauge-keepout-color) ${limit}deg)`
                  }}
                >

                </div>
                <div
                    className="gauge-needle"
                    style={{ transform: `rotate(${normalizedAngle}deg)` }}
                />
                <div
                    className="gauge-limit"
                    style={{ transform: `rotate(${limit}deg)` }}
                />
                <div className="gauge-overlay">
                    <span className="gauge-angle">
                        <span className={`gauge-angle-text ${angle > limit ? "gauge-angle-text-err" : ""}`}>
                            {is_overflow ? ">90" : normalizedAngle.toFixed(1)}°
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};
