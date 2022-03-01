"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const main_1 = require("./main");
class ElectronConnection {
    on(channel, listener) {
        electron_1.ipcRenderer.on(channel, (evt, args) => listener(args));
    }
    send(channel, ...args) {
        electron_1.ipcRenderer.send(channel, ...args);
    }
}
window.onload = () => (0, main_1.run_frontend)(new ElectronConnection(), []);
//# sourceMappingURL=electronMain.js.map