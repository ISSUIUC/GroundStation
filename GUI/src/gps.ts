import { ChartComponentLike } from 'chart.js';
import { app, ipcRenderer } from 'electron';
import * as L from 'leaflet';
import CSVWriter from './csv';
import { ServerConnection } from './serverConnection';
import * as chroma from 'chroma-js';
import { LineString, MultiLineString } from 'geojson';
import { SerialResponse } from './serialResponse';

let lat_element = <HTMLDivElement>document.getElementById("lat");
let long_element = <HTMLDivElement>document.getElementById("long");
let alt_element = <HTMLDivElement>document.getElementById("alt");
let center_button = <HTMLButtonElement>document.getElementById("center");
let distance_element = <HTMLDivElement>document.getElementById("distance");
var c = Array();
let startMarker: L.Marker<any>;
let lastMarker: L.Marker<any>;
let lastAlt = 1000;
let circle_options: L.CircleMarkerOptions;
let marker_options: L.MarkerOptions;
let path_options: L.PathOptions;
let pathLine: L.Polyline<LineString | MultiLineString, any>;
let map: L.Map;
var color_scale = chroma.scale(['#0302FC', '#2A00D5', '#63009E', '#A1015D', '#D80027', '#FE0002']);
let has_moved = false;
//MAP WORK

//41°29'17.4"N 89°30'02.8"W APRIL LAUNCH
//

ipcRenderer.send("load_coords");

export function run_frontend(serverConnection: ServerConnection, registerables: readonly ChartComponentLike[]) {

    serverConnection.on("data", (message) => {
        const masterJSON = JSON.parse(message);
        const m = masterJSON["value"];


        // L.marker([GPS_LAT, GPS_LONG]).addTo(map); m["GPS_LAT"]

    });

}

ipcRenderer.on("csv", (something, message, lat, long, alt) => {
    let centerCoord: number[] = [];
    var ter = L.tileLayer('../build/terrain/{z}/{x}/{y}.png', {
        minZoom: 1,
        maxZoom: 18,
    });
    var sat = L.tileLayer('../build/satellite/{z}/{x}/{y}.png', {
        minZoom: 1,
        maxZoom: 18,
    });
    centerCoord = [lat, long];
    map = L.map('map', {
        center: L.latLng(centerCoord[0], centerCoord[1]),
        zoom: 18,
        layers: [sat, ter]
    });

    marker_options = { "title": "Now" };
    circle_options = { "radius": 4 };
    path_options = { "color": "#d9ba3f" };

    lastAlt = alt;
    

    var baseMaps = {
        "<span style='color: black'>Satellite</span>": sat,
        "<span style='color: black'>Terrain</span>": ter
    };


    map.on("dragstart", moved);
    L.control.layers(baseMaps).addTo(map);

    startMarker = L.marker([lat, long], { title: "Start" }).addTo(map).on('mouseover', function (e) {
        lat_element.innerHTML = lat;
        long_element.innerHTML = long;
        alt_element.innerHTML = alt;
        distance_element.innerHTML = '0';
    });
    c.push(L.latLng(lat,long));
    pathLine = L.polyline(c, path_options).addTo(map);
    const data = JSON.parse(message);
    for (var i = 1; i < data.length - 1; i++) {
        let parse = data.at(i).split(",");
        if (i === 1) {
            lastMarker = L.marker([parseFloat(parse.at(10)), parseFloat(parse.at(11))]).addTo(map).on('mouseover', function (e) {
                lat_element.innerHTML = parse.at(10);
                long_element.innerHTML = parse.at(11);
                alt_element.innerHTML = parse.at(12);
                distance_element.innerHTML = L.latLng(parse.at(10), parse.at(11)).distanceTo(startMarker.getLatLng()).toFixed(3).toString();
            });
        }
        updateTrail(parseFloat(parse.at(10)), parseFloat(parse.at(11)), parseFloat(parse.at(12)));

    }
});

ipcRenderer.on("data", (something, message) => {
    const masterJSON: SerialResponse = JSON.parse(message);
    if (masterJSON.type == "data") {
        const m = masterJSON["value"];
        marker_options.title = "Now";
        updateTrail(m["gps_lat"], m["gps_long"], m["gps_alt"]);
        if (!has_moved) {
            map.setView(L.latLng(m["gps_lat"], m["gps_long"]));
        }
    }
    
});

function updateTrail(lat: number, long: number, alt: number) {
    let temp = lastMarker;
    let copyalt = lastAlt;
    L.circle(temp.getLatLng(), circle_options).setStyle({ color: altColor(lastAlt) }).addTo(map).on('mouseover', function (e) {
        lat_element.innerHTML = temp.getLatLng().lat.toString();
        long_element.innerHTML = temp.getLatLng().lng.toString();
        alt_element.innerHTML = copyalt.toString();
        distance_element.innerHTML = temp.getLatLng().distanceTo(startMarker.getLatLng()).toFixed(3).toString();
    });
    lastMarker.removeFrom(map);
    pathLine.removeFrom(map);
    let latlng = L.latLng(lat, long);

    c.push(latlng);
    pathLine = L.polyline(c, path_options).addTo(map);
    lastMarker = L.marker([lat, long], { title: "Now" }).addTo(map).on('mouseover', function (e) {
        lat_element.innerHTML = lat.toString();
        long_element.innerHTML = long.toString();
        alt_element.innerHTML = alt.toString();
        distance_element.innerHTML = latlng.distanceTo(startMarker.getLatLng()).toFixed(3).toString();
    });
    lastAlt = alt;
    if (!has_moved) {
        map.setView(L.latLng(lat, long));
    }
    //Changes the focus to new coordinates

}

center_button.addEventListener("click", () => {
    map.setView(lastMarker.getLatLng());
    has_moved = false;
});

function altColor(alt: number) {
    return color_scale(alt / 45000).hex();
}

function moved() {
    has_moved = true;
}