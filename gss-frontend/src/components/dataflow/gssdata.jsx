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

// Per-flight-computer telemetry lives in a single map context keyed by serial number.
// The map identity changes per packet but un-updated SN slices keep their reference,
// so a future re-render-isolation layer can be added without changing call sites.
const GSSFCsCtx = React.createContext({});
const GSSGlobalsCtx = React.createContext(null);
const GSSCombinerCtx = React.createContext(null);
const GSSFCsHistCtx = React.createContext({});
const GSSRosterCtx = React.createContext([]);
const GSSSourcesCtx = React.createContext({});
const GSSAliasesCtx = React.createContext({ aliases: {}, setAlias: () => {}, removeAlias: () => {} });
const CMDStat = React.createContext(COMMAND_FEEDBACK_SETTINGS_DEFAULT);
const GSSChannel = React.createContext("sustainer");

// Channels reserved for non-FC slices. Anything else parsed off `@<channel>/...`
// is treated as an FC serial and looked up in the FCs map.
const GSS_CHANNEL = "GSS";
const COMBINER_CHANNEL = "gss_combiner";

const FC_ALIASES_STORAGE_KEY = "fc_aliases";
const FC_SOURCES_STORAGE_KEY = "fc_sources";

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
    // `value` carries the combined snapshot so sequencer callbacks see a merged view.
    // Per-FC slices live in `value.fcs`; setting one SN reuses the references of the
    // others, leaving room for re-render isolation if we add per-SN contexts later.
    const [value, setValue] = useState({ fcs: {}, GSS: null, gss_combiner: null });
    const [history, setHistory] = useState({}); // { "<sn>": [packets] }
    // Sources are FC roster announcers, keyed by their source_id (typically a
    // standalone-process identity like "<host>-<comport>"). Each entry tracks the
    // serials it currently reports active and the unix time it last published.
    const [sources, setSources] = useState({}); // { source_id: { serials: [int|null], time_published: number } }
    const [aliases, setAliases] = useState({}); // { "<sn>": "<user-set name>" }
    const [cmd_stat, set_cmd_stat] = useState(COMMAND_FEEDBACK_SETTINGS_DEFAULT);

    // Roster derives from the union of non-null serials reported across all live sources.
    // We don't filter by staleness here — the System tab surfaces per-source freshness.
    const roster = useMemo(() => {
        const sns = new Set();
        for (const source of Object.values(sources)) {
            for (const sn of (source.serials || [])) {
                if (sn != null) sns.add(String(sn));
            }
        }
        return [...sns].sort();
    }, [sources]);

    CLEAR_T_DATA_FUNC = () => {
        setValue({ fcs: {}, GSS: null, gss_combiner: null });
        setHistory({});
        setSources({});
    };

    useEffect(() => {
        // Load previously persisted data. We guard the shapes carefully because
        // we have a long enough rename history that stale localStorage from older
        // builds is plausible — and a malformed entry will blow up consumers
        // (e.g. useTelemetryHistory) deep in the render tree.
        if (getSetting("retain_on_reload")) {
            try {
                const stored_value = JSON.parse(localStorage.getItem("telem_snapshot"));
                if (
                    stored_value &&
                    typeof stored_value === 'object' &&
                    !Array.isArray(stored_value) &&
                    stored_value.fcs &&
                    typeof stored_value.fcs === 'object' &&
                    !Array.isArray(stored_value.fcs)
                ) {
                    setValue(stored_value);
                }
            } catch (e) { /* corrupted; ignore */ }

            try {
                const stored_history = JSON.parse(localStorage.getItem("telem_history"));
                if (stored_history && typeof stored_history === 'object' && !Array.isArray(stored_history)) {
                    const cleaned = {};
                    for (const [k, v] of Object.entries(stored_history)) {
                        if (Array.isArray(v)) cleaned[k] = v;
                    }
                    setHistory(cleaned);
                }
            } catch (e) { /* corrupted; ignore */ }
        }

        // FC aliases are user-set, persist independently of retain_on_reload.
        try {
            const stored_aliases = JSON.parse(localStorage.getItem(FC_ALIASES_STORAGE_KEY));
            if (stored_aliases && typeof stored_aliases === 'object') setAliases(stored_aliases);
        } catch (e) {
            // corrupted storage; ignore
        }

        // Sources roster: persisted so a page reload doesn't blank the MIDAS dropdown
        // before the backend replays / next heartbeat arrives. Stale entries get a visible
        // "last seen Xs ago" age in the System tab so they aren't mistaken for live ones.
        try {
            const stored_sources = JSON.parse(localStorage.getItem(FC_SOURCES_STORAGE_KEY));
            if (stored_sources && typeof stored_sources === 'object' && !Array.isArray(stored_sources)) {
                const cleaned = {};
                for (const [k, v] of Object.entries(stored_sources)) {
                    if (v && typeof v === 'object') {
                        cleaned[k] = {
                            serials: Array.isArray(v.serials) ? v.serials : [],
                            time_published: typeof v.time_published === 'number' ? v.time_published : null,
                        };
                    }
                }
                setSources(cleaned);
            }
        } catch (e) {
            // corrupted storage; ignore
        }

        socket.on("sync_response", (syncdata) => {
            const { type, data } = JSON.parse(syncdata);
            console.log("Sync invoked: ", type);
            if (type === "globals") {
                setValue(prev => {
                    const next = { ...prev, GSS: data };
                    global_state_callbacks.forEach(cb => cb());
                    __SEQUENCER_UPDATE_EVENTS({ ...next.fcs, GSS: next.GSS, gss_combiner: next.gss_combiner });
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

            // DEBUG: surface every relayed packet so we can confirm the frontend is seeing them.
            // Trim the payload preview to keep the console scannable when telemetry is firing.
            console.log(`[WS RX] type=${type}`, json_data?.metadata, json_data?.source_id ? `source_id=${json_data.source_id}` : "");

            if (type === "telemetry") {
                // FC telemetry: backend tags metadata.stream with the bare serial number.
                const sn = json_data.metadata.stream;
                const data_ret_policy = getSetting("data_retention");

                setValue(prev => {
                    const next_fcs = { ...prev.fcs, [sn]: json_data };
                    const next = { ...prev, fcs: next_fcs };
                    // Sequencer expects a flat snapshot keyed by channel name.
                    __SEQUENCER_UPDATE_EVENTS({ ...next_fcs, GSS: next.GSS, gss_combiner: next.gss_combiner });
                    return next;
                });

                setHistory(prev => {
                    const arr = prev[sn] ?? [];
                    const nh = [...arr, json_data];
                    const trimmed = (data_ret_policy >= 0 && nh.length > data_ret_policy)
                        ? nh.slice(-data_ret_policy)
                        : nh;
                    return { ...prev, [sn]: trimmed };
                });

                telemetry_callbacks.forEach(cb => cb());
                return;
            }

            if (type === "gss_health") {
                setValue(prev => {
                    const next = { ...prev, gss_combiner: json_data };
                    __SEQUENCER_UPDATE_EVENTS({ ...next.fcs, GSS: next.GSS, gss_combiner: next.gss_combiner });
                    return next;
                });
                telemetry_callbacks.forEach(cb => cb());
                return;
            }

            if (type === "serial_info") {
                // FC roster heartbeat from a standalone. Payload shape:
                // { type, serials: [int|null,...], time_published, source_id }
                const source_id = json_data?.source_id;
                console.log(`[serial_info] source_id=${source_id} serials=${JSON.stringify(json_data?.serials)} time_published=${json_data?.time_published}`);
                if (source_id != null) {
                    setSources(prev => {
                        const next = {
                            ...prev,
                            [source_id]: {
                                serials: Array.isArray(json_data.serials) ? json_data.serials : [],
                                time_published: json_data.time_published ?? null,
                            },
                        };
                        console.log("[serial_info] sources now:", next);
                        return next;
                    });
                } else {
                    console.warn("[serial_info] dropped — missing source_id", json_data);
                }
                return;
            }

            if (type === "serial_info_remove") {
                // Standalone LWT (or graceful shutdown tombstone): drop the source.
                // Roster recomputes via useMemo and the dropdown updates.
                const source_id = json_data?.source_id;
                console.log(`[serial_info] removing source_id=${source_id}`);
                if (source_id != null) {
                    setSources(prev => {
                        if (!(source_id in prev)) return prev;
                        const next = { ...prev };
                        delete next[source_id];
                        return next;
                    });
                }
                return;
            }

            if (type === "gss_msg") {
                setValue(prev => {
                    const merged = prev.GSS ? { ...prev.GSS, ...json_data.data } : json_data.data;
                    const next = { ...prev, GSS: merged };
                    global_state_callbacks.forEach(cb => cb());
                    __SEQUENCER_UPDATE_EVENTS({ ...next.fcs, GSS: next.GSS, gss_combiner: next.gss_combiner });
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
    const historyRef = useRef(history);

    useEffect(() => {
        valueRef.current = value;
        historyRef.current = history;
    }, [value, history]);

    useEffect(() => {
        const iv = setInterval(() => {
            try {
                localStorage.setItem("telem_snapshot", JSON.stringify(valueRef.current));
                localStorage.setItem("telem_history", JSON.stringify(historyRef.current));
            } catch (e) {
                // storage quota exceeded or serialization failure; skip this tick
            }
        }, 1000);
        return () => clearInterval(iv);
    }, []);

    // Aliases: user-driven, low-volume — write synchronously on change.
    useEffect(() => {
        try {
            localStorage.setItem(FC_ALIASES_STORAGE_KEY, JSON.stringify(aliases));
        } catch (e) {
            // ignore
        }
    }, [aliases]);

    // Sources: low-volume (one heartbeat per standalone every few seconds) — write on change.
    useEffect(() => {
        try {
            localStorage.setItem(FC_SOURCES_STORAGE_KEY, JSON.stringify(sources));
        } catch (e) {
            // ignore
        }
    }, [sources]);

    // Stable callbacks for the aliases context. Defined inside Provider so they
    // capture the current setter, but memoized so consumers don't re-render
    // when only the alias map changes.
    const aliasesCtxValue = useMemo(() => ({
        aliases,
        setAlias: (sn, name) => {
            setAliases(prev => {
                const trimmed = (name ?? "").trim();
                if (!trimmed) {
                    if (!(sn in prev)) return prev;
                    const next = { ...prev };
                    delete next[sn];
                    return next;
                }
                if (prev[sn] === trimmed) return prev;
                return { ...prev, [sn]: trimmed };
            });
        },
        removeAlias: (sn) => {
            setAliases(prev => {
                if (!(sn in prev)) return prev;
                const next = { ...prev };
                delete next[sn];
                return next;
            });
        },
    }), [aliases]);

    return (
        <GSSChannel.Provider value={default_stream}>
            <GSSFCsCtx.Provider value={value.fcs}>
                <GSSGlobalsCtx.Provider value={value.GSS}>
                    <GSSCombinerCtx.Provider value={value.gss_combiner}>
                        <GSSFCsHistCtx.Provider value={history}>
                            <GSSRosterCtx.Provider value={roster}>
                                <GSSSourcesCtx.Provider value={sources}>
                                    <GSSAliasesCtx.Provider value={aliasesCtxValue}>
                                        <CMDStat.Provider value={cmd_stat}>
                                            {children}
                                        </CMDStat.Provider>
                                    </GSSAliasesCtx.Provider>
                                </GSSSourcesCtx.Provider>
                            </GSSRosterCtx.Provider>
                        </GSSFCsHistCtx.Provider>
                    </GSSCombinerCtx.Provider>
                </GSSGlobalsCtx.Provider>
            </GSSFCsCtx.Provider>
        </GSSChannel.Provider>
    );
}

/** Sorted list of currently-active FC serial numbers, unioned across all standalones'
 *  serial_info heartbeats. Strings (since topic-derived stream IDs are strings). */
export function useFCRoster() {
    return React.useContext(GSSRosterCtx);
}

/** Display-format an SN as a zero-padded 3-digit string ("7" → "007", "13" → "013").
 *  Internal channel keys stay unpadded — only the rendered label changes. */
export function formatSN(sn) {
    return String(sn ?? "").padStart(3, '0');
}

/** Map of source_id → { serials, time_published } reported on Common/serial_info/+.
 *  Use for the System tab to show which standalones are reporting and how fresh. */
export function useFCSources() {
    return React.useContext(GSSSourcesCtx);
}

/** [aliases, setAlias, removeAlias] — user-set names for FCs, persisted to localStorage.
 *  setAlias("8", "") removes the alias. */
export function useFCAliases() {
    const { aliases, setAlias, removeAlias } = React.useContext(GSSAliasesCtx);
    return [aliases, setAlias, removeAlias];
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
// Telemetry codes name a value by `@<channel>/<path>`, where <channel> is either a flight-computer
// serial number (e.g. "8", "13"), the literal "GSS" for global state, or "gss_combiner" for combiner
// health. <path> walks the slice with dots: "@8/value.highG_ax".
//
// A code beginning with "/" uses the currently selected default channel set by the GSSChannel
// context. Setting GSSChannel to "8" makes "/value.highG_ax" resolve to "@8/value.highG_ax".

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

// Extracts a value from a flat snapshot keyed by channel (SN, "GSS", or "gss_combiner").
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

// Resolve a parsed channel name to its slice, walking the appropriate context.
// `fcs`, `GSS`, `combiner` are all already subscribed via useContext at the call
// site so hook ordering stays stable regardless of which channel we route to.
function resolveSlice(channel, fcs, GSS, combiner) {
    if (channel === GSS_CHANNEL) return GSS;
    if (channel === COMBINER_CHANNEL) return combiner;
    return fcs?.[channel];
}

export function useTelemetryRaw(telem_code = undefined, metadata = false, defaultvalue = null) {
    // All hook calls are unconditional and in stable order — safe even if telem_code
    // varies between renders.
    const default_channel = React.useContext(GSSChannel);
    const fcs = React.useContext(GSSFCsCtx);
    const GSS = React.useContext(GSSGlobalsCtx);
    const combiner = React.useContext(GSSCombinerCtx);

    if (telem_code === undefined) return undefined;
    const parsed = parseChannelAndPath(telem_code, default_channel);
    if (!parsed) return defaultvalue;
    const slice = resolveSlice(parsed.channel, fcs, GSS, combiner);
    return extractFromSlice(slice, parsed.path, metadata, parsed.channel, defaultvalue);
}

export function useTelemetry(telem_code = undefined, metadata = false, defaultvalue = null) {
    const default_channel = React.useContext(GSSChannel);
    const fcs = React.useContext(GSSFCsCtx);
    const GSS = React.useContext(GSSGlobalsCtx);
    const combiner = React.useContext(GSSCombinerCtx);

    if (telem_code === undefined) return undefined;
    const parsed = parseChannelAndPath(telem_code, default_channel);
    if (!parsed) return defaultvalue;
    const slice = resolveSlice(parsed.channel, fcs, GSS, combiner);

    const calc = telemetry_calculator_hooks[parsed.full_code];
    if (calc) {
        const [target_code, fn] = calc;
        const target_parsed = parseChannelAndPath(target_code, default_channel);
        if (!target_parsed) return defaultvalue;
        const target_slice = resolveSlice(target_parsed.channel, fcs, GSS, combiner);
        const raw = extractFromSlice(target_slice, target_parsed.path, metadata, target_parsed.channel, null) ?? 0;
        return fn(raw);
    }
    return extractFromSlice(slice, parsed.path, metadata, parsed.channel, defaultvalue);
}

/** Functionally equivalent to useTelemetry but returns historical values arranged oldest to newest.
 *  History is only retained for FC telemetry channels — GSS / gss_combiner return []. */
export function useTelemetryHistory(telem_code = undefined, metadata = false, defaultvalue = null) {
    const default_channel = React.useContext(GSSChannel);
    const histMap = React.useContext(GSSFCsHistCtx);

    let parsed = null;
    let channel = default_channel;
    if (telem_code !== undefined) {
        parsed = parseChannelAndPath(telem_code, default_channel);
        if (parsed) channel = parsed.channel;
    }

    // ?? alone wouldn't catch a non-array value (e.g. corrupted localStorage); be explicit.
    const histRaw = histMap?.[channel];
    const hist = Array.isArray(histRaw) ? histRaw : [];
    const full_code = parsed?.full_code;
    const path = parsed?.path;
    const calc = full_code ? telemetry_calculator_hooks[full_code] : null;

    return useMemo(() => {
        if (telem_code === undefined) return hist;
        if (!parsed) return [];

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
