import { ipcRenderer } from "electron";
import { ServerConnection } from "./serverConnection";
import { run_frontend } from "./main";

class ElectronConnection implements ServerConnection {
    on(channel: string, listener: (...args: string[])=>void): void {
        ipcRenderer.on(channel, (evt, args)=>listener(args));
    }
    send(channel: string, ...args: string[]): void {
        ipcRenderer.send(channel, ...args);
    }
}

window.onload = ()=>run_frontend(new ElectronConnection(), []);