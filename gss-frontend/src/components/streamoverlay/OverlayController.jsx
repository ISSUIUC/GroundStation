import { useEffect, useState } from "react";
import { addRecalculator, useGlobalStateCallback, useSyncGlobalVars, useTelemetry } from "../dataflow/gssdata";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"
import { ValueGroup } from "../reusable/ValueDisplay";
import { BoosterSVG, SustainerSVG } from "./OverlayVis";
import { CONVERSIONS } from "../dataflow/settings";
import { state_int_to_state_name } from "../dataflow/midasconversion";
import GSSButton from "../reusable/Button";
import { FlightCountTimer } from "../spec/FlightCountTimer";

import { OBSWebSocket } from 'obs-websocket-js';
import { LivestreamSequencer } from "./LivestreamSequencer";

export const obs = new OBSWebSocket();

function PassiveTimer({ progName, visible }) {
    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const fade_classname = visible ? "generic-fade-in" : "generic-fade-out"
    const grow_classname = visible ? "stream-passive-timer-sep-in" : "stream-passive-timer-sep-out"
    return (
        <div className="stream-passive-timer-wrapper">
            <div className="stream-passive-timer">
                <div className={`stream-passive-timer-main start-hidden ${fade_classname}`}>
                    <span className="stream-passive-timer-m-text">T</span>
                    <CountdownTimer digitmode={4} anim={false} />
                </div>
                <div className={`stream-passive-timer-sep ${grow_classname}`} />
                <div className={`stream-passive-timer-name start-hidden ${fade_classname}`}>
                    {progName}
                </div>
            </div>
            <div className={`stream-passive-timer-hold-wrapper start-hidden ${fade_classname}`}>
                <div className={`stream-passive-timer-hold ${timer_paused ? "" : "stream-hide"}`}>
                    HOLD
                </div>
            </div>
        </div>

    );
}

const LAUNCH_TIMELINE = [
    {t: "8:00:00", desc: "INTEGRATION STARTS"},
    {t: "2:00:00", desc: "BEGIN PAD LOAD"},
    {t: "1:30:00", desc: "GROUND SYSTEMS SETUP"},
    {t: "1:00:00", desc: "VEHICLE VERTICAL"},
    {t: "0:30:00", desc: "VEHICLE POWER-ON"},
    {t: "0:10:00", desc: "GO / HALT"},
    {t: "0:05:00", desc: "ELECTRONICS PRIMED"},
    {t: "0:01:00", desc: "FINAL CHECKOUTS"},
    {t: "0:00:20", desc: "TERMINAL COUNT"},
    {t: "0:00:00", desc: "LAUNCH"},
]

function TimelineView({ progName, visible }) {
    const fade_classname = visible ? "generic-fade-in" : "generic-fade-out"
    return (
        <div className={`stream-timeline-wrapper start-hidden ${fade_classname}`}>
            <div className="stream-timeline">
                <div className="stream-timeline-title">
                    <div className="stream-timeline-title-t">ILLINOIS SPACE SOCIETY "{progName}"</div>
                    <div className="stream-timeline-title-b">LAUNCH TIMELINE</div>
                </div>
                <div className="stream-timeline-holder">

                    {LAUNCH_TIMELINE.map((event) => {
                        return (<div className="stream-timeline-elem">
                            <div className="stream-timeline-elem-T">T- {event.t}</div>
                            <div className="stream-timeline-elem-desc">{event.desc}</div>
                        </div>)
                    })}
                </div>
                <div className="stream-timeline-footer">
                    ALL TIMES APPROXIMATE
                </div>
            </div>
        </div>

    );
}

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

const SceneSelectorButton = ({ scene_name, is_connected, cur_scene }) => {
    return (
        <div>
            <GSSButton variant={cur_scene===scene_name ? "blue" : "red"} onClick={async () => {
                if(!is_connected) { return; }
                await obs.call('SetCurrentProgramScene', {sceneName: scene_name});
            }}>
                SWITCH VIEW TO <b>{scene_name}</b>
            </GSSButton>
        </div>
    )
}

const AudioToggleButton = ({ audio_name, audio_input_name, is_connected, is_on }) => {
    return (
    <div>
        <GSSButton variant={is_on ? "blue" : "red"} onClick={async () => {
            if(!is_connected) {return;}
            await obs.call('SetInputMute', {inputName: audio_input_name, inputMuted: is_on});
        }}>
            {audio_name}: <b>{is_on ? "ON" : "OFF"}</b>
        </GSSButton>
    </div>
    )
}



