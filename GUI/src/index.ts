import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
import { WebSocket, WebSocketServer } from 'ws';
import * as fs from 'fs';
import { write } from 'original-fs';
import CSVWriter from './csv';
import { SerialResponse } from './serialResponse';


// Initializes windows as main windows.
let mainWindow: BrowserWindow;
let aboutWindow: BrowserWindow;
let serialWindow: BrowserWindow;
let gpswindow: BrowserWindow;
let freqwindow: BrowserWindow;
let localfreqwindow: BrowserWindow;
let callsignwindow: BrowserWindow;
let homepointswindow: BrowserWindow;
let serial_port: SerialPort;
let server: WebSocketServer;
let web_sockets: WebSocket[] = [];
let csv: CSVWriter;
let latitude = 0;
let longitude = 0;
let altitude = 0;
const isMac = process.platform === 'darwin';

const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();
const hh = date.getHours();
const mm = date.getMinutes();
const ss = date.getSeconds();
const ms = date.getMilliseconds();

const session = hh <= 12 ? "AM" : "PM";
const hour = (hh < 10) ? "0" + hh : hh;
const minute = (mm < 10) ? "0" + mm : mm;
const second = (ss < 10) ? "0" + ss : ss;

let time = year + "-" + month + "-" + day + "--" + hour + "-" + minute + "-" + second + "-" + ms;

if (isMac) {

    csv = new CSVWriter(app.getPath("logs") + "/" + time + ".csv")
    // csv = new CSVWriter(app.getPath("logs") + "/2022-3-12--14-43-14-36.csv"); //TESTING DELETE LATER
} else {
    csv = new CSVWriter(app.getPath("logs") + "\\" + time + ".csv")
}

app.on('ready', () => {
    console.log('App is ready');
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        },
        icon: __dirname + '/iss_logo.png',
    });
    mainWindow.maximize();

    const indexHTML = path.join(__dirname + '/index.html');
    mainWindow.loadFile(indexHTML);
    // Builds menu template and renders it in the main window
    mainWindow.setMenu(makeMainMenu(mainWindow));
    if (isMac) {
        Menu.setApplicationMenu(makeMainMenu(mainWindow));
    }

    server = new WebSocketServer({
        port: 8080
    })

    server.on(
        'connection', (ws) => {
            web_sockets.push(ws);
            ws.onclose = () => { web_sockets = web_sockets.filter(w => w != ws) };
        }
    )
});


function serial_communicate(window: BrowserWindow) {
    const interval = setInterval(async () => {
        if (window.isDestroyed()) {
            clearInterval(interval);
        }
        const ports = await SerialPort.list();
        try {
            window.webContents.send("serial", JSON.stringify(ports));
        } catch (e: any) {
            clearInterval(interval);
        }
    }, 1000);
}

export function change_contrast() {
    mainWindow.webContents.send("contrast");
}

