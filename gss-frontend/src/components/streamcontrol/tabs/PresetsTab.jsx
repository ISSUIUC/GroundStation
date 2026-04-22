import { useState, useEffect, useRef } from 'preact/hooks';
import { ValueGroup } from '../../reusable/ValueDisplay';
import { listStreamFormats, loadStreamFormat } from '../../../services/streamFormatLoader';

/*
 * Presets bundle: OBS scene(s) + overlay state + name tag text + optional audio.
 * Single-scene presets switch once. Cycling presets auto-rotate through
 * a list of scenes on a configurable timer (cycle_interval seconds).
 *
 * Audio is driven via an optional `audio` field that names an entry in the
 * stream format's `audio_presets` block — same convention SequencerTab uses.
 */

const DEFAULT_PRESETS = [
    {
        id: 'broll_cycle',
        name: 'B-Roll Cycle',
        description: 'Auto-rotate between cameras',
        scenes: ['IPCAM_1', 'IPCAM_2'],
        cycle_interval: 20,
        overlays: { spot_overlay: false, top_timer: true, timeline: false, target_desc: false },
    },
    {
        id: 'host_solo',
        name: 'Host Solo',
        description: 'Host camera',
        scene: 'GENERIC_HOST',
        overlays: { spot_overlay: false, top_timer: true, target_desc: true },
        target_desc: { title: 'HOST NAME', subtitle: 'Stream Host' },
    },
    {
        id: 'interview',
        name: 'Interview',
        description: 'Split host + interviewee',
        scene: 'HOST_INTERVIEWEE',
        overlays: { spot_overlay: false, top_timer: true, target_desc: true },
        target_desc: { title: 'INTERVIEWEE', subtitle: 'Team Lead' },
    },
    {
        id: 'launch',
        name: 'Launch',
        description: 'Launch camera with telemetry overlay',
        scene: 'ROCKET_LIVE',
        overlays: { spot_overlay: true, top_timer: false, timeline: true, target_desc: false },
    },
    {
        id: 'thank_you',
        name: 'Thank You / End',
        description: 'Static thank-you screen',
        scene: 'THANK_YOU',
        overlays: { spot_overlay: false, top_timer: false, timeline: false, target_desc: false },
    },
];

function buildPresetsFromYaml(config) {
    const audioPresets = config.audio_presets || {};

    // v2 format: has a top-level `presets` array
    if (config.presets) {
        const presets = config.presets.map((p) => {
            // Resolve scene keys to OBS scene names
            const resolveScene = (key) => config.scenes?.[key]?.obs_scene || key;

            return {
                id: p.id,
                name: p.name,
                description: p.description || '',
                scene: p.scene ? resolveScene(p.scene) : null,
                scenes: p.scenes ? p.scenes.map(resolveScene) : null,
                cycle_interval: p.cycle_interval || null,
                overlays: p.overlay_state || {},
                target_desc: p.target_desc || null,
                audio: p.audio || null,
            };
        });
        return { presets, audioPresets };
    }

    // v1 fallback: convert segments to presets
    if (config.segments) {
        const presets = config.segments.map((seg) => {
            const sceneDef = config.scenes?.[seg.scene];
            return {
                id: seg.id,
                name: seg.name,
                description: sceneDef?.description || '',
                scene: sceneDef?.obs_scene || null,
                scenes: null,
                cycle_interval: null,
                overlays: seg.overlay_state || {},
                target_desc: seg.target_desc || null,
                audio: seg.audio || null,
            };
        });
        return { presets, audioPresets };
    }

    return null;
}

function getAllScenes(preset) {
    if (preset.scenes && preset.scenes.length > 0) return preset.scenes;
    if (preset.scene) return [preset.scene];
    return [];
}

/**
 * Resolve a preset's `audio` field to a concrete list of input names that should be unmuted.
 *   - undefined input  -> undefined  (preset has no audio directive)
 *   - string reference -> list from audioPresets, or null if the reference is dangling
 *   - inline array     -> the array itself
 *   - anything else    -> null (malformed)
 */
function resolveAudioList(audio, audioPresets) {
    if (audio == null) return undefined;
    if (Array.isArray(audio)) return audio;
    if (typeof audio === 'string') {
        const resolved = audioPresets[audio];
        return Array.isArray(resolved) ? resolved : null;
    }
    return null;
}

