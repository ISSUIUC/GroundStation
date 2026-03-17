import { useState, useEffect } from 'preact/hooks';
import GSSButton from '../../reusable/Button';
import { ValueGroup } from '../../reusable/ValueDisplay';
import SequencerTimeline from '../SequencerTimeline';
import { listStreamFormats, loadStreamFormat } from '../../../services/streamFormatLoader';

export default function SequencerTab({
    obsState,
    obsService,
    streamFormat,
    setStreamFormat,
    currentSegmentIndex,
    setCurrentSegmentIndex,
    segmentElapsed,
    onAdvanceSegment,
    overlayTextOverrides,
    setOverlayTextOverrides,
    syncVars,
}) {
    const [availableFormats, setAvailableFormats] = useState([]);
    const [selectedFormatName, setSelectedFormatName] = useState('');
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        listStreamFormats().then(setAvailableFormats);
    }, []);

    const handleLoadFormat = async (name) => {
        setLoadError(null);
        try {
            const config = await loadStreamFormat(name);
            setStreamFormat(config);
            setSelectedFormatName(name);
            setCurrentSegmentIndex(0);
        } catch (e) {
            setLoadError(e.message);
        }
    };

    const handleJumpTo = (index) => {
        setCurrentSegmentIndex(index);
        applySegment(index);
    };

    const applySegment = async (index) => {
        if (!streamFormat) return;
        const seg = streamFormat.segments[index];
        if (!seg) return;

        // Apply scene
        if (seg.scene && streamFormat.scenes?.[seg.scene] && obsState.connected) {
            await obsService.setScene(streamFormat.scenes[seg.scene].obs_scene);
        }

        // Apply audio preset
        if (seg.audio && streamFormat.audio_presets?.[seg.audio] && obsState.connected) {
            const preset = streamFormat.audio_presets[seg.audio];
            for (const [inputName, shouldBeOn] of Object.entries(preset)) {
                await obsService.setInputMute(inputName, !shouldBeOn);
            }
        }

        // Apply overlay state
        if (seg.overlay_state) {
            const vars = {};
            if (seg.overlay_state.spot_overlay !== undefined) vars.stream_spot_overlay_visible = seg.overlay_state.spot_overlay;
            if (seg.overlay_state.top_timer !== undefined) vars.stream_top_timer_visible = seg.overlay_state.top_timer;
            if (seg.overlay_state.timeline !== undefined) vars.stream_timeline_visible = seg.overlay_state.timeline;
            if (Object.keys(vars).length > 0) syncVars(vars);
        }

        // Apply target description (use override if set, otherwise YAML default)
        const override = overlayTextOverrides[seg.id];
        const desc = override || seg.target_desc;
        if (desc) {
            syncVars({
                stream_target_desc_TITLE: desc.title || '',
                stream_target_desc_SUBTITLE: desc.subtitle || '',
                stream_target_desc_visible: true,
            });
        } else {
            syncVars({ stream_target_desc_visible: false });
        }
    };

    const currentSegment = streamFormat?.segments?.[currentSegmentIndex];

    return (
        <div className="sc-tab-content">
            <ValueGroup label="Stream Format">
                <div className="sc-format-selector">
                    <select
                        className="sc-select"
                        value={selectedFormatName}
                        onChange={(e) => handleLoadFormat(e.target.value)}
                    >
                        <option value="">-- Select Format --</option>
                        {availableFormats.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    {streamFormat && <span className="sc-format-loaded">{streamFormat.name}</span>}
                </div>
                {loadError && <div className="big-text-warn">{loadError}</div>}
            </ValueGroup>

            {streamFormat && (
                <>
                    <ValueGroup label="Sequencer Controls">
                        <GSSButton
                            variant="yellow"
                            onClick={() => { onAdvanceSegment(); applySegment(currentSegmentIndex + 1); }}
                            disabled={currentSegmentIndex >= streamFormat.segments.length - 1}
                        >
                            ADVANCE TO NEXT SEGMENT
                        </GSSButton>
                        <GSSButton
                            variant="blue"
                            onClick={() => applySegment(currentSegmentIndex)}
                        >
                            RE-APPLY CURRENT SEGMENT
                        </GSSButton>
                    </ValueGroup>

                    {currentSegment?.target_desc && (
                        <ValueGroup label="Overlay Text (Live Edit)">
                            <div>
                                <b>Title:</b>
                                <input
                                    className="sc-input"
                                    value={(overlayTextOverrides[currentSegment.id]?.title ?? currentSegment.target_desc?.title) || ''}
                                    onChange={(e) => {
                                        const newOverrides = { ...overlayTextOverrides };
                                        newOverrides[currentSegment.id] = {
                                            ...(newOverrides[currentSegment.id] || currentSegment.target_desc),
                                            title: e.target.value,
                                        };
                                        setOverlayTextOverrides(newOverrides);
                                        syncVars({ stream_target_desc_TITLE: e.target.value });
                                    }}
                                />
                            </div>
                            <div>
                                <b>Subtitle:</b>
                                <input
                                    className="sc-input"
                                    value={(overlayTextOverrides[currentSegment.id]?.subtitle ?? currentSegment.target_desc?.subtitle) || ''}
                                    onChange={(e) => {
                                        const newOverrides = { ...overlayTextOverrides };
                                        newOverrides[currentSegment.id] = {
                                            ...(newOverrides[currentSegment.id] || currentSegment.target_desc),
                                            subtitle: e.target.value,
                                        };
                                        setOverlayTextOverrides(newOverrides);
                                        syncVars({ stream_target_desc_SUBTITLE: e.target.value });
                                    }}
                                />
                            </div>
                        </ValueGroup>
                    )}

                    <ValueGroup label="Timeline">
                        <SequencerTimeline
                            segments={streamFormat.segments}
                            currentIndex={currentSegmentIndex}
                            elapsedTime={segmentElapsed}
                            onJumpTo={handleJumpTo}
                        />
                    </ValueGroup>
                </>
            )}
        </div>
    );
}
