import GSSButton from '../../reusable/Button';
import { ValueGroup } from '../../reusable/ValueDisplay';

export default function AudioTab({ obsState, obsService }) {
    if (!obsState.connected) {
        return (
            <div className="sc-tab-content">
                <ValueGroup label="Audio" hidden={true} hidden_label_text="NO OBS CONNECTION" />
            </div>
        );
    }

    const audioInputs = Object.entries(obsState.inputs).filter(
        ([, info]) => info.muted !== undefined
    );

    return (
        <div className="sc-tab-content">
            <ValueGroup label="Audio Inputs">
                {audioInputs.length === 0 && <div style={{ color: '#888' }}>No audio inputs discovered from OBS.</div>}
                {audioInputs.map(([inputName, info]) => (
                    <GSSButton
                        key={inputName}
                        variant={!info.muted ? 'blue' : 'red'}
                        onClick={() => obsService.setInputMute(inputName, !info.muted)}
                    >
                        {inputName.replace(/_/g, ' ')}: <b>{info.muted ? 'MUTED' : 'ON'}</b>
                    </GSSButton>
                ))}
            </ValueGroup>
        </div>
    );
}
