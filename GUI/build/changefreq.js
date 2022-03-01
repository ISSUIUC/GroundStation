"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let submit_button = document.getElementById("submit");
let frequency_input = document.getElementById("frequency");
submit_button.addEventListener("click", () => {
    electron_1.ipcRenderer.send('frequency', JSON.stringify(frequency_input.value));
    // frequency_input.value = "";
});
//# sourceMappingURL=changefreq.js.map