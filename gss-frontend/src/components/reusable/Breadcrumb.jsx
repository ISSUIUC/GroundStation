import React, { useState, useEffect, Children } from 'react';
import './Breadcrumb.css';
import { useChannel, useTelemetry } from '../dataflow/gssdata';

export const Breadcrumb = () => {
    // Value to provide telem health "at a glance"
    const [isLOS, setisLOS] = useState(false);
    const [last_tvalue, setlast_tvalue] = useState(0);
    const [latency, setlatency] = useState(0);
    const t_published = useTelemetry("/time_published", true);
    const rssi = useTelemetry("/value.RSSI");

    const channel = useChannel().toUpperCase();

    if(!t_published) {
        return <div className="breadcrumb">
            <div className="breadcrumb-va"><div className={`bc-statuslight`}></div></div>
            {channel}
            <div className="breadcrumb-va"><div className='bc-separator'></div></div>
            OFFLINE</div>
    }

    // Check for disconnect
    useEffect(() => {
        if(t_published != last_tvalue) {
            const t_pubished_js = Math.floor(t_published*1000)
            const deltatime = Math.abs(Date.now() - t_pubished_js)
            setlatency(deltatime);
        }

        setisLOS(false);
        let los_check = setTimeout(() => {
            setisLOS(true);
        }, 2000);

        return () => {
            clearTimeout(los_check);
        }
    }, [t_published])


    // Color for stats!
    let latency_style = "bc-text-ok"
    if(latency > 200) {
        latency_style = "bc-text-warn"
    }

    if(latency > 1000) {
        latency_style = "bc-text-err"
    }

    let rssi_style = "bc-text-ok"
    if(rssi < -80) {
        rssi_style = "bc-text-warn"
    }

    if(rssi < -115) {
        rssi_style = "bc-text-err"
    }

    let latencytext = latency.toString().padStart(4, " ") + "ms"
    let rssitext = rssi.toString().padStart(4, " ")

    if(isLOS) {
        latency_style = "bc-text-err"
        rssi_style = "bc-text-err"
    }

    

    return (
        <div className="breadcrumb">
            <div className="breadcrumb-va"><div className={`bc-statuslight ${isLOS ? "bc-status-err" : "bc-status-ok"}`}></div></div>
            {channel}
            <div className="breadcrumb-va"><div className='bc-separator'></div></div>
            System latency: <span className={latency_style}>{isLOS ? "   LOS" : latencytext}</span>
            <div className="breadcrumb-va"><div className='bc-separator'></div></div>
            RSSI: <span className={rssi_style}>{isLOS ?  " LOS" : rssitext}</span>
        </div>
    );
};