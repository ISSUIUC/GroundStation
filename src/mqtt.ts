import { ipcRenderer } from "electron";
import * as SerialPort from "serialport"

const scan_drop = <HTMLSelectElement>document.getElementById('ScanDrop');
const url = <HTMLInputElement>document.getElementById('mqtturl');
const led_status = document.getElementById('led_status');
const connect = <HTMLButtonElement>document.getElementById('Connect');
const disconnect = <HTMLButtonElement>document.getElementById('Disconnect');
let set = false;



connect.addEventListener('click', ()=> {
    let i = scan_drop.selectedIndex;
    if(i <= 0) return;
    let uri = url.value
    if (uri == "") {
        uri = "localhost"
    }
    ipcRenderer.send('connect_mqtt', scan_drop.options[i].value, uri);
})

disconnect.addEventListener('click', ()=> {
    let i = scan_drop.selectedIndex;
    if(i <= 0) return;
    ipcRenderer.send('disconnect_mqtt', scan_drop.options[i].value);
})







