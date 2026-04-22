import React, { useState, useEffect, useMemo, useRef } from 'react';
import io from 'socket.io-client';
import { getSetting } from './settings';
import { __SEQUENCER_UPDATE_EVENTS } from './sequencer';

function ws_url(path = "") {
    return window.location.hostname + ":5001" + path;
}

export function video_server_url(path = "") {
    return window.location.hostname + ":5002" + path;
}

const COMMAND_FEEDBACK_SETTINGS_DEFAULT = {
    has_cmd: false,
    cur_cmd: "",
    cur_state: 0, // 0: SENT, 1: SV ACK, 2: MQTT ACK, 3: MIDAS SENT, 4: MIDAS ACK, 99: FAIL
    has_explicit_failure: false,
    last_event_t: Date.now()
};

// Per-channel contexts. A packet for channel X only changes X's slice identity,
// so only consumers of that channel re-render. Consumers of sibling channels stay put.
const GSSBoosterCtx = React.createContext(null);
const GSSSustainerCtx = React.createContext(null);
const GSSGlobalsCtx = React.createContext(null);
const GSSCombinerCtx = React.createContext(null);
const GSSBoosterHistCtx = React.createContext([]);
const GSSSustainerHistCtx = React.createContext([]);
const CMDStat = React.createContext(COMMAND_FEEDBACK_SETTINGS_DEFAULT);
const GSSChannel = React.createContext("sustainer");

const VAL_CTX_BY_CHANNEL = {
    booster: GSSBoosterCtx,
    sustainer: GSSSustainerCtx,
    GSS: GSSGlobalsCtx,
    gss_combiner: GSSCombinerCtx,
};

const HIST_CTX_BY_CHANNEL = {
    booster: GSSBoosterHistCtx,
    sustainer: GSSSustainerHistCtx,
};

export const useCommandFeedback = () => React.useContext(CMDStat);

export let requestCommandFeedback = (command) => {}; // Overridden by the provider
export let hideCommandFeedback = () => {};           // Overridden by the provider

const socket = io(ws_url(), {
    transports: ['websocket']
});

let global_state_callbacks = [];
let telemetry_callbacks = [];
let telemetry_calculator_hooks = {};
// Calculator hooks are stored in the format {output1: [target, func]}, where target and output are telemetry codes.

export let CLEAR_T_DATA_FUNC = () => {};

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
    if (telemetry_calculator_hooks[output] === undefined) {
        telemetry_calculator_hooks[output] = [valuehook, func];
    } else {
        console.warn(`addTranslator called with duplicate out-value ${output}, duplicate outvalues are not supported and will be overriden!`);
    }
}

export function addRecalculator(valuehook, func) {
    addTranslator(valuehook, valuehook, func);
}

