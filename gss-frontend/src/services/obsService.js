import { OBSWebSocket } from 'obs-websocket-js';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_RECONNECT_ATTEMPTS = 8;

class ObsService {
    constructor() {
        this.obs = new OBSWebSocket();
        this._state = {
            connected: false,
            connecting: false,
            currentScene: null,
            sceneList: [],
            streaming: false,
            recording: false,
            inputs: {},       // { inputName: { muted: bool } }
            statusMessage: 'Not connected',
        };
        this._subscribers = new Set();
        this._reconnectAttempt = 0;
        this._reconnectTimer = null;
        this._autoReconnect = false;
        this._lastUrl = null;
        this._lastPassword = null;

        this.obs.on('ConnectionClosed', () => {
            this._updateState({ connected: false, statusMessage: 'Connection closed' });
            if (this._autoReconnect) {
                this._scheduleReconnect();
            }
        });

        this.obs.on('ConnectionError', () => {
            this._updateState({ connected: false, connecting: false, statusMessage: 'Connection error' });
        });

        this.obs.on('CurrentProgramSceneChanged', ({ sceneName }) => {
            this._updateState({ currentScene: sceneName });
            // Re-fetch audio inputs since active sources change with scenes
            this._refreshInputs();
        });

        this.obs.on('InputMuteStateChanged', ({ inputName, inputMuted }) => {
            const inputs = { ...this._state.inputs };
            if (inputs[inputName]) {
                inputs[inputName] = { ...inputs[inputName], muted: inputMuted };
                this._updateState({ inputs });
            }
        });

        // Input added/removed — re-fetch the full list
        this.obs.on('InputCreated', () => { this._refreshInputs(); });
        this.obs.on('InputRemoved', () => { this._refreshInputs(); });
        this.obs.on('InputNameChanged', () => { this._refreshInputs(); });

        this.obs.on('StreamStateChanged', ({ outputActive }) => {
            this._updateState({ streaming: outputActive });
        });

        this.obs.on('RecordStateChanged', ({ outputActive }) => {
            this._updateState({ recording: outputActive });
        });

        this.obs.on('SceneListChanged', ({ scenes }) => {
            this._updateState({ sceneList: scenes.map(s => s.sceneName || s) });
        });
    }

    _updateState(partial) {
        this._state = { ...this._state, ...partial };
        this._subscribers.forEach(cb => {
            try { cb(this._state); } catch (e) { console.error('[OBS Service] subscriber error:', e); }
        });
    }

    _scheduleReconnect() {
        if (this._reconnectTimer) return;
        if (this._reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
            this._autoReconnect = false;
            this._updateState({ statusMessage: `Gave up after ${MAX_RECONNECT_ATTEMPTS} attempts. Click CONNECT to retry.` });
            return;
        }
        const delay = RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)];
        this._updateState({ statusMessage: `Reconnecting in ${delay / 1000}s... (${this._reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})` });
        this._reconnectTimer = setTimeout(async () => {
            this._reconnectTimer = null;
            this._reconnectAttempt++;
            await this.connect(this._lastUrl, this._lastPassword, true);
        }, delay);
    }

    async connect(url, password, isReconnect = false) {
        if (this._state.connected) return;

        this._lastUrl = url;
        this._lastPassword = password;
        this._autoReconnect = true;

        if (!isReconnect) {
            this._reconnectAttempt = 0;
        }

        this._updateState({ connecting: true, statusMessage: 'Connecting...' });

        try {
            await this.obs.connect(url, password);
            this._reconnectAttempt = 0;
            this._updateState({ connected: true, connecting: false, statusMessage: 'Connected' });
            await this._fetchInitialState();
        } catch (e) {
            this._updateState({ connected: false, connecting: false, statusMessage: `Failed to connect: ${e.message || e}` });
            if (this._autoReconnect) {
                this._scheduleReconnect();
            }
        }
    }

    async disconnect() {
        this._autoReconnect = false;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        await this.obs.disconnect();
        this._updateState({
            connected: false,
            connecting: false,
            currentScene: null,
            sceneList: [],
            streaming: false,
            recording: false,
            inputs: {},
            statusMessage: 'Disconnected',
        });
    }

    async _refreshInputs() {
        try {
            const { inputs } = await this.obs.call('GetInputList');
            const inputStates = {};
            for (const input of inputs) {
                try {
                    const { inputMuted } = await this.obs.call('GetInputMute', { inputName: input.inputName });
                    inputStates[input.inputName] = { muted: inputMuted, kind: input.inputKind };
                } catch { /* input doesn't support muting — skip */ }
            }
            this._updateState({ inputs: inputStates });
        } catch (e) {
            console.warn('[OBS Service] Failed to fetch input list:', e);
        }
    }

    async _fetchInitialState() {
        try {
            const { currentProgramSceneName, scenes } = await this.obs.call('GetSceneList');
            this._updateState({
                currentScene: currentProgramSceneName,
                sceneList: scenes.map(s => s.sceneName),
            });
        } catch (e) {
            console.warn('[OBS Service] Failed to fetch scene list:', e);
        }

        await this._refreshInputs();

        try {
            const { outputActive: streaming } = await this.obs.call('GetStreamStatus');
            this._updateState({ streaming });
        } catch { /* stream not available */ }

        try {
            const { outputActive: recording } = await this.obs.call('GetRecordStatus');
            this._updateState({ recording });
        } catch { /* recording not available */ }
    }

    async setScene(sceneName) {
        if (!this._state.connected) throw new Error('Not connected to OBS');
        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
        } catch (e) {
            throw new Error(`Scene "${sceneName}" not found in OBS`);
        }
    }

    async setInputMute(inputName, muted) {
        if (!this._state.connected) throw new Error('Not connected to OBS');
        try {
            await this.obs.call('SetInputMute', { inputName, inputMuted: muted });
        } catch (e) {
            throw new Error(`Input "${inputName}" not found in OBS`);
        }
    }

    async setInputVolume(inputName, volumeDb) {
        if (!this._state.connected) return;
        await this.obs.call('SetInputVolume', { inputName, inputVolumeDb: volumeDb });
    }

    async startStreaming() {
        if (!this._state.connected) return;
        await this.obs.call('StartStream');
    }

    async stopStreaming() {
        if (!this._state.connected) return;
        await this.obs.call('StopStream');
    }

    async startRecording() {
        if (!this._state.connected) return;
        await this.obs.call('StartRecord');
    }

    async stopRecording() {
        if (!this._state.connected) return;
        await this.obs.call('StopRecord');
    }

    getState() {
        return this._state;
    }

    subscribe(cb) {
        this._subscribers.add(cb);
        return () => this._subscribers.delete(cb);
    }
}

// Singleton
const obsService = new ObsService();
export default obsService;

// Also export the raw OBS instance for legacy code that imports `obs` directly
export const obs = obsService.obs;
