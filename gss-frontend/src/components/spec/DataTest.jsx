import React, { useEffect, useState } from 'react';
import GSSButton from '../reusable/Button';
import { useGSSMQTTRaw } from '../dataflow/gssdata';

import in_telem from '../../assets/midas-sustainer-telem.txt'
import in_telem2 from '../../assets/midas-booster-telem.txt'

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
                "kf_position": t**2 + (0.1*t**3),
                "c_valid": 0,
                "c_on": Math.floor(Math.abs(Math.cos(t/15)) * 3),
                "c_rec": Math.floor(Math.abs(Math.cos(t/12)) * 3),
                "vtx_on": Math.floor(Math.abs(Math.cos(t/20) + 0.5)),
                "vmux_stat": Math.floor(Math.abs(Math.cos(t/18) + 0.5)),
                "cam_ack": Math.floor(Math.abs(Math.cos(t/25) + 0.5)),
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
    const [dat, setdata] = useState([]);
    const [dat2, setdata2] = useState([]);

    useEffect(() => {
        fetch(in_telem)
        .then(r => r.text())
        .then(text => {
         console.log("Decoding data...");
         let intstuff = text.split("\n").map((line) => {
            if(line.length > 5) {
                return JSON.parse(line);
            }
            return ""
         });
         
         setdata(intstuff);
         
         console.log("decoded!")
       });

       fetch(in_telem2)
       .then(r => r.text())
       .then(text => {
        console.log("Decoding data...");
        let intstuff = text.split("\n").map((line) => {
           if(line.length > 5) {
               return JSON.parse(line);
           }
           return ""
        });
        
        setdata2(intstuff);
        
        console.log("decoded!")
      });
    }, [])


    useEffect(() => {
        if(starttime == 0) {
            return;
        }

        let START_L = 2635
        let START_L2 = 2663
        let i = START_L;
        const intv = setInterval(() => {
            let cur_time = Date.now()
            let t = (cur_time - starttime) / 1000;
            
            let initial_time = dat[START_L]["metadata"]["time_published"]
            
            send_mqtt("FlightData-Sustainer", generate_ref_packet(starttime, t));
            // // console.log(i);
            // let rt = t + initial_time
            // // console.log(rt, dat[i]["metadata"]["time_published"])
            // while(dat[i]["metadata"]["time_published"] <= rt) {
            //     i++;
            //     send_mqtt("FlightData-Sustainer", dat[i]);
            // }

        }, 10)

        // let j = START_L2;
        // const intv2 = setInterval(() => {
        //     let cur_time = Date.now()
        //     let t = (cur_time - starttime) / 1000;
            
        //     let initial_time = dat2[START_L2]["metadata"]["time_published"]

        //     // console.log(i);
        //     let rt = t + initial_time
        //     // console.log(rt, dat[i]["metadata"]["time_published"])
        //     while(dat2[j]["metadata"]["time_published"] <= rt) {
        //         j++;
        //         send_mqtt("FlightData-Booster", dat2[j]);
        //     }

        // }, 10)

        return () => {
            clearInterval(intv);
            // clearInterval(intv2);
        }

    }, [starttime])


    return (
       <GSSButton variant={"red"} onClick={() => {
        setstarttime(Date.now())
       }}>Test Data (DON'T TOUCH!)</GSSButton>
    )
}


