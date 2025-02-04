import React, { useEffect, useState } from 'react';
import GSSButton from '../reusable/Button';
import { useGSSMQTTRaw } from '../dataflow/gssdata';

const generate_ref_packet = (start_t, t) => {
    let pkt = {
        "metadata": {
            "raw_stream": "FlightData-Sustainer",
            "interpret_as": "sustainer",
            "time_published": start_t/1000 + t,
            "time_recieved": (start_t/1000) + t + 0.1
        },
        "data": {
            "value": {
                "barometer_altitude": 1200 + (0.5*t**2),
                "latitude": 41.49116 + (0.0002*t),
                "longitude": -89.50192 + (0.0003*t),
                "altitude": 1200 + Math.floor(0.5*t**2),
                "highG_ax": Math.sin(t),
                "highG_ay": Math.sin(2*t + 0.5)*1.5,
                "highG_az": Math.cos(3*t),
                "battery_voltage": t*0.02,
                "FSM_State": Math.floor(Math.abs(Math.sin(t/5))*15),
                "tilt_angle": Math.abs(Math.sin(t/3)*60),
                "frequency": 425,
                "RSSI": Math.abs(Math.cos(t/10)) * -100,
                "sat_count": Math.abs(Math.sin(t/20)) * 14,
                "is_sustainer": 0,
                "kf_velocity": 3*t + (0.05*t**2),
                "pyro_a": Math.abs(Math.sin(t) * 4),
                "pyro_b": Math.abs(Math.sin(t) * 4),
                "pyro_c": Math.abs(Math.sin(t) * 4),
                "pyro_d": Math.abs(Math.sin(t) * 4)
            },
            "type": "data",
            "utc": "2024-06-02 12:49:54.925549+00:00",
            "unix": 1717332594.925549,
            "src": "COM1"
        }
    }

    return pkt;
}

export const DataTestButton = () => {
    const [starttime, setstarttime] = useState(0);
    const send_mqtt = useGSSMQTTRaw()

    useEffect(() => {
        if(starttime == 0) {
            return;
        }

        const intv = setInterval(() => {
            let cur_time = Date.now()
            let t = (cur_time - starttime) / 1000;
            console.log("Send ", t);
            send_mqtt("FlightData-Sustainer", generate_ref_packet(starttime, t))

        }, 1000 * (1/8))

        return () => {
            clearInterval(intv);
        }

    }, [starttime])


    return (
       <GSSButton variant={"red"} onClick={() => {
        setstarttime(Date.now())
       }}>Test Data (DON'T TOUCH!)</GSSButton>
    )
}