/**
 * Build a multi-line hover string describing the audio state of a preset.
 * Returns null if the preset has no audio field (so callers can skip attaching a title).
 * Format:
 *     Audio: launch_broadcast
 *       ✓ RADIO_AUDIO
 *       ✗ SHOTGUN_MIC_1 (not in OBS)
 */
function formatAudioHover(preset, audioPresets, obsInputs) {
    if (preset.audio == null) return null;
    const onList = resolveAudioList(preset.audio, audioPresets);

    if (onList === null) {
        return `Audio preset "${preset.audio}" is referenced but not defined`;
    }
    if (!Array.isArray(onList)) {
        return `Audio field is malformed (expected string or list)`;
    }

    const header = Array.isArray(preset.audio)
        ? `Audio (inline, ${onList.length} source${onList.length === 1 ? '' : 's'}):`
        : `Audio: ${preset.audio}`;

    if (onList.length === 0) {
        return `${header}\n  (all sources muted)`;
    }

    const known = Object.keys(obsInputs || {});
    const lines = onList.map(name => {
        if (known.length === 0) return `  • ${name}`;        // OBS not enumerated yet — don't guess
        return known.includes(name) ? `  ✓ ${name}` : `  ✗ ${name} (not in OBS)`;
    });
    return `${header}\n${lines.join('\n')}`;
}

function validatePreset(preset, obsState, audioPresets) {
    const warnings = [];
    if (obsState.sceneList.length === 0) return warnings;

    for (const s of getAllScenes(preset)) {
        if (!obsState.sceneList.includes(s)) {
            warnings.push(`Scene "${s}" not in OBS`);
        }
    }

    if (preset.audio != null) {
        const onList = resolveAudioList(preset.audio, audioPresets);
        if (onList === null) {
            warnings.push(`Audio preset "${preset.audio}" not defined`);
        } else if (Array.isArray(onList)) {
            const knownInputs = Object.keys(obsState.inputs || {});
            // Only flag missing inputs once OBS has enumerated — otherwise we'd
            // spam warnings before the first refresh completes.
            if (knownInputs.length > 0) {
                for (const input of onList) {
                    if (!knownInputs.includes(input)) {
                        warnings.push(`Audio input "${input}" not in OBS`);
                    }
                }
            }
        }
    }

    return warnings;
}

const STORAGE_KEY_FORMAT = 'gss_preset_format';

