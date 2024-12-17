import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let pt_button = <HTMLButtonElement>document.getElementById("PT");
pt_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PT');
});

let pa_button = <HTMLButtonElement>document.getElementById("PA");
pa_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PA');
});

let pb_button = <HTMLButtonElement>document.getElementById("PB");
pb_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PB');
});

let pc_button = <HTMLButtonElement>document.getElementById("PC");
pc_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PC');
});

let pd_button = <HTMLButtonElement>document.getElementById("PD");
pd_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PD');
});
