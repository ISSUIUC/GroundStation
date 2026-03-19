import GSSButton from '../reusable/Button';
import { ValueGroup } from '../reusable/ValueDisplay';
import IntegrationStatus from './IntegrationStatus';
import './StreamControlPanel.css';

export default function Sidebar({
    obsState,
    obsService,
    obsServerIp,
    setObsServerIp,
}) {
    const obsStatus = obsState.connected ? 'connected' :
                      obsState.connecting ? 'reconnecting' : 'disconnected';

    return (
        <div className="sc-sidebar">
            <ValueGroup label="OBS Connection">
                <IntegrationStatus name="OBS WebSocket" status={obsStatus} />
                <div className="sc-sidebar-row">
                    <label>Server IP</label>
                    <input
                        className="sc-input sc-input-full"
                        value={obsServerIp}
                        onChange={(e) => setObsServerIp(e.target.value)}
                    />
                </div>
                <GSSButton
                    variant={obsState.connected ? 'green' : 'red'}
                    onClick={() => {
                        if (obsState.connected) {
                            obsService.disconnect();
                        } else {
                            obsService.connect(`ws://${obsServerIp}:4455`, 'issuiuc');
                        }
                    }}
                >
                    {obsState.connected
                        ? 'DISCONNECT'
                        : obsState.connecting
                            ? 'CONNECTING...'
                            : 'CONNECT'}
                </GSSButton>
                <div className="sc-sidebar-status">{obsState.statusMessage}</div>
            </ValueGroup>

            {obsState.connected && (
                <ValueGroup label="OBS Status">
                    <div className="sc-sidebar-status-row">
                        <span className="sc-sidebar-status-label">Scene</span>
                        <span className="sc-sidebar-status-value">{obsState.currentScene || '—'}</span>
                    </div>
                    <div className="sc-sidebar-status-row">
                        <span className="sc-sidebar-status-label">Stream</span>
                        <span className={`sc-sidebar-status-value ${obsState.streaming ? 'sc-text-live' : ''}`}>
                            {obsState.streaming ? 'LIVE' : 'Off'}
                        </span>
                    </div>
                    <div className="sc-sidebar-status-row">
                        <span className="sc-sidebar-status-label">Recording</span>
                        <span className={`sc-sidebar-status-value ${obsState.recording ? 'sc-text-rec' : ''}`}>
                            {obsState.recording ? 'REC' : 'Off'}
                        </span>
                    </div>
                </ValueGroup>
            )}

            {!obsState.connected && !obsState.connecting && (
                <ValueGroup label="Troubleshooting">
                    <div className="sc-sidebar-help">
                        <div>1. Open OBS Studio</div>
                        <div>2. Tools → WebSocket Server Settings</div>
                        <div>3. Enable on port 4455</div>
                        <div>4. Password: "issuiuc"</div>
                    </div>
                </ValueGroup>
            )}
        </div>
    );
}
