import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { getSetting } from './settings';
import { __SEQUENCER_UPDATE_EVENTS } from './sequencer';

function ws_url(path="") {
    return window.location.hostname + ":5001" + path;
}

export function video_server_url(path="") {
    return window.location.hostname + ":5002" + path;
}

const COMMAND_FEEDBACK_SETTINGS_DEFAULT = {
    has_cmd: false,
    cur_cmd: "",
    cur_state: 0, // 0: SENT, 1: SV ACK, 2: MQTT ACK, 3: MIDAS SENT, 4: MIDAS ACK, 99: FAIL
    has_explicit_failure: false,
    last_event_t: Date.now()
}

const GSSData = React.createContext({});
const GSSTelemetryHistory = React.createContext([]); // Stores values of GSSData snapshot in "circular buffer", only updates snapshots when telemetry packets come in
const CMDStat = React.createContext(COMMAND_FEEDBACK_SETTINGS_DEFAULT);
const GSSChannel = React.createContext("sustainer");

export const useCommandFeedback = () => {
    return React.useContext(CMDStat);
}

export let requestCommandFeedback = (command) => {}; // Gets overridden by the provider
export let hideCommandFeedback = () => {} // Gets overridden by provider

const socket = io(ws_url(), {
    transports: ['websocket']
});

let global_state_callbacks = []; // Stores functions to invoke whenever the @GSS context changes
let telemetry_callbacks = []; // Stores functions to invoke whenever the GSSData context changes from a telemetry packet
let telemetry_calculator_hooks = {}; // Stores necessary translation functions (such as unit changes) to be used across the local system
// Calculator hooks are stored in the format {output1: [target, func]}, where target and output are telemetry codes (i.e. @booster/src)

export let CLEAR_T_DATA_FUNC = () => {}

export function useGlobalStateCallback(callable) {
    global_state_callbacks.push(callable);
}

export function useTelemetryCallback(callable) {
    telemetry_callbacks.push(callable);
}

export function clearCalculators() {
    telemetry_calculator_hooks = {};
}

export function addTranslator(valuehook, output, func) {
    if(telemetry_calculator_hooks[output] == undefined) {
        telemetry_calculator_hooks[output] = [valuehook, func]
    } else {
        console.warn(`addTranslator called with duplicate out-value ${output}, duplicate outvalues are not supported and will be overriden!`);
    }
}

export function addRecalculator(valuehook, func) {
    addTranslator(valuehook, valuehook, func);
}