// Creates Serial Connect Window
export function createSerialWindow() {
    serialWindow = new BrowserWindow({
        width: 500,
        height: 400,
        title: 'Serial Connect',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    serialWindow.loadURL(`file://${__dirname}/serial.html`);
    serialWindow.setMenu(makeSerialMenu(serialWindow));
    serial_communicate(serialWindow);
}

export function createGPSWindow() {
    if (latitude === 0 && longitude === 0 && altitude === 0) {
        changeHomePoints();
        homepointswindow.addListener("closed", createGPSWindow);
        return;
    }
    gpswindow = new BrowserWindow({
        width: 800,
        height: 800,
        title: 'GPS Window',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    gpswindow.loadURL(`file://${__dirname}/gps.html`);
    if (isMac) {
        Menu.setApplicationMenu(makeMainMenu(gpswindow));
    }
    // serialWindow.setMenu(makeSerialMenu(serialWindow)); May use it for future commands 
}

export function changeFrequencyWindow() {
    freqwindow = new BrowserWindow({
        width: 500,
        height: 450,
        title: 'Change Frequency',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    freqwindow.loadURL(`file://${__dirname}/changefreq.html`);
}

export function changeLocalFrequencyWindow() {
    localfreqwindow = new BrowserWindow({
        width: 500,
        height: 450,
        title: 'Change Frequency',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    localfreqwindow.loadURL(`file://${__dirname}/changelocalfreq.html`);
}

export function changeCallSignWindow() {
    callsignwindow = new BrowserWindow({
        width: 500,
        height: 450,
        title: 'Change Call Sign',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    callsignwindow.loadURL(`file://${__dirname}/callsign.html`);
}

export function changeHomePoints() {
    homepointswindow = new BrowserWindow({
        width: 500,
        height: 450,
        title: 'Change Home Coords',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    homepointswindow.loadURL(`file://${__dirname}/homecoords.html`);
}

export function openAboutWindow() {
    aboutWindow = new BrowserWindow({
        width: 500,
        height: 450,
        title: 'About',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    aboutWindow.loadURL(`file://${__dirname}/about.html`);
}

export function callAbort() {

    let response = dialog.showMessageBoxSync(this, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to Abort?'
    });

    if (response === 0) {
        console.log("CALLING ABORT!");
        serial_port.write('ABORT \n');
    }
}

ipcMain.on('frequency', (evt, frequency) => {
    freqwindow.close();
    let int_Frequency = parseInt(frequency);
    console.log(`Changing frequency to ${int_Frequency}`);
    serial_port.write(`FREQ ${int_Frequency}\n`);
    serial_port.flush();
});

ipcMain.on('local_frequency', (evt, frequency) => {
    freqwindow.close();
    let int_Frequency = parseInt(frequency);
    console.log(`Changing frequency to ${int_Frequency}`);
    serial_port.write(`FLOC ${int_Frequency}\n`);
    serial_port.flush();
});

ipcMain.on('call_sign', (evt, call_sign) => {
    callsignwindow.close();
    console.log(`Changing Call Sign to ${call_sign}`);
    serial_port.write("CALLSIGN " + call_sign + "\n");
    serial_port.flush();
});

ipcMain.on('homecoords', (evt, lat, long, alt) => {
    homepointswindow.close();
    latitude = lat;
    longitude = long;
    altitude = alt;
    console.log("Latitude: " + latitude);
    console.log("Longitude: " + longitude);
    console.log("Altitude: " + altitude);
});

ipcMain.on('connect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Connecting to serial port ${message}`);
    let baudrate = parseInt(baud);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Readline({ delimiter: '\n' });
    serial_port.pipe(parser);
    parser.on('data', on_serial_data);
});

ipcMain.on('disconnect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});

function on_serial_data(data: string) {
    console.log(data);
    send_frontends_data('data', data.toString());
    if (gpswindow != null) {
        if (!gpswindow.isDestroyed()) {
            gpswindow.webContents.send('data', data.toString());
        }
    }
    try {
        csv.write_data(JSON.parse(data));
    } catch (e: any) {
        console.error(`couldn't parse ${data}`)
    }
}

function send_frontends_data(tag: string, data: string) {
    mainWindow?.webContents?.send(tag, data);
    for (const ws of web_sockets) {
        ws.send(JSON.stringify({ event: tag, message: data }));
    }

}

ipcMain.on('load_coords', (evt) => {
    let data = csv.read_data();
    console.log(data.split("\n"));
    gpswindow?.webContents?.send('csv', JSON.stringify(data.split("\n")), latitude, longitude, altitude);
});

// setInterval(() => {

//     const val = Math.cos(Math.random());
//     const rand = Math.sin(Math.random());
//     const data: SerialResponse = {
//         type: 'data',
//         value: {
//             LSM_IMU_mx: val,
//             LSM_IMU_my: val,
//             LSM_IMU_mz: val,
//             LSM_IMU_gx: val,
//             LSM_IMU_gy: val,
//             LSM_IMU_gz: val,
//             LSM_IMU_ax: val,
//             LSM_IMU_ay: val,
//             LSM_IMU_az: val,
//             gps_lat: (40.1119 + (val / 1000)),
//             gps_long: (-88.2282 + (rand / 1000)),
//             gps_alt: 45000*val,
//             KX_IMU_ax: val,
//             KX_IMU_ay: val,
//             KX_IMU_az: val,
//             H3L_IMU_ax: val,
//             H3L_IMU_ay: val,
//             H3L_IMU_az: val,
//             barometer_alt: val,
//             sign: "qxqxlol",
//             FSM_state: 7 * val,
//             RSSI: val,
//             Voltage: val,
//             frequency: val
//         }
//     }

//     on_serial_data(JSON.stringify(data));
// }, 1000);