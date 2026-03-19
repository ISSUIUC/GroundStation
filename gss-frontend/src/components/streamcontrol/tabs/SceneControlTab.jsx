import { ValueGroup } from '../../reusable/ValueDisplay';

export default function SceneControlTab({ obsState, obsService }) {
    if (!obsState.connected) {
        return (
            <div className="sc-tab-content">
                <ValueGroup label="Scenes" hidden={true} hidden_label_text="NO OBS CONNECTION" />
            </div>
        );
    }

    return (
        <div className="sc-tab-content">
            <ValueGroup label="Program Scene">
                <div className="sc-scene-current">
                    Current: <b>{obsState.currentScene || 'Unknown'}</b>
                </div>
                <div className="sc-scene-grid">
                    {obsState.sceneList.map((sceneName) => {
                        const isCurrent = obsState.currentScene === sceneName;
                        return (
                            <div
                                key={sceneName}
                                className={`sc-scene-card ${isCurrent ? 'sc-scene-active' : ''}`}
                                onClick={() => obsService.setScene(sceneName)}
                            >
                                {sceneName}
                            </div>
                        );
                    })}
                </div>
            </ValueGroup>
        </div>
    );
}
