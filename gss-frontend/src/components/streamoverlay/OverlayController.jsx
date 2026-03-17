import { useEffect } from "react";
import { addRecalculator, useTelemetry, useTelemetryRaw } from "../dataflow/gssdata";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"
import { BoosterSVG, SustainerSVG } from "./OverlayVis";
import { CONVERSIONS } from "../dataflow/settings";
import { state_int_to_state_name } from "../dataflow/midasconversion";
import { FlightCountTimer } from "../spec/FlightCountTimer";
import standardAtmosphere from "standard-atmosphere";

import { time_series } from "../dataflow/derivatives";
import IdleStreamOverlay, { PreStreamOverlay, GoodbyeStreamOverlay, FunFactsOnly } from "./IdleOverlay";
import { TargetDescriptionOverlay } from "./TargetDescriptionOverlay";
import { GenericISSStreamComingSoon, GenericISSStreamGoodbye } from "./Special";
import { SponsorRotator } from "./Sponsors";
import { StreamMapOverlay } from "../views/MapView";
import StreamControlPanel from "../streamcontrol/StreamControlPanel";

// Re-export obs from service for backward compatibility with LivestreamSequencer
export { obs } from "../../services/obsService";

function PassiveTimer({ progName, visible, has_launched }) {
    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const use_stream_timer = useTelemetry("@GSS/use_stream_timer") || false;
    const fade_classname = visible ? "generic-fade-in" : "generic-fade-out"
    const grow_classname = visible ? "stream-passive-timer-sep-in" : "stream-passive-timer-sep-out"

    let t_text = <></>;
    if(use_stream_timer || has_launched) {
        t_text = <><span className="stream-passive-timer-m-text">T</span>
                    <CountdownTimer digitmode={4} anim={false} /></>
    }
    else {
        t_text = <span className="stream-passive-timer-m-text">STANDBY</span>
    }
    return (
        <div className="stream-passive-timer-wrapper">
            <div className="stream-passive-timer">
                <div className={`stream-passive-timer-main start-hidden ${fade_classname}`}>
                    {t_text}
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

export default function OverlayController() {

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
    const use_stream_timer = useTelemetry("@GSS/use_stream_timer") || false;
    const single_stage_mode = useTelemetry("@GSS/stream_single_stage_mode") || false;

    const stream_target_TITLE = useTelemetry("@GSS/stream_target_desc_TITLE") || false;
    const stream_target_SUBTITLE = useTelemetry("@GSS/stream_target_desc_SUBTITLE") || false;

    const idle_reasontext = useTelemetry("@GSS/stream_idle_reason_text") || false;

    const has_booster_telem = useTelemetry("@booster/src") != null;
    const has_sustainer_telem = useTelemetry("@sustainer/src") != null;

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
        real_sustainer_alt = sustainer_gps_alt;
        cur_alt_view = "(GPS)"
    } else {
        if(!sustainer_has_gps_lock && (sustainer_alt > 80000)) {
            alt_text_alternate_style = "alt-text-no-gps-lock"
            cur_alt_view = "(B)"
        }
    }

    // KF Fail fallback
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

    // Single-stage telemetry: acceleration (raw Gs) & mach
    const sus_accel_x = useTelemetryRaw("@sustainer/value.highG_ax") || 0;
    const sus_accel_y = useTelemetryRaw("@sustainer/value.highG_ay") || 0;
    const sus_accel_z = useTelemetryRaw("@sustainer/value.highG_az") || 0;
    const sus_accel_gs = Math.sqrt(sus_accel_x**2 + sus_accel_y**2 + sus_accel_z**2);

    const sus_alt_baro_raw = useTelemetryRaw("@sustainer/value.barometer_altitude") || 0;
    const sus_vel_raw = useTelemetryRaw("@sustainer/value.kf_velocity") || 0;
    const { ssound: sus_ssound } = standardAtmosphere(sus_alt_baro_raw, true);
    const sus_mach = sus_ssound > 0 ? Math.abs(sus_vel_raw) / sus_ssound : 0;

    let fsm_state = useTelemetry("@sustainer/value.FSM_State");
    if(fsm_state == null) {
        fsm_state = -1;
    }

    let has_launched = (fsm_state > 2)
    let timer_div = <><div className="overlay-spot-timer-above-label">
            {has_launched ? (state_int_to_state_name(fsm_state).replaceAll("_", " ")) : (fsm_state > 1 ? "AWAITING LAUNCH" : "AWAITING ARMING")}
        </div>
        <div className="overlay-spot-timer-main">
            {has_launched ? (<>T<CountdownTimer digitmode={3} /></>) : (fsm_state > 1 ? "ARMED" : "STANDBY")}
        </div></>

    if(use_stream_timer) {
        timer_div = <><div className="overlay-spot-timer-above-label">
            {timer_paused ? "HOLD" : state_int_to_state_name(fsm_state).replaceAll("_", " ")}
        </div>
        <div className="overlay-spot-timer-main">
            T<CountdownTimer digitmode={3} />
        </div></>
    }

    return (
        <>
            <ShowPathExact path={"/stream/facts"}>
                <FunFactsOnly />
            </ShowPathExact>
            <ShowPathExact path={"/stream/sponsors"}>
                <SponsorRotator />
            </ShowPathExact>
            <ShowPathExact path={"/stream/pre_v2"}>
                <GenericISSStreamComingSoon event_text={idle_reasontext}/>
            </ShowPathExact>
            <ShowPathExact path={"/stream/goodbye_v2"}>
                <GenericISSStreamGoodbye event_text={idle_reasontext} />
            </ShowPathExact>
            <IdleStreamOverlay REASONTEXT={idle_reasontext} />
            <PreStreamOverlay />
            <GoodbyeStreamOverlay />
            <ShowPathExact path={"/stream/map"}>
                <StreamMapOverlay />
            </ShowPathExact>
            <ShowPathExact path={"/stream/control"}>
                <FlightCountTimer />
                <StreamControlPanel />
            </ShowPathExact>

            <ShowPathExact path={"/stream"}>
                <div className={`spot-overlay start-hidden spot-overlay-${spot_vis ? "in" : "out"}`} />
                <PassiveTimer progName={"Aether II"} visible={top_timer_vis} has_launched={has_launched} />
                <TimelineView progName={"Aether II"} visible={timeline_vis} />
                <TargetDescriptionOverlay TITLE={stream_target_TITLE} SUBTITLE={stream_target_SUBTITLE} visible={stream_target_desc_vis} />
                <div className={`overlay-position-bottom start-hidden overlay-row-${spot_vis ? "in" : "out"}`}>
                    {single_stage_mode ? (
                        /* ---- Single-stage: [spacer, alt, vel] | timer | [tilt, accel, mach] ---- */
                        <div className="overlay-row">
                            <div className={`overlay-row-group ${has_sustainer_telem ? "" : "overlay-row-group-disabled"}`}>
                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">ALTITUDE</div>
                                            <div className="overlay-row-telem-title-qty">{cur_alt_view || "BAROMETRIC"}</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className={`overlay-row-telem-main ${alt_text_alternate_style}`}>
                                            {formatTelemetryDigits(real_sustainer_alt, 6)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT</div>
                                    </div>
                                </div>

                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">VELOCITY</div>
                                            <div className="overlay-row-telem-title-qty">{sustainer_kf_append || "KALMAN"}</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {formatTelemetryDigits(sustainer_vel_real, 4)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT/S</div>
                                    </div>
                                </div>
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
                                            <div className="overlay-row-telem-title-name">ACCEL</div>
                                            <div className="overlay-row-telem-title-qty">FORCE</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {sus_accel_gs.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">G</div>
                                    </div>
                                </div>

                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">MACH</div>
                                            <div className="overlay-row-telem-title-qty">NUMBER</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {sus_mach.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ---- Multi-stage overlay: booster + sustainer ---- */
                        <div className="overlay-row">

                            <div className={`overlay-row-group ${has_booster_telem ? "" : "overlay-row-group-disabled"}`}>
                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">BOOSTER</div>
                                            <div className="overlay-row-telem-title-qty">ALTITUDE</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {formatTelemetryDigits(booster_alt, 6)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT</div>
                                    </div>
                                </div>

                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">BOOSTER</div>
                                            <div className="overlay-row-telem-title-qty">VELOCITY {booster_kf_append}</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {formatTelemetryDigits(booster_vel_real, 4)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT/S</div>
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
                                            <div className="overlay-row-telem-title-name">SUSTAINER</div>
                                            <div className="overlay-row-telem-title-qty">ALTITUDE {cur_alt_view}</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className={`overlay-row-telem-main ${alt_text_alternate_style}`}>
                                            {formatTelemetryDigits(real_sustainer_alt, 6)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT</div>
                                    </div>
                                </div>

                                <div className="overlay-row-telem-group">
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-title">
                                            <div className="overlay-row-telem-title-name">SUSTAINER</div>
                                            <div className="overlay-row-telem-title-qty">VELOCITY {sustainer_kf_append}</div>
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-main">
                                            {formatTelemetryDigits(sustainer_vel_real, 4)}
                                        </div>
                                    </div>
                                    <div className="overlay-v-align">
                                        <div className="overlay-row-telem-unit">FT/S</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </ShowPathExact>
        </>
    );
}
