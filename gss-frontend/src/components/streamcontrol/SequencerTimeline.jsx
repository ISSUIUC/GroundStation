import './SequencerTimeline.css';

function formatDuration(seconds) {
    if (seconds == null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SequencerTimeline({ segments, currentIndex, elapsedTime, onJumpTo }) {
    return (
        <div className="seq-timeline">
            {segments.map((seg, i) => {
                let stateClass = 'seq-segment-upcoming';
                if (i < currentIndex) stateClass = 'seq-segment-completed';
                if (i === currentIndex) stateClass = 'seq-segment-active';

                return (
                    <div
                        key={seg.id}
                        className={`seq-segment ${stateClass}`}
                        onClick={() => onJumpTo && onJumpTo(i)}
                    >
                        <div className="seq-segment-index">{i + 1}</div>
                        <div className="seq-segment-info">
                            <div className="seq-segment-name">{seg.name}</div>
                            <div className="seq-segment-meta">
                                {seg.scene && <span className="seq-segment-scene">{seg.scene}</span>}
                                {seg.audio && <span className="seq-segment-audio">{seg.audio}</span>}
                            </div>
                        </div>
                        <div className="seq-segment-time">
                            {i === currentIndex && elapsedTime != null
                                ? <span className="seq-elapsed">{formatDuration(elapsedTime)}</span>
                                : null
                            }
                            <span className="seq-duration">{seg.duration ? formatDuration(seg.duration) : 'MANUAL'}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
