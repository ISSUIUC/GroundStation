"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let submit_button = document.getElementById("submit");
let call_sign_input = document.getElementById("call_sign");
submit_button.addEventListener("click", () => {
    electron_1.ipcRenderer.send('call_sign', JSON.stringify(call_sign_input.value));
    // call_sign_input.value = "";
});
//# sourceMappingURL=callsign.js.map