export function GSSDataProvider({ children, default_stream }) {
    const [value, setValue] = useState({});
    const [hist, setHist] = useState([]);
    const [cmd_stat, set_cmd_stat] = useState(COMMAND_FEEDBACK_SETTINGS_DEFAULT)
    
    CLEAR_T_DATA_FUNC = () => {
        setValue({});
        setHist([]);
    }

    useEffect(async () => {

        // Load stored data
        if(getSetting("retain_on_reload")) {
            const stored_value = JSON.parse(localStorage.getItem("telem_snapshot"));
            const stored_hist = JSON.parse(localStorage.getItem("telem_history"));
    
            if(stored_value) {
                setValue(stored_value);
            }
    
            if(stored_hist) {
                setHist(stored_hist);
            }
        }

        socket.on("sync_response", (syncdata) => {
            // Sync response only gets called when a datasync is invoked, and should directly set the necessary sync variables
            let {type, data} = JSON.parse(syncdata);
            console.log("Sync invoked: ", type);
            if(type === "globals") {
                setValue(prevData => {
                    let new_state = {...prevData};
                    new_state["GSS"] = data;
                    
                    global_state_callbacks.forEach((callback) => {
                        callback();
                    })

                    __SEQUENCER_UPDATE_EVENTS(new_state); // Fire necessary sequencer events

                    return new_state;
                })
            }
            
        })

        socket.on('cmd_stat', (data) => {
            if(data == 99) {
                set_cmd_stat(prevData => {
                    let new_state = {...prevData};
                    new_state.has_explicit_failure = true;
                    return new_state;
                })
                return;
            }

            set_cmd_stat(prevData => {
                let new_state = {...prevData};
                new_state.cur_state = data;
                new_state.last_event_t = Date.now();
                return new_state;
            })
        })

        socket.on('mqtt_message', (data) => {
            if(!getSetting("global_sync")) {
                return;
            }


            let json_data = JSON.parse(data)
            if(json_data["metadata"]["type"] === "telemetry" || json_data["metadata"]["type"] === "gss_health") {
                // valid telemetry packet
                let channel = json_data["metadata"]["stream"]
                let data_ret_policy = getSetting("data_retention");

                setValue(prevData => {
                    let new_state = {...prevData};
                    new_state[channel] = json_data;
                    new_state["META_LOCAL"] = {triggered_update: channel, timestamp: Date.now()};

                    // Update history if it's a telemetry packet
                    if(json_data["metadata"]["type"] === "telemetry") {
                        setHist(prevHist => {
                            let new_hist = [...prevHist, new_state];
                            // Maintain circular buffer
                            if(new_hist.length > data_ret_policy && data_ret_policy >= 0) {
                                new_hist = new_hist.slice(-data_ret_policy)
                            }
                            return new_hist;
                        })
                    }

                    __SEQUENCER_UPDATE_EVENTS(new_state); // Fire necessary sequencer events

                    return new_state;
                })

                telemetry_callbacks.forEach((callback) => {
                    callback();
                })
            }
            if(json_data["metadata"]["type"] === "gss_msg") {
                // Not a telemetry packet, just set the necessary values in the "GSS" channel
                setValue(prevData => {
                    let ns = json_data["data"];
                    if(prevData["GSS"]) {
                        ns = {...prevData["GSS"], ...json_data["data"]}
                    }

                    let new_state = {...prevData};
                    new_state["GSS"] = ns;
                    
                    global_state_callbacks.forEach((callback) => {
                        callback();
                    })

                    __SEQUENCER_UPDATE_EVENTS(new_state); // Fire necessary sequencer events

                    return new_state;
                })

            }
        });

        requestCommandFeedback = (command) => {
            set_cmd_stat({
                has_cmd: true,
                cur_cmd: command,
                cur_state: 0, // 0: SENT, 1: SV ACK, 2: MQTT ACK, 3: MIDAS SENT, 4: MIDAS ACK, 99: FAIL
                has_explicit_failure: false,
                last_event_t: Date.now()
            })
        }

        hideCommandFeedback = () => {
            set_cmd_stat({
                has_cmd: false,
                cur_cmd: "",
                cur_state: 0, // 0: SENT, 1: SV ACK, 2: MQTT ACK, 3: MIDAS SENT, 4: MIDAS ACK, 99: FAIL
                has_explicit_failure: false,
                last_event_t: Date.now()
            })
        }

        return () => {
            socket.disconnect();
        }
    }, [])

    useEffect(() => {
        localStorage.setItem("telem_snapshot", JSON.stringify(value));
        localStorage.setItem("telem_history", JSON.stringify(hist));
    }, [value, hist])

    return (
        <GSSChannel.Provider value={default_stream}>
            <GSSData.Provider value={value}>
                <GSSTelemetryHistory.Provider value={hist}>
                    <CMDStat.Provider value={cmd_stat}>
                        {children}
                    </CMDStat.Provider>
                </GSSTelemetryHistory.Provider>
            </GSSData.Provider>
        </GSSChannel.Provider>
    )
}

export function useGSSWebsocket(event_tag="gss") {
    /**
     * Returns a function that encodes and sends a message to the GSS server. Does not auto-publish to MQTT
     */

    const send = (data_string) => {
        socket.emit(event_tag, data_string);
    }

    return send;
}

