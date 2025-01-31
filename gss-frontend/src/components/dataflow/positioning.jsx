import React, { useState, useEffect } from 'react';

const PositionData = React.createContext([false, {}]);

export function useGPSPosition() {
    return React.useContext(PositionData);
}

export function PositionDataProvider({ children }) {
    const [posData, setPosData] = useState(null);
    const [posAvailable, setPosAvailable] = useState(false);

    useEffect(() => {
        const wp = null;
        if(navigator.geolocation) {
            setPosData({"error": "retrieving data"})
            navigator.geolocation.watchPosition((position) => {
                setPosAvailable(true);
                setPosData(position.coords);
            }, (err) => {
                console.warn("Failed to retrieve position after successful navigator.geolocation call");
                setPosData({"error": "watchPosition callback error : " + err.message})
                setPosAvailable(false);
            })
        } else {
            setPosData({"error": "navigator.geolocation call unsuccessful"})
        }

        return () => {
            if(wp) {
                navigator.geolocation.clearWatch(wp);
            }
        }
    }, [])

    return <PositionData.Provider value={[posAvailable, posData]}>{children}</PositionData.Provider>
}
