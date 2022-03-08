import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let submit_button = <HTMLButtonElement>document.getElementById("submit");
let call_sign_input = <HTMLInputElement>document.getElementById("call_sign");

submit_button.addEventListener("click", () => {
    ipcRenderer.send('call_sign', call_sign_input.value);
    // call_sign_input.value = "";
});