export default function PresetsTab({ obsState, obsService, syncVars }) {
    const [activePresetId, setActivePresetId] = useState(null);
    const [presets, setPresets] = useState(DEFAULT_PRESETS);
    const [audioPresets, setAudioPresets] = useState({});
    const [availableFormats, setAvailableFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const [loadError, setLoadError] = useState(null);
    const [applyErrors, setApplyErrors] = useState([]);

    // Cycling state
    const [cycleIndex, setCycleIndex] = useState(0);
    const [cycleCountdown, setCycleCountdown] = useState(null);
    const cycleTimerRef = useRef(null);
    const cycleCountdownRef = useRef(null);
    const cycleStartRef = useRef(null);

    useEffect(() => {
        listStreamFormats().then((formats) => {
            setAvailableFormats(formats);
            // Try to restore last used format
            const saved = localStorage.getItem(STORAGE_KEY_FORMAT);
            if (saved && formats.includes(saved)) {
                handleLoadFormat(saved);
            }
        });
    }, []);

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
            if (cycleCountdownRef.current) clearInterval(cycleCountdownRef.current);
        };
    }, []);

    const handleLoadFormat = async (name) => {
        if (!name) {
            setPresets(DEFAULT_PRESETS);
            setAudioPresets({});
            setSelectedFormat('');
            localStorage.removeItem(STORAGE_KEY_FORMAT);
            return;
        }
        setLoadError(null);
        try {
            const config = await loadStreamFormat(name);
            const parsed = buildPresetsFromYaml(config);
            if (parsed && parsed.presets && parsed.presets.length > 0) {
                setPresets(parsed.presets);
                setAudioPresets(parsed.audioPresets || {});
            }
            setSelectedFormat(name);
            localStorage.setItem(STORAGE_KEY_FORMAT, name);
        } catch (e) {
            setLoadError(e.message);
            // If restoring a saved format that no longer exists, fall back silently
            setPresets(DEFAULT_PRESETS);
            setAudioPresets({});
            setSelectedFormat('');
            localStorage.removeItem(STORAGE_KEY_FORMAT);
        }
    };

    const stopCycling = () => {
        if (cycleTimerRef.current) {
            clearInterval(cycleTimerRef.current);
            cycleTimerRef.current = null;
        }
        if (cycleCountdownRef.current) {
            clearInterval(cycleCountdownRef.current);
            cycleCountdownRef.current = null;
        }
        setCycleCountdown(null);
        cycleStartRef.current = null;
    };

    const applyPreset = async (preset) => {
        stopCycling();
        setActivePresetId(preset.id);
        const errors = [];

        if (!obsState.connected) {
            errors.push('OBS not connected — only overlay settings applied');
        }

        // Overlays (always work, no OBS dependency)
        const vars = {};
        if (preset.overlays.spot_overlay !== undefined) vars.stream_spot_overlay_visible = preset.overlays.spot_overlay;
        if (preset.overlays.top_timer !== undefined) vars.stream_top_timer_visible = preset.overlays.top_timer;
        if (preset.overlays.timeline !== undefined) vars.stream_timeline_visible = preset.overlays.timeline;
        if (preset.overlays.target_desc !== undefined) vars.stream_target_desc_visible = preset.overlays.target_desc;

        if (preset.target_desc) {
            vars.stream_target_desc_TITLE = preset.target_desc.title || '';
            vars.stream_target_desc_SUBTITLE = preset.target_desc.subtitle || '';
            vars.stream_target_desc_visible = true;
        }

        if (Object.keys(vars).length > 0) syncVars(vars);

        // Audio — `preset.audio` may be either a string (refers to audio_presets) or an
        // inline array of input names. Either way, it resolves to a list of inputs that
        // should be ON; every other OBS-known input gets muted.
        if (preset.audio != null) {
            const onList = resolveAudioList(preset.audio, audioPresets);
            if (onList === null) {
                errors.push(`Audio preset "${preset.audio}" not defined in stream format`);
            } else if (!Array.isArray(onList)) {
                errors.push(`Audio field is malformed (expected string or list)`);
            } else if (!obsState.connected) {
                errors.push(`Audio not applied — OBS disconnected`);
            } else {
                const onSet = new Set(onList);
                const allInputs = new Set([...Object.keys(obsState.inputs || {}), ...onList]);
                for (const inputName of allInputs) {
                    try {
                        await obsService.setInputMute(inputName, !onSet.has(inputName));
                    } catch (e) {
                        errors.push(`Audio "${inputName}": ${e.message}`);
                    }
                }
            }
        }

        // Scene — cycling or single
        const isCycling = preset.scenes && preset.scenes.length > 1 && preset.cycle_interval;

        if (isCycling) {
            // Apply first scene immediately
            let idx = 0;
            setCycleIndex(0);
            try {
                await obsService.setScene(preset.scenes[0]);
            } catch (e) {
                errors.push(e.message);
            }

            // Start cycle timer
            cycleStartRef.current = Date.now();
            setCycleCountdown(preset.cycle_interval);

            cycleTimerRef.current = setInterval(async () => {
                idx = (idx + 1) % preset.scenes.length;
                setCycleIndex(idx);
                cycleStartRef.current = Date.now();
                try {
                    await obsService.setScene(preset.scenes[idx]);
                } catch (e) {
                    console.warn('[Preset cycle]', e.message);
                }
            }, preset.cycle_interval * 1000);

            // Countdown ticker (updates every 500ms)
            cycleCountdownRef.current = setInterval(() => {
                const elapsed = (Date.now() - cycleStartRef.current) / 1000;
                setCycleCountdown(Math.max(0, Math.ceil(preset.cycle_interval - elapsed)));
            }, 500);
        } else {
            // Single scene
            const sceneName = preset.scene || (preset.scenes && preset.scenes[0]);
            if (sceneName) {
                try {
                    await obsService.setScene(sceneName);
                } catch (e) {
                    errors.push(e.message);
                }
            }
        }

        setApplyErrors(errors);
    };

    // Find the active preset for cycle display
    const activePreset = presets.find(p => p.id === activePresetId);
    const isCyclingActive = activePreset?.scenes?.length > 1 && activePreset?.cycle_interval && cycleTimerRef.current;

    return (
        <div className="sc-tab-content">
            <ValueGroup label="Preset Source">
                <div className="sc-format-selector">
                    <select
                        className="sc-select"
                        value={selectedFormat}
                        onChange={(e) => handleLoadFormat(e.target.value)}
                    >
                        <option value="">Built-in Defaults</option>
                        {availableFormats.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
                {loadError && <div className="big-text-warn">{loadError}</div>}
            </ValueGroup>

            {applyErrors.length > 0 && (
                <div className="sc-preset-errors">
                    {applyErrors.map((err, i) => (
                        <div key={i} className="sc-preset-error">{err}</div>
                    ))}
                </div>
            )}

            <ValueGroup label="Presets">
                <div className="sc-presets-grid">
                    {presets.map((preset) => {
                        const warnings = obsState.connected ? validatePreset(preset, obsState, audioPresets) : [];
                        const hasWarnings = warnings.length > 0;
                        const isActive = activePresetId === preset.id;
                        const allScenes = getAllScenes(preset);
                        const hasCycle = preset.scenes && preset.scenes.length > 1 && preset.cycle_interval;

                        const audioHover = formatAudioHover(preset, audioPresets, obsState.inputs);

                        return (
                            <div
                                key={preset.id}
                                className={`sc-preset-card ${isActive ? 'sc-preset-active' : ''} ${hasWarnings ? 'sc-preset-warn' : ''}`}
                                onClick={() => applyPreset(preset)}
                                title={audioHover || undefined}
                            >
                                <div className="sc-preset-header">
                                    <div className="sc-preset-name">{preset.name}</div>
                                    {hasCycle && (
                                        <span className={`sc-preset-cycle-badge ${isActive && isCyclingActive ? 'sc-preset-cycle-active' : ''}`}>
                                            {isActive && isCyclingActive && cycleCountdown != null
                                                ? `${cycleCountdown}s`
                                                : `${preset.cycle_interval}s`}
                                        </span>
                                    )}
                                </div>
                                <div className="sc-preset-desc">{preset.description}</div>

                                {/* Scene list with validation + audio badge */}
                                <div className="sc-preset-scenes">
                                    {allScenes.map((s, i) => {
                                        const exists = !obsState.connected || obsState.sceneList.length === 0 || obsState.sceneList.includes(s);
                                        const isCurrent = isActive && isCyclingActive && i === cycleIndex;
                                        return (
                                            <span key={s} className={`sc-preset-scene-tag ${exists ? '' : 'sc-preset-scene-missing'} ${isCurrent ? 'sc-preset-scene-current' : ''}`}>
                                                {s}
                                            </span>
                                        );
                                    })}
                                    {preset.audio != null && (() => {
                                        const onList = resolveAudioList(preset.audio, audioPresets);
                                        const isInline = Array.isArray(preset.audio);
                                        const knownInputs = Object.keys(obsState.inputs || {});
                                        const missingInputs = Array.isArray(onList) && knownInputs.length > 0
                                            ? onList.filter(n => !knownInputs.includes(n))
                                            : [];
                                        const isMissing = onList === null || missingInputs.length > 0;
                                        const label = isInline
                                            ? `(${preset.audio.length} src${preset.audio.length === 1 ? '' : 's'})`
                                            : String(preset.audio);
                                        return (
                                            <span
                                                className={`sc-preset-audio-tag ${isMissing ? 'sc-preset-audio-tag-missing' : ''}`}
                                                title={audioHover || undefined}
                                            >
                                                ♪ {label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Overlay indicators */}
                                <div className="sc-preset-overlays">
                                    {[
                                        ['TELEM', preset.overlays.spot_overlay],
                                        ['TIMER', preset.overlays.top_timer],
                                        ['TIMELINE', preset.overlays.timeline],
                                        ['TAG', preset.overlays.target_desc ?? !!preset.target_desc],
                                    ].map(([label, on]) => (
                                        <span key={label} className={`sc-preset-overlay-tag ${on ? 'sc-preset-overlay-on' : ''}`}>
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {hasWarnings && (
                                    <div className="sc-preset-warnings">
                                        {warnings.map((w, i) => (
                                            <div key={i} className="sc-preset-warning-line">{w}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ValueGroup>
        </div>
    );
}
