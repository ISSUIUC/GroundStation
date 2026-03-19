import './StatusBar.css';

const STATUS_MAP = {
    connected: { label: 'Connected', className: 'integration-connected' },
    disconnected: { label: 'Disconnected', className: 'integration-disconnected' },
    reconnecting: { label: 'Reconnecting', className: 'integration-reconnecting' },
    'not-configured': { label: 'Not Configured', className: 'integration-not-configured' },
};

export default function IntegrationStatus({ name, status }) {
    const info = STATUS_MAP[status] || STATUS_MAP['not-configured'];
    return (
        <div className="integration-status">
            <span className={`integration-dot ${info.className}`} />
            <span className="integration-name">{name}</span>
            <span className="integration-label">{info.label}</span>
        </div>
    );
}
