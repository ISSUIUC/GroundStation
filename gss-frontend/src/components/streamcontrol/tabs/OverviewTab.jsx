import { useState } from 'preact/hooks';
import GSSButton from '../../reusable/Button';
import { ValueGroup } from '../../reusable/ValueDisplay';
import { useTelemetry } from '../../dataflow/gssdata';
import { add_event_listener } from '../../dataflow/sequencer';

export default function OverviewTab({
    obsState,
    syncVars,
    stream_target_TITLE,
    stream_target_SUBTITLE,
    stream_target_desc_vis,
    idle_reasontext,
}) {
    const activeAudio = Object.entries(obsState.inputs || {})
        .filter(([, info]) => info.muted === false)
        .map(([name]) => name.replace(/_/g, ' '));

    // Timer control state (mirrors CommandingView logic)
    const [tvalue, setTimerVal] = useState(0);
    const [t0DateTime, setT0DateTime] = useState('');
    const timer_paused = useTelemetry("@GSS/countdown_t0_paused");

    // Convert the datetime-local input to a unix timestamp
    const getT0Timestamp = () => {
        if (t0DateTime) {
            return new Date(t0DateTime).getTime();
        }
        return null;
    };

    const setTimer = (time_s) => {
        const d = time_s * 1000;
        setTimerVal(d);
        syncVars({ countdown_t0: Date.now() + d, countdown_t0_paused: true, countdown_t0_paused_value: d });
    };

    const togglePause = () => {
        let pv = true;
        if (timer_paused != null) {
            pv = !timer_paused;
        }
        syncVars({ countdown_t0: Date.now() + tvalue, countdown_t0_paused_value: tvalue, countdown_t0_paused: pv });
    };

    return (
        <div className="sc-tab-content">
            <div className="sc-overview-row">
                {/* OBS state */}
                <ValueGroup label="OBS" style_override={{ flex: 1 }}>
                    <table className="sc-kv-table">
                        <tbody>
                            <tr>
                                <td className="sc-kv-key">Scene</td>
                                <td className="sc-kv-val">{obsState.currentScene || '—'}</td>
                            </tr>
                            <tr>
                                <td className="sc-kv-key">Stream</td>
                                <td className={`sc-kv-val ${obsState.streaming ? 'sc-text-live' : ''}`}>
                                    {obsState.streaming ? 'LIVE' : 'Off'}
                                </td>
                            </tr>
                            <tr>
                                <td className="sc-kv-key">Recording</td>
                                <td className={`sc-kv-val ${obsState.recording ? 'sc-text-rec' : ''}`}>
                                    {obsState.recording ? 'REC' : 'Off'}
                                </td>
                            </tr>
                            <tr>
                                <td className="sc-kv-key">Audio</td>
                                <td className="sc-kv-val">
                                    {activeAudio.length > 0 ? activeAudio.join(', ') : 'All muted'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </ValueGroup>

                {/* Target description controls */}
                <ValueGroup label="Name Tag" style_override={{ flex: 1 }}>
                    <GSSButton
                        variant={stream_target_desc_vis ? 'blue' : 'red'}
                        onClick={() => syncVars({ stream_target_desc_visible: !stream_target_desc_vis })}
                    >
                        {stream_target_desc_vis ? 'VISIBLE' : 'HIDDEN'}
                    </GSSButton>
                    <div className="sc-field">
                        <label>Title</label>
                        <input
                            className="sc-input sc-input-grow"
                            value={stream_target_TITLE || ''}
                            onChange={(e) => syncVars({ stream_target_desc_TITLE: e.target.value })}
                        />
                    </div>
                    <div className="sc-field">
                        <label>Subtitle</label>
                        <input
                            className="sc-input sc-input-grow"
                            value={stream_target_SUBTITLE || ''}
                            onChange={(e) => syncVars({ stream_target_desc_SUBTITLE: e.target.value })}
                        />
                    </div>
                </ValueGroup>
            </div>

            <div className="sc-overview-row">
                {/* Idle / pre-stream text */}
                <ValueGroup label="Idle / Pre-Stream Text" style_override={{ flex: 1 }}>
                    <div className="sc-field">
                        <label>Reason Text</label>
                        <input
                            className="sc-input sc-input-grow"
                            value={idle_reasontext || ''}
                            onChange={(e) => syncVars({ stream_idle_reason_text: e.target.value })}
                        />
                    </div>
                    <div className="sc-hint">
                        Shown on idle, pre-stream, and goodbye overlay screens
                    </div>
                </ValueGroup>
            </div>

            {/* Timer control */}
            <ValueGroup label="Timer Control">
                <div className="sc-timer-buttons">
                    <GSSButton variant="yellow" onClick={togglePause}>
                        {timer_paused ? 'UNPAUSE' : 'PAUSE'}
                    </GSSButton>
                    <GSSButton onClick={() => {
                        syncVars({ countdown_t0: Date.now(), countdown_t0_paused: false, countdown_t0_paused_value: Date.now() });
                    }}>
                        0:00 (NO PAUSE)
                    </GSSButton>
                    <GSSButton onClick={() => setTimer(30)}>0:30</GSSButton>
                    <GSSButton onClick={() => setTimer(60)}>1:00</GSSButton>
                    <GSSButton onClick={() => setTimer(300)}>5:00</GSSButton>
                    <GSSButton onClick={() => {
                        const time_input = +prompt("[time input] Input countdown clock setting in SECONDS.");
                        if (time_input > 0) setTimer(time_input);
                    }}>
                        CUSTOM
                    </GSSButton>
                    <GSSButton
                        onClick={() => {
                            const ts = getT0Timestamp();
                            if (!ts) { alert("Set a T-0 date/time first."); return; }
                            syncVars({
                                countdown_t0: ts,
                                countdown_t0_paused: false,
                                countdown_t0_paused_value: ts,
                            });
                        }}
                        disabled={!t0DateTime}
                    >
                        Set T-0 to Date
                    </GSSButton>
                    <GSSButton variant="red" onClick={() => {
                        add_event_listener("launch", () => {
                            syncVars({ countdown_t0: Date.now(), countdown_t0_paused: false, countdown_t0_paused_value: Date.now() });
                            console.log("Launch event detected, setting T-0 to current time.");
                        });
                        alert("Launch event listener added. This will set the timer to T-0 when the launch event is detected. You can remove this listener by refreshing the page.");
                    }}>
                        Set T-0 on Launch Event
                    </GSSButton>
                </div>
                <div className="sc-field" style={{ marginTop: '8px' }}>
                    <label>T-0 Date</label>
                    <input
                        className="sc-input sc-input-grow"
                        type="datetime-local"
                        value={t0DateTime}
                        onChange={(e) => setT0DateTime(e.target.value)}
                    />
                </div>
            </ValueGroup>
        </div>
    );
}