export function useGSSMQTTCMD() {
    /**
     * Sends data to the network raw.
     */

    const sendws = useGSSWebsocket();
    const send = (channel_name, js_object) => {
        // Accepts only a string
        const payload = {"source": "gss-frontend", "type": "mqtt-autosend-cmd", "stream": channel_name, "data": JSON.stringify(js_object)};
        sendws(JSON.stringify(payload));
    }

    return send;
}

export function useGSSMQTTRaw() {
    /**
     * Sends data to the network raw.
     */

    const sendws = useGSSWebsocket();
    const send = (channel_name, js_object) => {
        // Accepts only a string
        const payload = {"source": "gss-frontend", "type": "mqtt-autosend-raw", "stream": channel_name, "data": JSON.stringify(js_object)};
        sendws(JSON.stringify(payload));
    }

    return send;
}

export function useGSSMQTT() {
    /**
     * Returns a function that encodes and sends a js object as JSON data to the GSS server. Wraps it in additional metadata to send the data to the network as well.
     */

    const sendws = useGSSWebsocket();
    const send = (channel_name, js_object) => {
        // Accepts only a string
        const payload = {"source": "gss-frontend", "type": "mqtt-autosend", "stream": channel_name, "data": JSON.stringify(js_object)};
        sendws(JSON.stringify(payload));
    }

    return send;
}

export function useSyncGlobalVars() {
    /**
     * Returns a function that lets you synchronize global variables between gss-frontend instances
     */
    const send_mqtt = useGSSMQTT()
    const sync = (js_object) => {
        send_mqtt("Common", js_object);
    }

    return sync;
}

export function useChannel() {
    return React.useContext(GSSChannel);
}

function getTelemetryRaw(snapshot=null, telem_code=undefined, metadata=false, defaultvalue=null) {
    // telemetry code system:
    // Passing in a telemetry code basically indicates what value you are trying to access from the telemetry system.
    // Since our telemetry is shared between booster/sustainer/common/etc networks, you need to specify which network you are accessing
    // This is done with the leading @prefix/, such as @booster/, @sustainer/, followed by the code for the given value.
    // For instance, to get sustainer highG_ax, you would pass "@sustainer/highG_ax".
    // If the packet structure is nested, then you can access further down values using the . separator. EX: "@sustainer/highG.ax"

    // Starting a telemetry code with '/' will indicate to use the currently selected "default", set at the top level by the GSS provider.
    // This allows you to contextually switch which stream you are accessing depending on the value of the GSSStream react context.
    // I.E: Setting GSSstream to "booster" will automatically transliterate "/value.highG_ax" to "@booster/value.highG_ax"

    if(snapshot==null) {
        snapshot = React.useContext(GSSData);
    }

    if(telem_code === undefined) {
        return snapshot;
    }

    // Get prefix
    const channel_regex = /^@(.*)\// // This matches the @.../ pattern, and returns the inner part (...) as a capture group
    const channel_match = telem_code.match(channel_regex)
    if(channel_match === null) {
        return "NOCHAN"
    }


    if(!snapshot[channel_match[1]]) {
        return defaultvalue // The data not being present is valid, but returns null here so that the caller can handle it by short circuiting.
    }

    // Since telemetry packets are split into "metadata" and "data" we automatically target "data" here for ease of readibility, unless specified otherwise
    let r_valuetype = metadata ? "metadata" : "data";

    // The exception is for the "GSS" channel.
    let r_value = snapshot[channel_match[1]]
    if(channel_match[1] !== "GSS") {
        r_value = r_value[r_valuetype];
    }
    
    
    let tree = telem_code.slice(channel_match[0].length).split(".");
    for (let i = 0; i < tree.length; i++) {
        r_value = r_value[tree[i]];
        if(r_value === undefined) {
            console.warn("Telemetry code " + telem_code + " is invalid, no data found at " + tree[i]);
            return null; // Code not being here is also valid, but let's warn the user since maybe they made a typo
            
        }
    }

    return r_value;
}

