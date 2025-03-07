import { useEffect, useState } from "react";
import GSSButton from "../reusable/Button";
import { ValueGroup } from "../reusable/ValueDisplay";
import { obs } from "./OverlayController";
import { useSyncGlobalVars, useTelemetry } from "../dataflow/gssdata";
import "./StreamCommon.css"

const set_scene = async (scene_name) => {
    // Precondition: OBS is connected!
    await obs.call('SetCurrentProgramScene', {sceneName: scene_name});
}

const set_input_status = async (input, is_on) => {
    // Precondition: OBS is connected!
    await obs.call('SetInputMute', {inputName: input, inputMuted: !is_on});
}

export const LivestreamSequencer = ({ connected }) => {
    const sync_vars = useSyncGlobalVars();

    const LIVESTREAM_SEQUENCER_STATES = [
        /* Longer takes, starting at T-300 */
        {t: -296.00, desc: "SETUP SYNCVARS", title: "SYNCVARS", func: () => {sync_vars({"stream_spot_overlay_visible": false, "stream_top_timer_visible": true, "stream_timeline_visible": true});}},
        {t: -295.50, desc: "SETUP AUDIO", title: "AUDIO SET", func: () => {set_input_status("SHOTGUN_MIC_1", false); set_input_status("SHOTGUN_MIC_2", false); set_input_status("MIC_BUILTIN", false); set_input_status("RADIO_AUDIO", true)}},
        {t: -295.00, desc: "TO IPCAM_2", title: "BEGIN SEQUENCE", func: () => {set_scene("IPCAM_2")}},
        {t: -250.00, desc: "TO IPCAM_1", title: "VIEW GROUND STATION", func: () => {set_scene("IPCAM_1")}},
        {t: -235.00, desc: "TO IPCAM_2", title: "VIEW PAD", func: () => {set_scene("IPCAM_2")}},
        {t: -200.00, desc: "TO IPCAM_1", title: "VIEW GROUND STATION", func: () => {set_scene("IPCAM_1")}},
        {t: -165.00, desc: "DISABLE TIMELINE VIEW", title: "HIDE TIMELINE", func: () => {sync_vars({"stream_timeline_visible": false});}},
        {t: -160.00, desc: "TO IPCAM_2", title: "VIEW PAD", func: () => {set_scene("IPCAM_2")}},
        {t: -100.00, desc: "TO IPCAM_1", title: "VIEW GROUND STATION", func: () => {set_scene("IPCAM_1")}},
        {t: -95.00, desc: "ENABLE TIMELINE VIEW", title: "SHOW TIMELINE", func: () => {sync_vars({"stream_timeline_visible": true});}},
        /* The final stretch */
        {t: -75.00, desc: "TO ROCKET_LIVE", title: "INTERNAL VIEW", func: () => {set_scene("ROCKET_LIVE")}},
        {t: -45.00, desc: "TO IPCAM_1", title: "VIEW GROUND STATION", func: () => {set_scene("IPCAM_1")}},
        {t: -35.00, desc: "TO IPCAM_2", title: "PAD VIEW", func: () => {set_scene("IPCAM_2")}},
        {t: -34.00, desc: "DISABLE TIMELINE VIEW", title: "HIDE TIMELINE (FINAL)", func: () => {sync_vars({"stream_timeline_visible": false});}},
        {t: -20.00, desc: "TO ROCKET_LIVE", title: "PRIME TERMINAL COUNT", func: () => {set_scene("ROCKET_LIVE")}},
        {t: -12.00, desc: "FADE IN SPOT VIS", title: "TC VISUAL (1/2)", func: () => {sync_vars({"stream_spot_overlay_visible": true, "stream_top_timer_visible": true});}},
        {t: -11.00, desc: "FADE OUT TIM VIS", title: "TC VISUAL (2/2)", func: () => {sync_vars({"stream_spot_overlay_visible": true, "stream_top_timer_visible": false});}},
        {t: 0.00, desc: "NO OPERATION", title: "IGNITION", func: () => {}}
    ]

    const [sqcr_enabled, set_sqcr_enabled] = useState(false);
    const [sequencer_time, set_sequencer_time] = useState(-999999);
    const [next_sqcr_state, set_next_sqcr_state] = useState(0);

    const timer_val = useTelemetry("@GSS/countdown_t0") || null;
    const timer_paused = useTelemetry("@GSS/countdown_t0_paused") || false;

    useEffect(() => {
        if(timer_val == null) { return; }
        if(timer_paused) { return; }
        let intv = setInterval(() => {
            const sqcr_time = (Date.now() - timer_val) / 1000;
            set_sequencer_time(sqcr_time);

            // Check sequencer states
            if(!connected || !sqcr_enabled) { return; } // Ignore if we're not connected 
            if(next_sqcr_state >= LIVESTREAM_SEQUENCER_STATES.length) { return; } // we're done

            let NEXT_STATE = LIVESTREAM_SEQUENCER_STATES[next_sqcr_state];
            if(sqcr_time > NEXT_STATE.t) {
                NEXT_STATE.func(); // invoke state func
                set_next_sqcr_state(next_sqcr_state + 1);
            }
            
        }, 20)

        return () => {
            clearInterval(intv);
        }
    }, [timer_val, timer_paused, sqcr_enabled, next_sqcr_state])

    let sqcr_visual = <></>
    if(next_sqcr_state < LIVESTREAM_SEQUENCER_STATES.length) {
        let first_elem = LIVESTREAM_SEQUENCER_STATES[next_sqcr_state]
        let first_vis = <div className="livestream-sequencer-next"><div className="livestream-sequencer-queue">
                <div className="row-nowrap-ls">
                    <div className="livestream-sequencer-title">{first_elem.title}</div>
                    <div className="livestream-sequencer-desc">{first_elem.desc}</div>
                    
                </div>
                <div>
                    <div className="livestream-sequencer-time">T {first_elem.t.toFixed(2)}</div>
                </div>
            </div></div>


        sqcr_visual = <>{first_vis}{LIVESTREAM_SEQUENCER_STATES.slice(next_sqcr_state+1).map((stat) => {
            return (
            <div className="livestream-sequencer-queue">
                <div className="row-nowrap-ls">
                    <div className="livestream-sequencer-title">{stat.title}</div>
                    <div className="livestream-sequencer-desc">{stat.desc}</div>
                </div>
                <div>
                    <div className="livestream-sequencer-time">T {stat.t.toFixed(2)}</div>
                </div>
            </div>
            )
        })}</>
    }

    return (
        <ValueGroup label="Sequencer" hidden={!connected} hidden_label_text="NO OBS CONNECTION">
                <div>
                    <div>The button below controls the livestream sequencer.</div>
                    <div className="big-text-warn">This state is not synced across the network. Ensure this screen is focused for proper sequencer control!</div>
                    <div>Press the button below to cycle between (OFF | AUTO)</div>
                </div>
                <GSSButton variant={sqcr_enabled ? "blue" : "red"} onClick={() => {
                    set_sqcr_enabled(!sqcr_enabled);
                    console.log("Enabling AUTO mode for sqcr..");
                }}>
                    SEQUENCER: {sqcr_enabled ? "AUTO" : "OFF"}
                </GSSButton>
                <div>
                    <div className="livestream-sequencer-time">Current Sequencer T value: {sequencer_time.toFixed(2)}</div>
                </div>
                <div className="livestream-sequencer-collection">
                    {sqcr_visual}
                </div>

        </ValueGroup>
    )
}