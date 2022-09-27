import { ChartComponentLike } from "chart.js";
import { ipcRenderer } from "electron";
import { ServerConnection } from "./serverConnection";


ipcRenderer.on("data", (evt, message) => {
    // document.getElementById("data_feed").innerText = "HELLO";
    const masterJSON = JSON.parse(message);
    document.getElementById("data_feed").innerText =  message + "\n" + document.getElementById("data_feed").innerText;
});


// export function run_frontend(serverConnection: ServerConnection, registerables: readonly ChartComponentLike[]) {

//     serverConnection.on("data", (message) => {
//         const masterJSON = JSON.parse(message);
//         const m = masterJSON["gps_lat"];
//         document.getElementById("data_feed").innerText = m;

//     });

// }