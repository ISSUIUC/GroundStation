import * as L from 'leaflet';
import { ServerConnection } from './serverConnection';

//MAP WORK

var ter = L.tileLayer('../build/terrain/{z}/{x}/{y}.png', {
    maxZoom: 18,
});
var sat = L.tileLayer('../build/satellite/{z}/{x}/{y}.png', {
    maxZoom: 18,
});
var map = L.map('map', {
    center: [40.1119, -88.2282],
    zoom: 18,
    layers: [sat, ter]
});

var baseMaps = {
    "<span style='color: black'>Satellite</span>": sat,
    "<span style='color: black'>Terrain</span>": ter
};

L.control.layers(baseMaps).addTo(map);
L.marker([40.1119, -88.2282]).addTo(map);

export function run_frontend(serverConnection: ServerConnection) {
    /* LOADS ALL THE CHARTS AFTER WINDOW LOADS 
    BUT WILL BE MOVED LATER TO AFTER GSS 
    ESTABLISHES CONNNECTION TO FEATHER */

    serverConnection.on("data", (message) => {
        const masterJSON = JSON.parse(message);
        const m = masterJSON["value"];


        // L.marker([GPS_LAT, GPS_LONG]).addTo(map); m["GPS_LAT"]

    });

}