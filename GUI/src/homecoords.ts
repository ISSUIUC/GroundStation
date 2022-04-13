import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let submit_button = <HTMLButtonElement>document.getElementById("submit");
let lat_input = <HTMLInputElement>document.getElementById("lat");
let long_input = <HTMLInputElement>document.getElementById("long");
let alt_input = <HTMLInputElement>document.getElementById("alt");

submit_button.addEventListener("click", () => {
    ipcRenderer.send('homecoords', parseFloat(lat_input.value), parseFloat(long_input.value), parseFloat(alt_input.value));
    // call_sign_input.value = "";
});