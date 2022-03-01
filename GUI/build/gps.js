"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const L = require("leaflet");
//MAP WORK
var ter = L.tileLayer('../build/terrain/{z}/{x}/{y}.png', {
    maxZoom: 19,
});
var sat = L.tileLayer('../build/satellite/{z}/{x}/{y}.png', {
    maxZoom: 19,
});
var map = L.map('map', {
    center: [40.1119, -88.2282],
    zoom: 19,
    layers: [sat, ter]
});
var baseMaps = {
    "<span style='color: black'>Satellite</span>": sat,
    "<span style='color: black'>Terrain</span>": ter
};
L.control.layers(baseMaps).addTo(map);
L.marker([40.1119, -88.2282]).addTo(map);
//# sourceMappingURL=gps.js.map