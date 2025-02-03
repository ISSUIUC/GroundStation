import { useEffect, useState } from "react";
import { addRecalculator, useGlobalStateCallback, useSyncGlobalVars, useTelemetry } from "../dataflow/gssdata";
import { ShowPathExact } from "../reusable/UtilityComponents";
import { CountdownTimer } from "./CountdownTimer";
import "./StreamCommon.css"
import { ValueGroup } from "../reusable/ValueDisplay";
import { BoosterSVG, SustainerSVG } from "./OverlayVis";
import { CONVERSIONS } from "../dataflow/settings";

function PassiveTimer({ progName, visible }) {
    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const fade_classname = visible ? "generic-fade-in" : "generic-fade-out"
    const grow_classname = visible ? "stream-passive-timer-sep-in" : "stream-passive-timer-sep-out"
    return (
        <div className="stream-passive-timer-wrapper">
            <div className="stream-passive-timer">
                <div className={`stream-passive-timer-main start-hidden ${fade_classname}`}>
                    <span className="stream-passive-timer-m-text">T-</span>
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

function formatTelemetryDigits(value, num_digits) {
    // Formats telemetry in the overlay view format, I.E: Altitude 00 000FT, velocity 0 000ft
    // Will cap at maximum value if value is greater than precision offered by num_digits.

    let max_value_abs = Number("9".repeat(num_digits))
    let value_abs = Math.round(Math.abs(value))

    if(value_abs > max_value_abs) {
        value_abs = max_value_abs;
    }

    const value_digits = value_abs.toString().split("").slice(-num_digits)

    let zero_pad = (num_digits - value_digits.length);
    let zero_pad_left = zero_pad
    let output_num = ""
    let space_ctr = 0

    while(zero_pad_left > 3) {
        output_num += "000 ";
        zero_pad_left -= 3;
    }

    output_num += "0".repeat(zero_pad_left)
    space_ctr = zero_pad_left

    for(let i = 0; i < value_digits.length; i++) {        
        if(space_ctr % 3 == 0 && space_ctr != 0) {
            output_num += " ";
        }
        output_num += value_digits[i];
        space_ctr++;
    }

    return `${value < 0 ? "-" : " "}${output_num.padStart()}`;
}

export default function OverlayController() {

    /** The stream uses imperial units, irregardless of the current selected unit system.
     * As such we need specific sources for this telemetry that effectively translate from meters to feet.
     */

    useEffect(() => {
        addRecalculator("@sustainer/value.barometer_altitude", CONVERSIONS.METER_TO_FEET);
        addRecalculator("@booster/value.barometer_altitude", CONVERSIONS.METER_TO_FEET)
    })

    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");
    const spot_vis = useTelemetry("@GSS/stream_spot_overlay_visible") || false;
    const top_timer_vis = useTelemetry("@GSS/stream_top_timer_visible") || false;

    const has_booster_telem = useTelemetry("@booster/src") != null;
    const has_sustainer_telem = useTelemetry("@sustainer/src") != null;

    const sync_vars = useSyncGlobalVars();

    const sus_angle = useTelemetry("@sustainer/value.tilt_angle") || 0;
    const boo_angle = useTelemetry("@booster/value.tilt_angle") || 0;

    
    const booster_alt = useTelemetry("@booster/value.barometer_altitude") || 0;
    const sustainer_alt = useTelemetry("@sustainer/value.barometer_altitude") || 0;

    return (
        <>
            <ShowPathExact path={"/stream/control"}>
                <ValueGroup label="Visibility">
                    <button onClick={() => {
                        sync_vars({"stream_spot_overlay_visible": !spot_vis});
                    }}>toggle spot vis</button>
                    <button onClick={() => {
                        sync_vars({"stream_top_timer_visible": !top_timer_vis});
                    }}>toggle top vis</button>
                </ValueGroup>

            </ShowPathExact>

            <ShowPathExact path={"/stream"}>
                <div className={`spot-overlay start-hidden spot-overlay-${spot_vis ? "in" : "out"}`} />
                <PassiveTimer progName={"Aether I"} visible={top_timer_vis} />
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
                                        {formatTelemetryDigits(0, 4)}
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
                                {timer_paused ? "HOLD" : "LAUNCH"}
                            </div>
                            <div className="overlay-spot-timer-main">
                                T-<CountdownTimer digitmode={3} />
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
                                        {formatTelemetryDigits(0, 4)}
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