import './StatusBar.css';

export default function StatusBar({ obsState }) {
    const connClass = obsState.connected ? 'status-dot-green' :
                      obsState.connecting ? 'status-dot-yellow' : 'status-dot-red';

    return (
        <div className="sc-status-bar">
            <div className="sc-status-section">
                <span className={`sc-status-dot ${connClass}`} />
                <span className="sc-status-label">OBS</span>
                <span className="sc-status-value">
                    {obsState.connected ? obsState.currentScene || 'Connected' : obsState.statusMessage}
                </span>
            </div>

            {obsState.connected && (
                <div className="sc-status-section">
                    {obsState.streaming && <span className="sc-status-badge sc-badge-live">LIVE</span>}
                    {obsState.recording && <span className="sc-status-badge sc-badge-rec">REC</span>}
                    {!obsState.streaming && !obsState.recording && <span className="sc-status-badge sc-badge-idle">IDLE</span>}
                </div>
            )}
        </div>
    );
}
