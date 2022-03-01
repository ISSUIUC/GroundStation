"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const scan_drop = document.getElementById('ScanDrop');
const led_status = document.getElementById('led_status');
const baud_drop = document.getElementById('BaudDrop');
const connect = document.getElementById('Connect');
const disconnect = document.getElementById('Disconnect');
const scan = document.getElementById('Scan');
let ScanDropMessage;
let set = false;
scan.addEventListener('click', () => {
    var i, L = scan_drop.options.length - 1;
    for (i = L; i >= 0; i--) {
        scan_drop.remove(i);
    }
    scan_drop.add(new Option("Select Device", "0"));
    for (let i = 0; i < ScanDropMessage.length; i++) {
        scan_drop.add(new Option(ScanDropMessage[i]["path"], ScanDropMessage[i]["path"]));
    }
});
connect.addEventListener('click', () => {
    let i = scan_drop.selectedIndex;
    if (i <= 0)
        return;
    electron_1.ipcRenderer.send('connect', scan_drop.options[i].value, baud_drop.options[baud_drop.selectedIndex].value);
});
disconnect.addEventListener('click', () => {
    let i = scan_drop.selectedIndex;
    if (i <= 0)
        return;
    electron_1.ipcRenderer.send('disconnect', scan_drop.options[i].value, baud_drop.options[baud_drop.selectedIndex].value);
});
// scan_drop.add(new Option("Text", "Value"));
// led_button.addEventListener("click", ()=>{
electron_1.ipcRenderer.on("serial", (event, message) => {
    ScanDropMessage = JSON.parse(message);
    if (!set) {
        for (let i = 0; i < ScanDropMessage.length; i++) {
            scan_drop.add(new Option(ScanDropMessage[i]["path"], ScanDropMessage[i]["path"]));
        }
        set = true;
    }
});
//# sourceMappingURL=serial.js.map