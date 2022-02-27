import { ServerConnection } from "./serverConnection";
import { run_frontend } from "./main";
import { registerables } from "chart.js"

class WebConnection implements ServerConnection {
    ws: WebSocket;
    listeners: Map<string, ((...args: string[])=>void)[]>; 
    constructor(url: string){
        this.ws = new WebSocket(url);
        this.ws.onmessage = (msg)=>{
            this.post_listeners(msg);
        }
    }
    post_listeners(msg: MessageEvent<any>){
        const json: {channel: string, args: string[]} = JSON.parse(msg.data);
        this.listeners.get(json.channel)?.forEach(l=>l(...json.args));
    }
    on(channel: string, listener: (...args: string[])=>void): void {
        let arr = this.listeners.get(channel);
        if(!arr){
            arr = [];
            this.listeners.set(channel, arr);
        }
        arr.push(listener);
    }
    send(channel: string, ...args: string[]): void {
        throw "Can't send message from web frontend";
    }
}

window.onload = ()=>run_frontend(new WebConnection("ws://localhost:8080"), registerables);