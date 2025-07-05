import { use, useEffect, useState } from "react";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { BaseTimer, CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"
import { ValueGroup } from "../reusable/ValueDisplay";
import { BoosterSVG, SustainerSVG } from "./OverlayVis";
import { state_int_to_state_name } from "../dataflow/midasconversion";
import GSSButton from "../reusable/Button";
import { FlightCountTimer } from "../spec/FlightCountTimer";
import { time_series } from "../dataflow/derivatives";

import IN_DATA_SUSTAINER from '../../assets/aether2_s_tm.txt'

function formatTelemetryDigits(value, num_digits) {
    // Formats telemetry in the overlay view format, I.E: Altitude 00 000FT, velocity 0 000ft
    // Will cap at maximum value if value is greater than precision offered by num_digits.

    let max_value_abs = Number("9".repeat(num_digits))
    let value_abs = Math.round(Math.abs(value))

    if(value_abs > max_value_abs) {
        value_abs = max_value_abs;
    }
    
    const real_digits = value_abs.toString().padStart(num_digits, "0")

    let value_digits = real_digits.split("").reverse().slice(-num_digits)
    let out = [...value_digits]
    for(let i = 0; i < value_digits.length; i++) {
        if(i%3 == 0 && i!=0) {
            out.splice(i, 0, " ")
            continue;
        }
    }

    return `${value < 0 ? "-" : " "}${out.reverse().join("")}`;
}

export function ReplayTimer({ time, digitmode=1 }) {
  // Stream overlay timer that simply returns the digits of the countdown
  return (
    <span>
        {time > 0 ? "+" : "-"}<BaseTimer mode={"set"} targetTime={time} paused={false} digitMode={digitmode} />
    </span>
    
  )
}

function ReplayPTimer({ progName, visible, time }) {
    const fade_classname = visible ? "generic-fade-in" : "generic-fade-out"
    const grow_classname = visible ? "stream-passive-timer-sep-in" : "stream-passive-timer-sep-out"


    return (
        <div className="stream-passive-timer-wrapper">
            <div className="stream-passive-timer">
                <div className={`stream-passive-timer-main start-hidden ${fade_classname}`}>
                    <span className="stream-passive-timer-m-text">T</span>

                    <span>
                        {time > 0 ? "+" : "-"}<BaseTimer mode="set" targetTime={time} paused={false} digitMode={4} />
                    </span>
                </div>
                <div className={`stream-passive-timer-sep ${grow_classname}`} />
                <div className={`stream-passive-timer-name start-hidden ${fade_classname}`}>
                    {progName}
                </div>
            </div>
        </div>

    );
}



export default function FlightDataReplay() {
    // FLIGHT DATA REPLAY SYSTEM
    // Michael K, 2025

    // ============== [ DATA VALUES ] ==============
    // Edit the values below to 
    const [sus_angle, set_sus_angle] = useState(1);
    const [boo_angle, set_boo_angle] = useState(1);
    const [booster_alt, set_booster_alt] = useState(-1);
    const [sustainer_alt, set_sustainer_alt] = useState(2);
    const [booster_vel, set_booster_vel] = useState(0);
    const [sustainer_vel, set_sustainer_vel] = useState(0);
    const [fsm_state, set_fsm_state] = useState("LAUNCH STANDBY");
    const [flight_time, set_flight_time] = useState(0);

    // ============== [ VISIBILITY ] ==============
    const [spot_vis, set_spot_vis] = useState(false);
    const [top_timer_vis, set_top_timer_vis] = useState(true);
    const [has_booster_telem, set_has_booster_telem] = useState(true);
    const [has_sustainer_telem, set_has_sustainer_telem] = useState(true);


    // ============== [ DATA HANDLING ] ==============
    // This is where we read in files for playback, and handle their data.

    const [realtime, set_realtime] = useState(0);
    const [dat_sustainer, set_dat_sustainer] = useState([]);
    const [dat_booster, set_dat_booster] = useState([]);
    useEffect(() => {
        fetch(IN_DATA_SUSTAINER)
        .then(r => r.text())
        .then(text => {
            // It's a csv, we will decode it as such.
            console.log("Decoding data...");
            let lines = text.split("\n");
            const header = lines.shift().split(",");
            let intstuff = lines.map((line) => {
                if(line.length > 2) {
                    // Check if it's a real line

                    const line_vals = line.split(",");

                    // Convert to object
                    return {
                        "time": parseFloat(line_vals[4]),
                        "state": line_vals[6].trim(),
                        "altitude": parseFloat(line_vals[10]) * 3.28084,
                        "speed": parseFloat(line_vals[11]) * 3.28084,
                        "tilt": parseFloat(line_vals[25]),
                        "accel": parseFloat(line_vals[7]) / 9.81,
                        "mach": parseFloat(line_vals[82]),
                    }
                    
                }
                return ""
            });
            
            set_dat_sustainer(intstuff);
            
            console.log("decoded!")
        });
    }, []);

    // Data playback
    useEffect(() => {
        if(realtime == 0) {
            return;
        }

        let i = 0;
        const intv = setInterval(() => {
            let cur_time = Date.now()
            let t = (cur_time - realtime) / 1000;
            // console.log("Current time: ", t, "s");
            let initial_time = dat_sustainer[0]["time"];
            

            let rt = t + initial_time
            // console.log(rt, dat[i]["metadata"]["time_published"])
            while(dat_sustainer[i]["time"] <= rt) {
                i++;
                // send_mqtt("FlightData-Sustainer", dat[i]);

                // Update the telemetry values
                set_sustainer_alt(dat_sustainer[i]["speed"]);
                set_sustainer_vel(dat_sustainer[i]["mach"]);
                set_fsm_state(dat_sustainer[i]["state"]);
                set_sus_angle(dat_sustainer[i]["tilt"]);
                set_flight_time(rt * 1000);

                set_booster_alt(dat_sustainer[i]["altitude"]);
                set_booster_vel(dat_sustainer[i]["accel"]);




            }

        }, 10)


        return () => {
            clearInterval(intv);
            // clearInterval(intv2);
        }

        
    }, [realtime])


    // ============== [ DATA DELAY TIMING ] ==============
    const DATA_DELAY = 32000; // This is the delay in milliseconds before the data starts replaying
    useEffect(() => {
        console.log("Delay: ", DATA_DELAY, "ms");
        let t = Date.now();
        // This is where we set the data delay timing, which is the time it takes before the data replay starts
        // This is set to 0 by default, but can be changed to a different value if needed.
        let a = setInterval(() => {
            set_flight_time(-(DATA_DELAY - (Date.now() - t)));
        }, 10);

        // Toggle timers at T-9s
        setTimeout(() => {
            set_spot_vis(true);
        }, DATA_DELAY - 9000);
        setTimeout(() => {
            set_top_timer_vis(false);
        }, DATA_DELAY - 8250);

        setTimeout(() => {
            clearInterval(a);
            set_realtime(Date.now());
        }, DATA_DELAY);
    }, []);




    // ============== [ DO NOT TOUCH PAST THIS POINT ] ==============
    let timer_div = <><div className="overlay-spot-timer-above-label">
            {fsm_state.toUpperCase()}
        </div>
        <div className="overlay-spot-timer-main">
            T<ReplayTimer time={flight_time} />
        </div></>


    return (
        <>
            <div className={`spot-overlay start-hidden spot-overlay-${spot_vis ? "in" : "out"}`} />
            <ReplayPTimer progName={"Aether II"} visible={top_timer_vis} time={flight_time} />
            <div className={`overlay-position-bottom start-hidden overlay-row-${spot_vis ? "in" : "out"}`}>
                <div className="overlay-row">

                    <div className={`overlay-row-group ${has_booster_telem ? "" : "overlay-row-group-disabled"}`}>
                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-title">
                                    <div className="overlay-row-telem-title-name">
                                        SUSTAINER
                                    </div>
                                    <div className="overlay-row-telem-title-qty">
                                        ALTITUDE
                                    </div>
                                </div>
                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-main">
                                    {formatTelemetryDigits(booster_alt, 6)}
                                </div>

                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-unit">
                                    FT
                                </div>
                            </div>
                        </div>

                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-title">
                                    <div className="overlay-row-telem-title-name">
                                        SUSTAINER
                                    </div>
                                    <div className="overlay-row-telem-title-qty">
                                        ACCELERATION
                                    </div>
                                </div>
                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-main">
                                    {
                                        (booster_vel>=0) ? (booster_vel>=10?"":" ") + " " + booster_vel.toFixed(2) : " " + booster_vel.toFixed(2)
                                    }
                                    {}
                                </div>

                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-unit">
                                    G
                                </div>
                            </div>
                        </div>

                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                    <div className="overlay-row-telem-unit" style={{textAlign: "center", marginLeft: "0px"}}>MISSION</div>
                                    <div style={{textAlign: "center"}}><strong>AETHER II</strong></div>
                            </div>
                            
                        </div>

                        {/* <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                    <div className="overlay-tilt-wrapper">
                                    <div className={`overlay-tilt-hind ${spot_vis ? "tilt-hind-in" : "tilt-hind-out"}`} />
                                    <div className={`overlay-tilt-vind ${spot_vis ? "tilt-vind-in" : "tilt-vind-out"}`} />
                                    <BoosterSVG visible={spot_vis && has_booster_telem} angle={boo_angle} has_telem={has_booster_telem} />
                                </div>
                            </div>
                        </div> */}
                    </div>

                    <div className="overlay-row-element">
                        { timer_div }
                    </div>

                    <div className={`overlay-row-group ${has_sustainer_telem ? "" : "overlay-row-group-disabled"}`}>

                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                <div className="overlay-tilt-wrapper">
                                    <div className={`overlay-tilt-hind ${spot_vis ? "tilt-hind-in" : "tilt-hind-out"}`} />
                                    <div className={`overlay-tilt-vind ${spot_vis ? "tilt-vind-in" : "tilt-vind-out"}`} />
                                    <SustainerSVG visible={spot_vis && has_sustainer_telem} angle={sus_angle} has_telem={has_sustainer_telem} />
                                </div>
                
                            </div>
                        </div>

                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-title">
                                    <div className="overlay-row-telem-title-name">
                                        SUSTAINER
                                    </div>
                                    <div className="overlay-row-telem-title-qty">
                                        VELOCITY
                                    </div>
                                </div>
                            </div>

                            <div className="overlay-v-align">
                                <div className={`overlay-row-telem-main`}>
                                    {formatTelemetryDigits(sustainer_alt, 6)}
                                </div>
                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-unit">
                                    FT/S
                                </div>
                            </div>
                        </div>

                        <div className="overlay-row-telem-group">
                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-title">
                                    <div className="overlay-row-telem-title-name">
                                        SUSTAINER
                                    </div>
                                    <div className="overlay-row-telem-title-qty">
                                        MACH NUMBER
                                    </div>
                                </div>
                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-main">
                                    {sustainer_vel.toFixed(2)}
                                </div>

                            </div>

                            <div className="overlay-v-align">
                                <div className="overlay-row-telem-unit">
                                    M
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}