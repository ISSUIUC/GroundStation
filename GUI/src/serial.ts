import { ipcRenderer } from "electron";
import * as SerialPort from "serialport"

const scan_drop = <HTMLSelectElement>document.getElementById('ScanDrop');
const led_status = document.getElementById('led_status');
const baud_drop = <HTMLSelectElement>document.getElementById('BaudDrop');
const connect = <HTMLButtonElement>document.getElementById('Connect')


let ScanDropMessage : [{path : string}];
let set = false;

connect.addEventListener('click', ()=> {
    let i = scan_drop.selectedIndex;
    if(i <= 0) return;
    ipcRenderer.send('connect', scan_drop.options[i].value)
})

// scan_drop.add(new Option("Text", "Value"));
// led_button.addEventListener("click", ()=>{
ipcRenderer.on("serial",(event, message)=>{
    ScanDropMessage = JSON.parse(message);
    
    if (!set) {
        for (let i = 0; i < ScanDropMessage.length; i++) {
            scan_drop.add(new Option(ScanDropMessage[i]["path"], ScanDropMessage[i]["path"]));
            
        }
        set = true;
    }
    


});





