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
import { time_series } from "../dataflow/derivatives";
import IdleStreamOverlay, { PreStreamOverlay, GoodbyeStreamOverlay } from "./IdleOverlay";
import { TargetDescriptionOverlay } from "./TargetDescriptionOverlay";
import { GenericISSStreamComingSoon, GenericISSStreamGoodbye } from "./Special";

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
    const [obs_scene_list, set_obs_scene_list] = useState([]);
    const [obs_shotgun1, set_obs_shotgun1] = useState(false);
    const [obs_shotgun2, set_obs_shotgun2] = useState(false);
    const [obs_radiochatter, set_obs_radiochatter] = useState(false);
    const [obs_mic_builtin, set_obs_mic_builtin] = useState(false);
    const [obs_use_input_fallback, set_obs_use_input_fallback] = useState(false);
    const [obs_server_ip, set_obs_server_ip] = useState("192.168.0.200");

    useEffect(() => {
        addRecalculator("@sustainer/value.barometer_altitude", CONVERSIONS.METER_TO_FEET);
        addRecalculator("@sustainer/value.altitude", CONVERSIONS.METER_TO_FEET);
        addRecalculator("@booster/value.barometer_altitude", CONVERSIONS.METER_TO_FEET)
        addRecalculator("@sustainer/value.kf_velocity", CONVERSIONS.METER_TO_FEET);
        addRecalculator("@booster/value.kf_velocity", CONVERSIONS.METER_TO_FEET);
    })


    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const spot_vis = useTelemetry("@GSS/stream_spot_overlay_visible") || false;
    const top_timer_vis = useTelemetry("@GSS/stream_top_timer_visible") || false;
    const timeline_vis = useTelemetry("@GSS/stream_timeline_visible") || false;
    const stream_target_desc_vis = useTelemetry("@GSS/stream_target_desc_visible") || false;

    const stream_target_TITLE = useTelemetry("@GSS/stream_target_desc_TITLE") || false;
    const stream_target_SUBTITLE = useTelemetry("@GSS/stream_target_desc_SUBTITLE") || false;

    const idle_reasontext = useTelemetry("@GSS/stream_idle_reason_text") || false;

    const has_booster_telem = useTelemetry("@booster/src") != null;
    const has_sustainer_telem = useTelemetry("@sustainer/src") != null;

    const sync_vars = useSyncGlobalVars();

    const sus_angle = useTelemetry("@sustainer/value.tilt_angle") || 0;
    const boo_angle = useTelemetry("@booster/value.tilt_angle") || 0;

    const booster_alt = useTelemetry("@booster/value.barometer_altitude") || 0;
    const sustainer_alt = useTelemetry("@sustainer/value.barometer_altitude") || 0;

    const booster_vel = useTelemetry("@booster/value.kf_velocity") || 0;
    const sustainer_vel = useTelemetry("@sustainer/value.kf_velocity") || 0;

    // Switch Baro / GPS views:
    const sustainer_has_gps_lock = (useTelemetry("@sustainer/value.sat_count") || 0) > 0;
    const sustainer_gps_alt = (useTelemetry("@sustainer/value.altitude") || 0);
    let real_sustainer_alt = sustainer_alt;
    let cur_alt_view = "";
    let alt_text_alternate_style = ""

    if(sustainer_has_gps_lock && (sustainer_gps_alt > 80000 || sustainer_alt > 80000)) {
        // If the sustainer is detected above 80kft and we have lock, switch the sustainer altitude to GPS mode.
        real_sustainer_alt = sustainer_gps_alt;
        cur_alt_view = "(GPS)"
    } else {
        if(!sustainer_has_gps_lock && (sustainer_alt > 80000)) {
            alt_text_alternate_style = "alt-text-no-gps-lock"
            cur_alt_view = "(B)"
        }
    }

    // KF Fail fallback
    // If the KF explodes again make sure we can see descent vel on the stream
    const sustainer_kf_fallback = Math.abs(sustainer_vel) > 6500;
    const booster_kf_fallback = Math.abs(booster_vel) > 6500;
    let sustainer_kf_append = "";
    let booster_kf_append = ""

    let sustainer_vel_real = useTelemetry("@sustainer/value.kf_velocity") || 0;
    let booster_vel_real = useTelemetry("@booster/value.kf_velocity") || 0;

    if(sustainer_kf_fallback) {
        const sus_ve_frame = time_series("@sustainer/value.barometer_altitude") || [{m: 0, b:0}, [], []];
        sustainer_vel_real = sus_ve_frame[0].m || 0;
        sustainer_kf_append = "(F)"
    }

    if(booster_kf_fallback) {
        const boo_ve_frame = time_series("@booster/value.barometer_altitude") || [{m: 0, b:0}, [], []];
        booster_vel_real = boo_ve_frame[0].m || 0;
        booster_kf_append = "(F)"
    }

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
            const {currentProgramSceneName, scenes} = await obs.call('GetSceneList');
            set_obs_current_scene(currentProgramSceneName);
            set_obs_scene_list(scenes);
            console.log(scenes);
        }, 150)

        let itv_slow = setInterval(async () => {
            try {
                let out = await obs.call('GetInputMute', {inputName: "SHOTGUN_MIC_1"});
                set_obs_shotgun1(!out.inputMuted);
    
                out = await obs.call('GetInputMute', {inputName: "SHOTGUN_MIC_2"});
                set_obs_shotgun2(!out.inputMuted);
    
                out = await obs.call('GetInputMute', {inputName: "RADIO_AUDIO"});
                set_obs_radiochatter(!out.inputMuted);
    
                out = await obs.call('GetInputMute', {inputName: "MIC_BUILTIN"});
                set_obs_mic_builtin(!out.inputMuted);

                set_obs_use_input_fallback(false);
            } catch {
                console.warn("[STREAM] Error : Inputs do not match expected values! Using fallback.")
                set_obs_use_input_fallback(true);
            }

        }, 500)


        return () => {
            clearInterval(itv_fast);
            clearInterval(itv_slow);
        }

    }, [has_obsws_conn])

    return (
        <>
            <ShowPathExact path={"/stream/pre_v2"}>
                <GenericISSStreamComingSoon event_text={idle_reasontext}/>
            </ShowPathExact>
            <ShowPathExact path={"/stream/goodbye_v2"}>
                <GenericISSStreamGoodbye event_text={idle_reasontext} />
            </ShowPathExact>
            <IdleStreamOverlay REASONTEXT={idle_reasontext} />
            <PreStreamOverlay />
            <GoodbyeStreamOverlay />
            <ShowPathExact path={"/stream/control"}>
                <FlightCountTimer />
                <ValueGroup label="Connection">
                    <div>Status: <b>{stat_msg_conn}</b></div>
                    <div>
                        <b>Video Server IP:</b> <input value={obs_server_ip} onChange={(e) => {set_obs_server_ip(e.target.value)}} />
                    </div>
                    <GSSButton variant={has_obsws_conn ? "green" : "red"} onClick={() => {

                            if(has_obsws_conn) {
                                obs.disconnect();
                                return;
                            }

                            set_attempting_conn(true);
                            set_stat_msg("Connecting...");
                            obs.connect(`ws://${obs_server_ip}:4455`, "issuiuc").then(() => {
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

                <ValueGroup label="Text Control">
                    <ValueGroup label="Target Descriptor">
                        <GSSButton variant={stream_target_desc_vis ? "blue" : "red"} onClick={() => {
                                sync_vars({"stream_target_desc_visible": !stream_target_desc_vis});
                            }}>
                                TARGET DESC: {stream_target_desc_vis ? "ON" : "OFF"}
                        </GSSButton>
                        <div>
                            <div>
                                Note: Changing these values will update the view in realtime.
                            </div>
                            <div>
                                <b>Target Descriptor TITLE:</b> <input value={stream_target_TITLE ? stream_target_TITLE : ""} onChange={(e) => {
                                    sync_vars({"stream_target_desc_TITLE": e.target.value});
                                }}></input>
                            </div>
                            <div>
                                <b>Target Descriptor SUBTITLE:</b> <input value={stream_target_SUBTITLE ? stream_target_SUBTITLE : ""} onChange={(e) => {
                                    sync_vars({"stream_target_desc_SUBTITLE": e.target.value});
                                }}></input>
                            </div>
                        </div>
                    </ValueGroup>
                    <ValueGroup label="Stream Idle">
                        <div>
                            <div>
                                Note: Changing this values will update the view in realtime.
                            </div>
                            <div>
                                <b>Stream Idle Reason:</b> <input value={idle_reasontext ? idle_reasontext : ""} onChange={(e) => {
                                    sync_vars({"stream_idle_reason_text": e.target.value});
                                }}></input>
                            </div>
                        </div>
                    </ValueGroup>
                </ValueGroup>

                <ValueGroup label="Stream Control" hidden={!has_obsws_conn} hidden_label_text="NO OBS CONNECTION">
                    <ValueGroup label={"VIDEO"}>
                        <div>
                            Current view: {obs_current_scene ? obs_current_scene : "UNKNOWN"}
                        </div>

                        {obs_scene_list.map(({sceneName}) => {
                            return <SceneSelectorButton scene_name={sceneName} is_connected={has_obsws_conn} cur_scene={obs_current_scene} />
                        })}

                    </ValueGroup>
                    <ValueGroup label={"AUDIO"} hidden={obs_use_input_fallback} hidden_label_text={"WARN: Input fallback triggered"}>
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
                <PassiveTimer progName={"Aether II"} visible={top_timer_vis} />
                <TimelineView progName={"Aether II"} visible={timeline_vis} />
                <TargetDescriptionOverlay TITLE={stream_target_TITLE} SUBTITLE={stream_target_SUBTITLE} visible={stream_target_desc_vis} />
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
                                            VELOCITY {booster_kf_append}
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-main">
                                        {formatTelemetryDigits(booster_vel_real, 4)}
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
                                            ALTITUDE {cur_alt_view}
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className={`overlay-row-telem-main ${alt_text_alternate_style}`}>
                                        {formatTelemetryDigits(real_sustainer_alt, 6)}
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
                                            VELOCITY {sustainer_kf_append}
                                        </div>
                                    </div>
                                </div>

                                <div className="overlay-v-align">
                                    <div className="overlay-row-telem-main">
                                        {formatTelemetryDigits(sustainer_vel_real, 4)}
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