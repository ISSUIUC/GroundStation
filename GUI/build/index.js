"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAbort = exports.changeCallSignWindow = exports.changeFrequencyWindow = exports.createGPSWindow = exports.createSerialWindow = exports.change_contrast = void 0;
const electron_1 = require("electron");
const SerialPort = require("serialport");
const path = require("path");
const menuTemplate_1 = require("./menuTemplate");
const ws_1 = require("ws");
const csv_1 = require("./csv");
// Initializes windows as main windows.
let mainWindow;
let serialWindow;
let gpswindow;
let freqwindow;
let callsignwindow;
let serial_port;
let server;
let web_sockets = [];
let csv = new csv_1.default(electron_1.app.getPath("logs") + "/" + new Date() + ".csv");
const isMac = process.platform === 'darwin';
electron_1.app.on('ready', () => {
    console.log('App is ready');
    mainWindow = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        },
        fullscreen: true,
        icon: __dirname + '/iss_logo.png',
    });
    const indexHTML = path.join(__dirname + '/index.html');
    mainWindow.loadFile(indexHTML);
    // Builds menu template and renders it in the main window
    mainWindow.setMenu((0, menuTemplate_1.makeMainMenu)(mainWindow));
    if (isMac) {
        electron_1.Menu.setApplicationMenu((0, menuTemplate_1.makeMainMenu)(mainWindow));
    }
    server = new ws_1.WebSocketServer({
        port: 8080
    });
    server.on('connection', (ws) => {
        web_sockets.push(ws);
        ws.onclose = () => { web_sockets = web_sockets.filter(w => w != ws); };
    });
});
function serial_communicate(window) {
    const interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
        if (window.isDestroyed()) {
            clearInterval(interval);
        }
        const ports = yield SerialPort.list();
        window.webContents.send("serial", JSON.stringify(ports));
    }), 1000);
}
function change_contrast() {
    mainWindow.webContents.send("contrast");
}
exports.change_contrast = change_contrast;
// Creates Serial Connect Window
function createSerialWindow() {
    serialWindow = new electron_1.BrowserWindow({
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
    serialWindow.setMenu((0, menuTemplate_1.makeSerialMenu)(serialWindow));
    serial_communicate(serialWindow);
}
exports.createSerialWindow = createSerialWindow;
function createGPSWindow() {
    gpswindow = new electron_1.BrowserWindow({
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
    // serialWindow.setMenu(makeSerialMenu(serialWindow)); May use it for future commands 
}
exports.createGPSWindow = createGPSWindow;
function changeFrequencyWindow() {
    freqwindow = new electron_1.BrowserWindow({
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
exports.changeFrequencyWindow = changeFrequencyWindow;
function changeCallSignWindow() {
    callsignwindow = new electron_1.BrowserWindow({
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
exports.changeCallSignWindow = changeCallSignWindow;
function callAbort() {
    let response = electron_1.dialog.showMessageBoxSync(this, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to Abort?'
    });
    if (response == 0) {
        // serial_port.write("ABORT COMMAND GOES HERE"); CHANGE COMMAND ASAP
    }
    console.log(electron_1.app.getPath("logs"));
    mainWindow.webContents.send("write_to_csv", electron_1.app.getPath("logs"));
}
exports.callAbort = callAbort;
electron_1.ipcMain.on('frequency', (evt, frequency) => {
    freqwindow.close();
    console.log(`Changing frequency to ${frequency}`);
    // serial_port.write('{Command for Changing Frequency}' + frequency); //CHANGE COMMAND ASAP
});
electron_1.ipcMain.on('call_sign', (evt, call_sign) => {
    callsignwindow.close();
    console.log(`Changing Call Sign to ${call_sign}`);
    // serial_port.write('{Command for Changing Call Sign}' + call_sign); //CHANGE COMMAND ASAP
});
electron_1.ipcMain.on('connect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Connecting to serial port ${message}`);
    let baudrate = parseInt(baud);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Readline({ delimiter: '\n' });
    serial_port.pipe(parser);
    parser.on('data', on_serial_data);
});
electron_1.ipcMain.on('disconnect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});
function on_serial_data(data) {
    send_frontends_data('data', data.toString());
    csv.write_data(JSON.parse(data));
}
function send_frontends_data(tag, data) {
    var _a;
    (_a = mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents) === null || _a === void 0 ? void 0 : _a.send(tag, data);
    for (const ws of web_sockets) {
        ws.send(JSON.stringify({ event: tag, message: data }));
    }
}
setInterval(() => {
    const val = Math.cos(Math.random());
    const data = {
        type: 'data',
        value: {
            LSM_IMU_mx: val,
            LSM_IMU_my: val,
            LSM_IMU_mz: val,
            LSM_IMU_gx: val,
            LSM_IMU_gy: val,
            LSM_IMU_gz: val,
            LSM_IMU_ax: val,
            LSM_IMU_ay: val,
            LSM_IMU_az: val,
            gps_lat: val,
            gps_long: val,
            gps_alt: val,
            KX_IMU_ax: val,
            KX_IMU_ay: val,
            KX_IMU_az: val,
            H3L_IMU_ax: val,
            H3L_IMU_ay: val,
            H3L_IMU_az: val,
            barometer_alt: val,
            signal: val,
            sign: "qxqxlol",
            FSM_state: 1
        }
    };
    on_serial_data(JSON.stringify(data));
}, 30);
//# sourceMappingURL=index.js.map