export default function OverlayController() {

    /** The stream uses imperial units, irregardless of the current selected unit system.
     * As such we need specific sources for this telemetry that effectively translate from meters to feet.
     */

    const [has_obsws_conn, set_has_obsws_conn] = useState(false);
    const [attempting_conn, set_attempting_conn] = useState(false);
    const [stat_msg_conn, set_stat_msg] = useState("Awaiting connection event");

    // Controller stuff
    const [obs_current_scene, set_obs_current_scene] = useState(null);
    const [obs_shotgun1, set_obs_shotgun1] = useState(false);
    const [obs_shotgun2, set_obs_shotgun2] = useState(false);
    const [obs_radiochatter, set_obs_radiochatter] = useState(false);
    const [obs_mic_builtin, set_obs_mic_builtin] = useState(false);

    useEffect(() => {
        addRecalculator("@sustainer/value.barometer_altitude", CONVERSIONS.METER_TO_FEET);
        addRecalculator("@booster/value.barometer_altitude", CONVERSIONS.METER_TO_FEET)
    })


    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const spot_vis = useTelemetry("@GSS/stream_spot_overlay_visible") || false;
    const top_timer_vis = useTelemetry("@GSS/stream_top_timer_visible") || false;
    const timeline_vis = useTelemetry("@GSS/stream_timeline_visible") || false;

    const has_booster_telem = useTelemetry("@booster/src") != null;
    const has_sustainer_telem = useTelemetry("@sustainer/src") != null;

    const sync_vars = useSyncGlobalVars();

    const sus_angle = useTelemetry("@sustainer/value.tilt_angle") || 0;
    const boo_angle = useTelemetry("@booster/value.tilt_angle") || 0;

    const booster_alt = useTelemetry("@booster/value.barometer_altitude") || 0;
    const sustainer_alt = useTelemetry("@sustainer/value.barometer_altitude") || 0;

    const booster_vel = useTelemetry("@booster/value.kf_velocity") || 0;
    const sustainer_vel = useTelemetry("@sustainer/value.kf_velocity") || 0;

    let fsm_state = useTelemetry("@sustainer/value.FSM_State");
    if(fsm_state == null) {
        fsm_state = -1;
    }

    useEffect(() => {
        obs.on("ConnectionClosed", () => {
            set_has_obsws_conn(false);
            set_stat_msg("Connection has been closed");
        })
    }, [])

    useEffect(() => {
        if(!has_obsws_conn) { return; }

        let itv_fast = setInterval(async () => {
            const {currentProgramSceneName} = await obs.call('GetCurrentProgramScene');
            set_obs_current_scene(currentProgramSceneName);
        }, 150)

        let itv_slow = setInterval(async () => {
            let out = await obs.call('GetInputMute', {inputName: "SHOTGUN_MIC_1"});
            set_obs_shotgun1(!out.inputMuted);

            out = await obs.call('GetInputMute', {inputName: "SHOTGUN_MIC_2"});
            set_obs_shotgun2(!out.inputMuted);

            out = await obs.call('GetInputMute', {inputName: "RADIO_AUDIO"});
            set_obs_radiochatter(!out.inputMuted);

            out = await obs.call('GetInputMute', {inputName: "MIC_BUILTIN"});
            set_obs_mic_builtin(!out.inputMuted);
        }, 500)


        return () => {
            clearInterval(itv_fast);
            clearInterval(itv_slow);
        }

    }, [has_obsws_conn])

    return (
        <>
            <ShowPathExact path={"/stream/control"}>
                <FlightCountTimer />
                <ValueGroup label="Connection">
                    <div>Status: <b>{stat_msg_conn}</b></div>
                    <GSSButton variant={has_obsws_conn ? "green" : "red"} onClick={() => {

                            if(has_obsws_conn) {
                                obs.disconnect();
                                return;
                            }

                            set_attempting_conn(true);
                            set_stat_msg("Connecting...");
                            obs.connect("ws://127.0.0.1:4455", "issuiuc").then(() => {
                                console.log("Connected!");
                                set_attempting_conn(false);
                                set_stat_msg("Connected!");
                                set_has_obsws_conn(true);
                            }).catch(() => {
                                console.log("Failed to connect");
                                set_stat_msg("Failed to connect");
                                set_attempting_conn(false);
                            })
                            
                        }}>
                            {has_obsws_conn ? "CONNECTED TO STREAM (Click to Disconnect)" : (attempting_conn ? "CONNECTING..." : "CONNECT TO STREAM")}
                    </GSSButton>
                </ValueGroup>

                <ValueGroup label="Visibility">
                    <div>

                        <GSSButton variant={spot_vis ? "blue" : "red"} onClick={() => {
                            sync_vars({"stream_spot_overlay_visible": !spot_vis});
                        }}>
                            BOTTOM OVERLAY: {spot_vis ? "ON" : "OFF"}
                        </GSSButton>
                    </div>
                    <div>
                        <GSSButton variant={top_timer_vis ? "blue" : "red"} onClick={() => {
                                sync_vars({"stream_top_timer_visible": !top_timer_vis});
                            }}>
                                TIMER OVERLAY: {top_timer_vis ? "ON" : "OFF"}
                        </GSSButton>
                    </div>
                    <div>
                        <GSSButton variant={timeline_vis ? "blue" : "red"} onClick={() => {
                                sync_vars({"stream_timeline_visible": !timeline_vis});
                            }}>
                                TIMELINE OVERLAY: {timeline_vis ? "ON" : "OFF"}
                        </GSSButton>
                    </div>
                </ValueGroup>

                <ValueGroup label="Stream Control" hidden={!has_obsws_conn} hidden_label_text="NO OBS CONNECTION">
                    <ValueGroup label={"VIDEO"}>
                        <div>
                            Current view: {obs_current_scene ? obs_current_scene : "UNKNOWN"}
                        </div>

                        <SceneSelectorButton scene_name={"IPCAM_1"} is_connected={has_obsws_conn} cur_scene={obs_current_scene} />
                        <SceneSelectorButton scene_name={"IPCAM_2"} is_connected={has_obsws_conn} cur_scene={obs_current_scene} />
                        <SceneSelectorButton scene_name={"CAM_BUILTIN"} is_connected={has_obsws_conn} cur_scene={obs_current_scene} />
                        <SceneSelectorButton scene_name={"ROCKET_LIVE"} is_connected={has_obsws_conn} cur_scene={obs_current_scene} />

                    </ValueGroup>
                    <ValueGroup label={"AUDIO"}>
                        <AudioToggleButton audio_name={"SHOTGUN MIC 1"} audio_input_name={"SHOTGUN_MIC_1"} is_connected={has_obsws_conn} is_on={obs_shotgun1} />
                        <AudioToggleButton audio_name={"SHOTGUN MIC 2"} audio_input_name={"SHOTGUN_MIC_2"} is_connected={has_obsws_conn} is_on={obs_shotgun2} />
                        <AudioToggleButton audio_name={"RADIO CHATTER"} audio_input_name={"RADIO_AUDIO"} is_connected={has_obsws_conn} is_on={obs_radiochatter} />
                        <AudioToggleButton audio_name={"BUILT IN MIC / AUX"} audio_input_name={"MIC_BUILTIN"} is_connected={has_obsws_conn} is_on={obs_mic_builtin} />
                    </ValueGroup>
                </ValueGroup>

                <LivestreamSequencer connected={has_obsws_conn} />
            </ShowPathExact>

            <ShowPathExact path={"/stream"}>
                <div className={`spot-overlay start-hidden spot-overlay-${spot_vis ? "in" : "out"}`} />
                <PassiveTimer progName={"Aether"} visible={top_timer_vis} />
                <TimelineView progName={"Aether"} visible={timeline_vis} />
                <div className={`overlay-position-bottom start-hidden overlay-row-${spot_vis ? "in" : "out"}`}>
                    <div className="overlay-row">

                        <div className={`overlay-row-group ${has_booster_telem ? "" : "overlay-row-group-disabled"}`}>
                            <div className="overlay-row-telem-group">
                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-title">
                                        <div className="overlay-row-telem-title-name">
                                            BOOSTER
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
                                            BOOSTER
                                        </div>
                                        <div className="overlay-row-telem-title-qty">
                                            VELOCITY
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-main">
                                        {formatTelemetryDigits(booster_vel, 4)}
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
                                        <div className="overlay-tilt-wrapper">
                                        <div className={`overlay-tilt-hind ${spot_vis ? "tilt-hind-in" : "tilt-hind-out"}`} />
                                        <div className={`overlay-tilt-vind ${spot_vis ? "tilt-vind-in" : "tilt-vind-out"}`} />
                                        <BoosterSVG visible={spot_vis && has_booster_telem} angle={boo_angle} has_telem={has_booster_telem} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overlay-row-element">
                            <div className="overlay-spot-timer-above-label">
                                {timer_paused ? "HOLD" : state_int_to_state_name(fsm_state).replaceAll("_", " ")}
                            </div>
                            <div className="overlay-spot-timer-main">
                                T<CountdownTimer digitmode={3} />
                            </div>
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
                                            ALTITUDE
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-main">
                                        {formatTelemetryDigits(sustainer_alt, 6)}
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
                                            VELOCITY
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-main">
                                        {formatTelemetryDigits(sustainer_vel, 4)}
                                    </div>

                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-unit">
                                        FT/S
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </ShowPathExact>
        </>
    );
}