export function GSSDataProvider({ children, default_stream }) {
    // `value` is a combined dict so the sequencer still gets a merged snapshot,
    // but each Provider below passes a stable per-channel slice. When a sustainer
    // packet arrives we do {...prev, sustainer: new}; prev.booster reference is
    // preserved, so GSSBoosterCtx consumers don't re-render.
    const [value, setValue] = useState({ booster: null, sustainer: null, GSS: null, gss_combiner: null });
    const [boosterHist, setBoosterHist] = useState([]);
    const [sustainerHist, setSustainerHist] = useState([]);
    const [cmd_stat, set_cmd_stat] = useState(COMMAND_FEEDBACK_SETTINGS_DEFAULT);

    CLEAR_T_DATA_FUNC = () => {
        setValue({ booster: null, sustainer: null, GSS: null, gss_combiner: null });
        setBoosterHist([]);
        setSustainerHist([]);
    };

    useEffect(() => {
        // Load previously persisted data
        if (getSetting("retain_on_reload")) {
            try {
                const stored_value = JSON.parse(localStorage.getItem("telem_snapshot"));
                const stored_bhist = JSON.parse(localStorage.getItem("telem_history_booster"));
                const stored_shist = JSON.parse(localStorage.getItem("telem_history_sustainer"));
                if (stored_value) setValue(stored_value);
                if (stored_bhist) setBoosterHist(stored_bhist);
                if (stored_shist) setSustainerHist(stored_shist);
            } catch (e) {
                // corrupted storage; ignore
            }
        }

        socket.on("sync_response", (syncdata) => {
            const { type, data } = JSON.parse(syncdata);
            console.log("Sync invoked: ", type);
            if (type === "globals") {
                setValue(prev => {
                    const next = { ...prev, GSS: data };
                    global_state_callbacks.forEach(cb => cb());
                    __SEQUENCER_UPDATE_EVENTS(next);
                    return next;
                });
            }
        });

        socket.on('cmd_stat', (data) => {
            if (data === 99) {
                set_cmd_stat(prev => ({ ...prev, has_explicit_failure: true }));
                return;
            }
            set_cmd_stat(prev => ({ ...prev, cur_state: data, last_event_t: Date.now() }));
        });

        socket.on('mqtt_message', (data) => {
            if (!getSetting("global_sync")) return;

            const json_data = JSON.parse(data);
            const type = json_data?.metadata?.type;

            if (type === "telemetry" || type === "gss_health") {
                const channel = json_data.metadata.stream;
                const data_ret_policy = getSetting("data_retention");

                setValue(prev => {
                    const next = { ...prev, [channel]: json_data };
                    __SEQUENCER_UPDATE_EVENTS(next);
                    return next;
                });

                if (type === "telemetry") {
                    const append = prev => {
                        const nh = [...prev, json_data];
                        return (data_ret_policy >= 0 && nh.length > data_ret_policy)
                            ? nh.slice(-data_ret_policy)
                            : nh;
                    };
                    if (channel === "booster") setBoosterHist(append);
                    else if (channel === "sustainer") setSustainerHist(append);
                }

                telemetry_callbacks.forEach(cb => cb());
                return;
            }

            if (type === "gss_msg") {
                setValue(prev => {
                    const merged = prev.GSS ? { ...prev.GSS, ...json_data.data } : json_data.data;
                    const next = { ...prev, GSS: merged };
                    global_state_callbacks.forEach(cb => cb());
                    __SEQUENCER_UPDATE_EVENTS(next);
                    return next;
                });
            }
        });

        requestCommandFeedback = (command) => {
            set_cmd_stat({
                has_cmd: true,
                cur_cmd: command,
                cur_state: 0,
                has_explicit_failure: false,
                last_event_t: Date.now()
            });
        };

        hideCommandFeedback = () => {
            set_cmd_stat({
                has_cmd: false,
                cur_cmd: "",
                cur_state: 0,
                has_explicit_failure: false,
                last_event_t: Date.now()
            });
        };

        return () => {
            socket.disconnect();
        };
    }, []);

    // Debounced localStorage persistence: write at most once per second, independent of packet rate.
    // The previous implementation JSON.stringify'd the entire history on every packet (~20 Hz).
    const valueRef = useRef(value);
    const boosterHistRef = useRef(boosterHist);
    const sustainerHistRef = useRef(sustainerHist);

    useEffect(() => {
        valueRef.current = value;
        boosterHistRef.current = boosterHist;
        sustainerHistRef.current = sustainerHist;
    }, [value, boosterHist, sustainerHist]);

    useEffect(() => {
        const iv = setInterval(() => {
            try {
                localStorage.setItem("telem_snapshot", JSON.stringify(valueRef.current));
                localStorage.setItem("telem_history_booster", JSON.stringify(boosterHistRef.current));
                localStorage.setItem("telem_history_sustainer", JSON.stringify(sustainerHistRef.current));
            } catch (e) {
                // storage quota exceeded or serialization failure; skip this tick
            }
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    return (
        <GSSChannel.Provider value={default_stream}>
            <GSSBoosterCtx.Provider value={value.booster}>
                <GSSSustainerCtx.Provider value={value.sustainer}>
                    <GSSGlobalsCtx.Provider value={value.GSS}>
                        <GSSCombinerCtx.Provider value={value.gss_combiner}>
                            <GSSBoosterHistCtx.Provider value={boosterHist}>
                                <GSSSustainerHistCtx.Provider value={sustainerHist}>
                                    <CMDStat.Provider value={cmd_stat}>
                                        {children}
                                    </CMDStat.Provider>
                                </GSSSustainerHistCtx.Provider>
                            </GSSBoosterHistCtx.Provider>
                        </GSSCombinerCtx.Provider>
                    </GSSGlobalsCtx.Provider>
                </GSSSustainerCtx.Provider>
            </GSSBoosterCtx.Provider>
        </GSSChannel.Provider>
    );
}

// These "use*" helpers don't actually call any hooks — they're called both inside
// components AND at module load time (see syncGlobals below), so they must stay
// hook-free despite the naming convention.
export function useGSSWebsocket(event_tag = "gss") {
    return (data_string) => { socket.emit(event_tag, data_string); };
}

export function useGSSMQTTCMD() {
    const sendws = useGSSWebsocket();
    return (channel_name, js_object) => {
        const payload = { source: "gss-frontend", type: "mqtt-autosend-cmd", stream: channel_name, data: JSON.stringify(js_object) };
        sendws(JSON.stringify(payload));
    };
}

export function useGSSMQTTRaw() {
    const sendws = useGSSWebsocket();
    return (channel_name, js_object) => {
        const payload = { source: "gss-frontend", type: "mqtt-autosend-raw", stream: channel_name, data: JSON.stringify(js_object) };
        sendws(JSON.stringify(payload));
    };
}

export function useGSSMQTT() {
    const sendws = useGSSWebsocket();
    return (channel_name, js_object) => {
        const payload = { source: "gss-frontend", type: "mqtt-autosend", stream: channel_name, data: JSON.stringify(js_object) };
        sendws(JSON.stringify(payload));
    };
}

export function useSyncGlobalVars() {
    const send_mqtt = useGSSMQTT();
    return (js_object) => { send_mqtt("Common", js_object); };
}

export function useChannel() {
    return React.useContext(GSSChannel);
}

/** Subscribe to a raw Socket.IO event for the lifetime of a component. */
export function useSocketEvent(event, handler) {
    useEffect(() => {
        socket.on(event, handler);
        return () => socket.off(event, handler);
    }, [event, handler]);
}

// --- Telemetry lookup ---
// telemetry code system:
// Passing in a telemetry code indicates what value you are trying to access from the telemetry system.
// Since our telemetry is shared between booster/sustainer/common/etc networks, you need to specify which network.
// This is done with the leading @prefix/, such as @booster/, @sustainer/, followed by the code for the given value.
// For instance, to get sustainer highG_ax, you would pass "@sustainer/value.highG_ax".
// If the packet structure is nested, then you can access further down values using the . separator.
//
// Starting a telemetry code with '/' indicates to use the currently selected "default", set at the top level by the GSS provider.
// I.E: Setting GSSChannel to "booster" will automatically transliterate "/value.highG_ax" to "@booster/value.highG_ax"

function parseChannelAndPath(telem_code, default_channel) {
    if (telem_code[0] === '/') {
        telem_code = `@${default_channel}${telem_code}`;
    }
    const m = telem_code.match(/^@([^/]+)\//);
    if (!m) return null;
    const channel = m[1];
    const path = telem_code.slice(m[0].length).split('.');
    return { channel, path, full_code: telem_code };
}

// Extracts a value from a per-channel slice. For telemetry channels the slice
// is the packet (has metadata + data); for GSS the slice IS the globals dict.
function extractFromSlice(slice, path, metadata_flag, channel, defaultvalue) {
    if (slice == null) return defaultvalue;
    let v = (channel === "GSS") ? slice : (metadata_flag ? slice.metadata : slice.data);
    for (let i = 0; i < path.length; i++) {
        if (v == null) return defaultvalue;
        const next = v[path[i]];
        if (next === undefined) {
            console.warn(`Telemetry code invalid, no data found at ${path[i]}`);
            return null;
        }
        v = next;
    }
    return v;
}

// Extracts a value from a merged snapshot ({booster, sustainer, GSS, ...}).
function extractFromSnapshot(snapshot, telem_code, default_channel, metadata_flag, defaultvalue) {
    const parsed = parseChannelAndPath(telem_code, default_channel);
    if (!parsed) return defaultvalue;
    const { channel, path } = parsed;
    return extractFromSlice(snapshot?.[channel], path, metadata_flag, channel, defaultvalue);
}

export function get_channel_from_telem_code(telem_code) {
    if (telem_code[0] === "/") {
        const gss_default_channel = React.useContext(GSSChannel);
        telem_code = "@" + gss_default_channel + telem_code;
    }
    const m = telem_code.match(/^@(.*)\//);
    if (m === null) return "NOCHAN";
    return [m[1], telem_code.split("/")[1]];
}

export function useTelemetrySnapshot(snapshot, telem_code = undefined, metadata = false, defaultvalue = null) {
    // Pure function over a captured snapshot (called from sequencer callbacks).
    if (telem_code === undefined) return snapshot;

    const calc = telemetry_calculator_hooks[telem_code];
    if (calc) {
        const [target_code, fn] = calc;
        const raw = extractFromSnapshot(snapshot, target_code, null, metadata, null) ?? 0;
        return fn(raw);
    }
    return extractFromSnapshot(snapshot, telem_code, null, metadata, defaultvalue);
}

export function useTelemetryRaw(telem_code = undefined, metadata = false, defaultvalue = null) {
    // All hook calls are unconditional and in stable order — safe even if telem_code
    // varies between renders.
    const default_channel = React.useContext(GSSChannel);
    const parsed = telem_code !== undefined ? parseChannelAndPath(telem_code, default_channel) : null;
    const ctx = VAL_CTX_BY_CHANNEL[parsed?.channel] ?? GSSBoosterCtx;
    const slice = React.useContext(ctx);

    if (telem_code === undefined) return undefined;
    if (!parsed || !VAL_CTX_BY_CHANNEL[parsed.channel]) return defaultvalue;
    return extractFromSlice(slice, parsed.path, metadata, parsed.channel, defaultvalue);
}

export function useTelemetry(telem_code = undefined, metadata = false, defaultvalue = null) {
    const default_channel = React.useContext(GSSChannel);
    const parsed = telem_code !== undefined ? parseChannelAndPath(telem_code, default_channel) : null;
    const ctx = VAL_CTX_BY_CHANNEL[parsed?.channel] ?? GSSBoosterCtx;
    const slice = React.useContext(ctx);

    if (telem_code === undefined) return undefined;
    if (!parsed || !VAL_CTX_BY_CHANNEL[parsed.channel]) return defaultvalue;

    const calc = telemetry_calculator_hooks[parsed.full_code];
    if (calc) {
        const [target_code, fn] = calc;
        const target_parsed = parseChannelAndPath(target_code, default_channel);
        if (!target_parsed) return defaultvalue;
        // In practice translators are same-channel (see SettingsView.jsx callsites),
        // so we reuse the already-subscribed slice rather than subscribing to a second context.
        const raw = extractFromSlice(slice, target_parsed.path, metadata, parsed.channel, null) ?? 0;
        return fn(raw);
    }
    return extractFromSlice(slice, parsed.path, metadata, parsed.channel, defaultvalue);
}

/** Functionally equivalent to useTelemetry but returns historical values arranged oldest to newest. */
export function useTelemetryHistory(telem_code = undefined, metadata = false, defaultvalue = null) {
    const default_channel = React.useContext(GSSChannel);

    // Parse channel up front — fall back to sustainer context for the no-code case
    // so the hook call stays stable.
    let parsed = null;
    let channel = default_channel;
    if (telem_code !== undefined) {
        parsed = parseChannelAndPath(telem_code, default_channel);
        if (parsed) channel = parsed.channel;
    }

    const hist_ctx = HIST_CTX_BY_CHANNEL[channel] ?? GSSSustainerHistCtx;
    const hist = React.useContext(hist_ctx);

    const full_code = parsed?.full_code;
    const path = parsed?.path;
    const calc = full_code ? telemetry_calculator_hooks[full_code] : null;

    return useMemo(() => {
        if (telem_code === undefined) return hist;
        if (!parsed || !HIST_CTX_BY_CHANNEL[channel]) return [];

        if (calc) {
            const [target_code, fn] = calc;
            const target_parsed = parseChannelAndPath(target_code, default_channel);
            const target_path = target_parsed ? target_parsed.path : path;
            return hist.map(pkt => fn(extractFromSlice(pkt, target_path, metadata, channel, null) ?? 0));
        }
        return hist.map(pkt => extractFromSlice(pkt, path, metadata, channel, defaultvalue));
    }, [hist, telem_code, metadata, defaultvalue, channel, full_code, default_channel]);
}

function syncGlobals() {
    const send = useGSSWebsocket("sync");
    send("sync_globals");
}

/** After defining all systems, request a sync from the global vars packet */
syncGlobals();
