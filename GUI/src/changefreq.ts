import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let submit_button = <HTMLButtonElement>document.getElementById("submit");
let frequency_input = <HTMLInputElement>document.getElementById("frequency");

submit_button.addEventListener("click", () => {
    ipcRenderer.send('frequency', JSON.stringify(frequency_input.value));
    // frequency_input.value = "";
});