import { ipcMain, ipcRenderer } from 'electron';
import { ServerConnection } from './serverConnection';

let submit_button = <HTMLButtonElement>document.getElementById("submit");
let lat_input = <HTMLInputElement>document.getElementById("lat");
let long_input = <HTMLInputElement>document.getElementById("long");
let alt_input = <HTMLInputElement>document.getElementById("alt");
let optdrop = <HTMLSelectElement>document.getElementById("OptDrop");

let coord_dict: { [key: string]: number[] } = {
    'talbot': [40.1119, -88.2282, 0],
    'qcrc': [41.488167, -89.500778, 0],
    'michiana': [41.774273, -86.572435, 0],
    'irec': [32.990, -106.9754, 0]
}

submit_button.addEventListener("click", () => {
    ipcRenderer.send('homecoords', parseFloat(lat_input.value), parseFloat(long_input.value), parseFloat(alt_input.value));
    // call_sign_input.value = "";
});

optdrop.addEventListener("change", () => {
    let opt = optdrop.options[optdrop.selectedIndex].value;
    // alert(opt);
    if (opt === "0") {
        return;
    }
    lat_input.value = coord_dict[opt][0].toString();
    long_input.value = coord_dict[opt][1].toString();
    alt_input.value = coord_dict[opt][2].toString();
});