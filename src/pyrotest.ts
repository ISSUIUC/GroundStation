import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let pt_button = <HTMLButtonElement>document.getElementById("PT \n");
pt_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PT');
});

let pa_button = <HTMLButtonElement>document.getElementById("PA \n");
pa_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PA');
});

let pb_button = <HTMLButtonElement>document.getElementById("PB \n");
pb_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PB');
});

let pc_button = <HTMLButtonElement>document.getElementById("PC \n");
pc_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PC');
});

let pd_button = <HTMLButtonElement>document.getElementById("PD \n");
pd_button.addEventListener("click", () => {
    ipcRenderer.send('raw_command', 'PD');
});
