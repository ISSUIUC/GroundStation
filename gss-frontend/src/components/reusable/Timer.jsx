import React, { useState, useEffect } from 'react';
import './Timer.css';
import './Common.css';

export const Timer = ({ mode, targetTime, timer_name, neg_t_text, pos_t_text, hidden, paused, set_callback }) => {
    const [currentTime, setCurrentTime] = useState(getInitialTime());

    function getInitialTime() {
        if (mode === "set") return targetTime;
        if (mode === "t-" && targetTime) return targetTime - Date.now();
        return 0;
    } 

    useEffect(() => {
        if(hidden) {
            return;
        }

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
    
        const hrs = Math.floor(absMilliseconds / (60000 * 60)).toString().padStart(2, '0');
        const mins = Math.floor((absMilliseconds % (60000 * 60)) / 60000).toString().padStart(2, '0');
        const secs = Math.floor((absMilliseconds % 60000) / 1000).toString().padStart(2, '0');
        const millis = (absMilliseconds % 1000).toString().padStart(3, '0');
    
        return `${hrs}:${mins}:${secs}.${millis}`;
    };
    

    return (
        <div className="value-card">
            {hidden ?  <div className='card-overlay'>NO DATA</div> : null}
            <div className="value-card-name">
                {timer_name}
            </div>
            <div className={hidden ? "card-hide" : ""}>
                <div className={`timer-display ${paused ? "timer-paused" : ""}`}>
                    <span className='timer-t-text'>
                        {currentTime < 0 ? pos_t_text : neg_t_text}
                    </span>
                    {`${formatTime(currentTime)}`}
                </div>
            </div>

        </div>
    );
};
