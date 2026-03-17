import GSSButton from '../../reusable/Button';
import { ValueGroup } from '../../reusable/ValueDisplay';
import IntegrationStatus from '../IntegrationStatus';

export default function SettingsTab({ obsState, obsService, obsServerIp, setObsServerIp, syncVars }) {
    const obsStatus = obsState.connected ? 'connected' :
                      obsState.connecting ? 'reconnecting' : 'disconnected';

    // Visibility controls (migrated from OverlayController)
    return (
        <div className="sc-tab-content">
            <ValueGroup label="OBS Connection">
                <IntegrationStatus name="OBS WebSocket" status={obsStatus} />
                <div style={{ marginTop: '8px' }}>
                    <b>Video Server IP:</b>{' '}
                    <input
                        className="sc-input"
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
                        ? 'CONNECTED (Click to Disconnect)'
                        : obsState.connecting
                            ? 'CONNECTING...'
                            : 'CONNECT TO OBS'}
                </GSSButton>
                <div style={{ color: '#888', fontSize: '0.85em', marginTop: '4px' }}>
                    Status: {obsState.statusMessage}
                </div>
            </ValueGroup>

            {!obsState.connected && !obsState.connecting && (
                <ValueGroup label="Troubleshooting">
                    <div style={{ color: '#aaa', fontSize: '0.9em' }}>
                        <p>Make sure OBS is running with the WebSocket server enabled:</p>
                        <ol>
                            <li>Open OBS Studio</li>
                            <li>Tools &rarr; WebSocket Server Settings</li>
                            <li>Enable WebSocket server on port 4455</li>
                            <li>Set password to match (default: "issuiuc")</li>
                        </ol>
                        <p>OBS WebSocket is built into OBS 28+. For older versions, install the obs-websocket plugin.</p>
                    </div>
                </ValueGroup>
            )}

            <ValueGroup label="Integrations">
                <IntegrationStatus name="OBS WebSocket" status={obsStatus} />
                <IntegrationStatus name="YAML Config" status={obsState.connected ? 'connected' : 'not-configured'} />
            </ValueGroup>
        </div>
    );
}
