import React, { useState, useEffect, Children } from 'react';
import './ValueDisplay.css';
import './Common.css';

export const SingleValue = ({ label, value, unit, hidden }) => {

    return (
        <div className="value-card">
            {hidden ?  <div className='card-overlay'>NO DATA</div> : null}
            <div className="value-card-name">
                {label}
            </div>
            <div className={hidden ? "card-hide" : ""}>
                <div className="value-card-display">
                    {value}
                    <span className='value-card-unit'>{unit}</span>
                </div>
            </div>

        </div>
    );
};

export const MultiValue = ({ label, titles, values, units, label_colors, hidden }) => {
    // Meant for displaying a group of similar values, such as orientation data (pitch, roll, yaw) or GPS data (lat, long, alt)

    if(label_colors === undefined) {
        label_colors = Array(titles.length).fill('#cccccc');
    }

    return (
        <div className="value-card">
            {hidden ?  <div className='card-overlay'>NO DATA</div> : null}
            <div className="value-card-name">
                {label}
            </div>
            <div className={hidden ? "card-hide" : ""}>
                <div className="value-card-display-multi">
                    {titles.map((title, index) => {
                        return (
                            <div key={index} className="value-card-display-multi-item">
                                <div className={"shrink-text"} style={{color: label_colors[index]}}>
                                    {title}    
                                </div>
                                <div>
                                    {values[index]}
                                    <span className='value-card-unit'>{units[index]}</span>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export const ValueGroup = ({ label, children, hidden=false, hidden_label_text="NO DATA", use_smaller_labels=false, style_override={}, child_style_override={} }) => {
    return (
        <div className={`value-card-group ${use_smaller_labels ? "value-card-group-smalllabel" : ""}`} style={style_override}>
            {hidden ?  <div className='card-overlay'>{hidden_label_text}</div> : null}

            <div className="value-card-gname">
                {label}
            </div>
            <div className={hidden ? "card-hide" : ""} style={child_style_override}>
                {children}
            </div>
            
        </div>
    );
}

export const SingleValueGroupRow = ({ children }) => {
    return (
        <div className="value-card-group-row">
            {children}
        </div>
    );
}

export const StatusDisplay = ({ label, status }) => {
    // This can be used within a ValueGroup to display a status message
    let stat_type = "status-inactive";

    if(status === "OK" || status === "GO") {
        stat_type = "status-ok";
    } else if(status === "WARN") {
        stat_type = "status-warning";
    } else if(status === "CAUT" || status === "STBY") {
        stat_type = "status-caution";
    } else if(status === "ERR" || status === "NOGO"  || status === "LOS") {
        stat_type = "status-error";
    }

    return (
        <div className={`status-card card-${stat_type}`}>
            <div className="status-name">
                {label}
            </div>
            <div className={`status-display ${stat_type}`}>
                {status.padEnd(4, ' ')}
            </div>
        </div>
    );
}

export const StatusDisplayWithValue = ({ label, status, value }) => {
    // This can be used within a ValueGroup to display a status message with an associated value (useful for latency or error count)
    let stat_type = "status-inactive";

    if(status === "OK" || status === "GO") {
        stat_type = "status-ok";
    } else if(status === "WARN") {
        stat_type = "status-warning";
    } else if(status === "CAUT" || status === "STBY") {
        stat_type = "status-caution";
    } else if(status === "ERR" || status === "NOGO" || status === "LOS") {
        stat_type = "status-error";
    }

    return (
        <div className={`status-card card-${stat_type}`}>
            <div className="status-name">
                {label}
            </div>
            <div className='status-display-group'>
                <div className='status-display-v'>
                    {value}
                </div>
                <div className={`status-display ${stat_type}`}>
                    {status.padEnd(4, ' ')}
                </div>
            </div>

        </div>
    );
}   

export const GenericDisplay = ({ label, children, hidden }) => {
    return (
        <div className="value-card">
            {hidden ?  <div className='card-overlay'>NO DATA</div> : null}
            <div className="value-card-name">
                {label}
            </div>
            <div className={hidden ? "card-hide" : ""}>
                {children}
            </div>
            
        </div>
    );
}