export function useTelemetrySnapshot(snapshot, telem_code=undefined, metadata=false, defaultvalue=null) {
    if(telemetry_calculator_hooks[telem_code]) {
        // This telemetry data is translated
        const [target_code, translator_func] = telemetry_calculator_hooks[telem_code]
        const raw_telem = getTelemetryRaw(snapshot, target_code, metadata, defaultvalue) || 0;
        return translator_func(raw_telem);
    }

    return getTelemetryRaw(snapshot, telem_code, metadata, defaultvalue);
}

export function get_channel_from_telem_code(telem_code) {
    /** * Returns the channel from a telemetry code, or the default channel if no channel is specified.
     * If the telemetry code starts with a '/', it will use the default channel from the GSSChannel context.
    */

    if(telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        telem_code = "@" + gss_default_channel + telem_code;
    }

    const channel_regex = /^@(.*)\//; // This matches the @.../ pattern, and returns the inner part (...) as a capture group
    const channel_match = telem_code.match(channel_regex);
    if(channel_match === null) {
        return "NOCHAN"; // No channel specified
    }
    return [channel_match[1], telem_code.split("/")[1]] // Return the channel name and the rest of the telemetry code
}

/** Functionally equivalent to useTelemetry, but instead returns historical values arranged from earliest to oldest. */
export function useTelemetryHistory(telem_code=undefined, metadata=false, defaultvalue=null) {
    if(telem_code === undefined) {
        return React.useContext(GSSTelemetryHistory); // But why
    }
    let channel = telem_code.split("/")[0];
    if(telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        channel = gss_default_channel;
        telem_code = "@" + gss_default_channel + telem_code;
    }

    const h_data = React.useContext(GSSTelemetryHistory);

    // Make sure only the data triggered by the current stage makes it in.
    const h_data_filtered = h_data.filter((telemetry_snapshot) => {
        if(!telemetry_snapshot["META_LOCAL"]) {
            // No metadata, so we assume this is a telemetry packet that was not triggered by an update
            return false;
        }
        if(telemetry_snapshot["META_LOCAL"]["triggered_update"] == channel) {
            return true;
        }
        return false;
    });

    return h_data_filtered.map((telemetry_snapshot) => {
        if(telemetry_calculator_hooks[telem_code]) {
            // This telemetry data is translated
            const [target_code, translator_func] = telemetry_calculator_hooks[telem_code]
            const raw_telem = getTelemetryRaw(telemetry_snapshot, target_code, metadata, defaultvalue) || 0;
            return translator_func(raw_telem);
        }
    
        return getTelemetryRaw(telemetry_snapshot, telem_code, metadata, defaultvalue);
    })
}

export function useTelemetryRaw(telem_code=undefined, metadata=false, defaultvalue=null) {
    /**
     * Gets raw telem values (translators are not applied)
     */
    if(telem_code===undefined) {
        return getTelemetryRaw(undefined, false, null);
    }

    if(telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        telem_code = "@" + gss_default_channel + telem_code;
    }

    const telemetry_snapshot = React.useContext(GSSData);
    return getTelemetryRaw(telemetry_snapshot, telem_code, metadata, defaultvalue);
}

export function useTelemetry(telem_code=undefined, metadata=false, defaultvalue=null) {

    if(telem_code===undefined) {
        return getTelemetryRaw(undefined, false, null);
    }

    if(telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        telem_code = "@" + gss_default_channel + telem_code;
    }

    const telemetry_snapshot = React.useContext(GSSData);
    
    if(telemetry_calculator_hooks[telem_code]) {
        // This telemetry data is translated
        const [target_code, translator_func] = telemetry_calculator_hooks[telem_code]
        const raw_telem = getTelemetryRaw(telemetry_snapshot, target_code, metadata, defaultvalue) || 0;
        return translator_func(raw_telem);
    }

    return getTelemetryRaw(telemetry_snapshot, telem_code, metadata, defaultvalue);
}

function syncGlobals() {
    const send = useGSSWebsocket("sync");

    send("sync_globals");
}

/** After defining all systems, request a sync from the global vars packet */
syncGlobals();