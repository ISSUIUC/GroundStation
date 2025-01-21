import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../dataflow/gssdata.jsx'

import '../reusable/Common.css';

export const BaseTimer = ({ mode, targetTime, paused, set_callback, digitMode=1 }) => {

    /**
     * Digitmode:
     * 1: hh:mm:ss.uuu -> default
     * 2: mm:ss
     * 3: mm:ss.uuu
     * 4: hh:mm:ss
     */
    const [currentTime, setCurrentTime] = useState(getInitialTime());

    function getInitialTime() {
        if (mode === "set") return targetTime;
        if (mode === "t-" && targetTime) return targetTime - Date.now();
        return 0;
    } 

    useEffect(() => {
        if(paused && mode === "set") {
            setCurrentTime(targetTime);
            return;
        }

        if (mode === "t-" && targetTime) {
            const update = () => {
                const timeLeft = targetTime - Date.now();
                setCurrentTime(timeLeft);
                if(set_callback) {
                    set_callback(timeLeft);
                }
            };

            const intervalId = setInterval(update, 5); // Update every 5ms for precision
            return () => clearInterval(intervalId);
        }
    }, [mode, targetTime]);

    const formatTime = (milliseconds) => {
        const absMilliseconds = Math.abs(milliseconds);
    
        const hrcount = Math.floor(absMilliseconds / (60000 * 60))
        const hrs = Math.floor(absMilliseconds / (60000 * 60)).toString().padStart(2, '0');
        const mins_alt = (Math.floor((absMilliseconds % (60000 * 60)) / 60000) + (60*hrcount)).toString().padStart(2, '0');
        const mins = Math.floor((absMilliseconds % (60000 * 60)) / 60000).toString().padStart(2, '0');
        const secs = Math.floor((absMilliseconds % 60000) / 1000).toString().padStart(2, '0');
        const millis = (absMilliseconds % 1000).toString().padStart(3, '0');

        switch (digitMode) {
            case 1:
                return `${hrs}:${mins}:${secs}.${millis}`;
            case 2:
                return `${mins_alt}:${secs}`;
            case 3:
                return `${mins_alt}:${secs}.${millis}`;
            case 4:
                return `${hrs}:${mins}:${secs}`;
            default:
                return `${hrs}:${mins}:${secs}.${millis}`;
        }
    };
    

    return (
        <>{`${formatTime(currentTime)}`}</>
    );
};



export function CountdownTimer({ digitmode=1, anim=true }) {
  // Stream overlay timer that simply returns the digits of the countdown
  const timer_val = useTelemetry("@GSS/countdown_t0");
  const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
  const timer_pvalue = useTelemetry("@GSS/countdown_t0_paused_value")

  return (
    <span className={(timer_paused && anim) ? "overlay-spot-timer-paused" : ""}>
        <BaseTimer mode={timer_paused ? "set" : "t-"} targetTime={timer_paused ? timer_pvalue : timer_val} paused={timer_paused} digitMode={digitmode} />
    </span>
    
  )
}
