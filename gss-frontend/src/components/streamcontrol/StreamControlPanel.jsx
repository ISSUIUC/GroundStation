import { useState, useEffect } from 'preact/hooks';
import obsService from '../../services/obsService';
import { useSyncGlobalVars, useTelemetry } from '../dataflow/gssdata';
import Sidebar from './Sidebar';
import OverviewTab from './tabs/OverviewTab';
import SceneControlTab from './tabs/SceneControlTab';
import AudioTab from './tabs/AudioTab';
import PresetsTab from './tabs/PresetsTab';
import { ValueGroup } from '../reusable/ValueDisplay';
import './StreamControlPanel.css';

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'presets', label: 'Presets' },
    { id: 'scenes', label: 'Scenes' },
    { id: 'audio', label: 'Audio' },
];

const STORAGE_KEY_OBS_IP = 'gss_obs_ip';

export default function StreamControlPanel() {
    const [activeTab, setActiveTab] = useState('overview');
    const [obsState, setObsState] = useState(obsService.getState());
    const [obsServerIp, setObsServerIp] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_OBS_IP) || '192.168.0.200';
    });
    const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

    const syncVars = useSyncGlobalVars();
    const spot_vis = useTelemetry("@GSS/stream_spot_overlay_visible") || false;
    const top_timer_vis = useTelemetry("@GSS/stream_top_timer_visible") || false;
    const timeline_vis = useTelemetry("@GSS/stream_timeline_visible") || false;
    const stream_target_desc_vis = useTelemetry("@GSS/stream_target_desc_visible") || false;
    const use_stream_timer = useTelemetry("@GSS/use_stream_timer") || false;
    const single_stage_mode = useTelemetry("@GSS/stream_single_stage_mode") || false;
    const stream_target_TITLE = useTelemetry("@GSS/stream_target_desc_TITLE") || false;
    const stream_target_SUBTITLE = useTelemetry("@GSS/stream_target_desc_SUBTITLE") || false;
    const idle_reasontext = useTelemetry("@GSS/stream_idle_reason_text") || false;

    useEffect(() => {
        return obsService.subscribe((state) => {
            setObsState(state);
            // Save IP to localStorage on successful connect
            if (state.connected) {
                localStorage.setItem(STORAGE_KEY_OBS_IP, obsServerIp);
            }
        });
    }, [obsServerIp]);

    // Auto-connect on mount if we have a saved IP
    useEffect(() => {
        if (autoConnectAttempted) return;
        setAutoConnectAttempted(true);
        const savedIp = localStorage.getItem(STORAGE_KEY_OBS_IP);
        if (savedIp) {
            obsService.connect(`ws://${savedIp}:4455`, 'issuiuc');
        }
    }, []);

    return (
        <div className="sc-panel">
            <div className="sc-layout">
                <div className="sc-main">
                    <ValueGroup label="Overlay Visibility">
                        <div className="sc-visibility-bar">
                            <button className={`sc-vis-toggle ${spot_vis ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ stream_spot_overlay_visible: !spot_vis })}>
                                TELEMETRY
                            </button>
                            <button className={`sc-vis-toggle ${top_timer_vis ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ stream_top_timer_visible: !top_timer_vis })}>
                                TIMER
                            </button>
                            <button className={`sc-vis-toggle ${timeline_vis ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ stream_timeline_visible: !timeline_vis })}>
                                TIMELINE
                            </button>
                            <button className={`sc-vis-toggle ${stream_target_desc_vis ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ stream_target_desc_visible: !stream_target_desc_vis })}>
                                NAME TAG
                            </button>
                            <button className={`sc-vis-toggle ${use_stream_timer ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ use_stream_timer: !use_stream_timer })}>
                                T-CLOCK
                            </button>
                            <div className="sc-vis-sep" />
                            <button className={`sc-vis-toggle ${single_stage_mode ? 'sc-vis-on' : ''}`} onClick={() => syncVars({ stream_single_stage_mode: !single_stage_mode })}>
                                {single_stage_mode ? '1-STAGE' : '2-STAGE'}
                            </button>
                            <div className="sc-vis-sep" />
                            <button
                                className="sc-vis-toggle sc-vis-action"
                                onClick={() => syncVars({
                                    stream_spot_overlay_visible: false,
                                    stream_top_timer_visible: false,
                                    stream_timeline_visible: false,
                                    stream_target_desc_visible: false,
                                })}
                            >
                                ALL OFF
                            </button>
                            <button
                                className="sc-vis-toggle sc-vis-panic"
                                onClick={() => {
                                    syncVars({
                                        stream_spot_overlay_visible: false,
                                        stream_top_timer_visible: false,
                                        stream_timeline_visible: false,
                                        stream_target_desc_visible: false,
                                        use_stream_timer: false,
                                    });
                                    // Switch to first available scene as safe fallback
                                    if (obsState.connected && obsState.sceneList.length > 0) {
                                        obsService.setScene(obsState.sceneList[0]);
                                    }
                                }}
                            >
                                PANIC
                            </button>
                        </div>
                    </ValueGroup>

                    <ValueGroup label="Controls" child_style_override={{ padding: '0' }}>
                        <div className="sc-tab-bar">
                            {TABS.map((tab) => (
                                <div
                                    key={tab.id}
                                    className={`sc-tab ${activeTab === tab.id ? 'sc-tab-active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </div>
                            ))}
                        </div>

                        <div className="sc-tab-body">
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    obsState={obsState}
                                    syncVars={syncVars}
                                    stream_target_TITLE={stream_target_TITLE}
                                    stream_target_SUBTITLE={stream_target_SUBTITLE}
                                    stream_target_desc_vis={stream_target_desc_vis}
                                    idle_reasontext={idle_reasontext}
                                />
                            )}
                            {activeTab === 'presets' && (
                                <PresetsTab
                                    obsState={obsState}
                                    obsService={obsService}
                                    syncVars={syncVars}
                                />
                            )}
                            {activeTab === 'scenes' && (
                                <SceneControlTab obsState={obsState} obsService={obsService} />
                            )}
                            {activeTab === 'audio' && (
                                <AudioTab obsState={obsState} obsService={obsService} />
                            )}
                        </div>
                    </ValueGroup>
                </div>

                {/* Right sidebar: connection + OBS status */}
                <Sidebar
                    obsState={obsState}
                    obsService={obsService}
                    obsServerIp={obsServerIp}
                    setObsServerIp={setObsServerIp}
                />
            </div>
        </div>
    );
}
