"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const led_status = document.getElementById("led_status");
const led_button = document.getElementById("Blink");
led_status.innerHTML = "0";
let led = false;
// led_button.addEventListener("click", ()=>{
electron_1.ipcRenderer.on("connection", (event, message) => {
    const m = JSON.parse(message);
    led_status.innerHTML = message;
});
//# sourceMappingURL=main.js.map