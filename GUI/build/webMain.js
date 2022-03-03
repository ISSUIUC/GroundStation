"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const chart_js_1 = require("chart.js");
class WebConnection {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.listeners = new Map();
        this.ws.onmessage = (msg) => {
            this.post_listeners(msg);
        };
    }
    post_listeners(msg) {
        var _a;
        const { event, message } = JSON.parse(msg.data);
        (_a = this.listeners.get(event)) === null || _a === void 0 ? void 0 : _a.forEach(l => l(message));
    }
    on(channel, listener) {
        let arr = this.listeners.get(channel);
        if (!arr) {
            arr = [];
            this.listeners.set(channel, arr);
        }
        arr.push(listener);
    }
    send(channel, ...args) {
        throw "Can't send message from web frontend";
    }
}
window.onload = () => (0, main_1.run_frontend)(new WebConnection("ws://localhost:8080"), chart_js_1.registerables);
//# sourceMappingURL=webMain.js.map