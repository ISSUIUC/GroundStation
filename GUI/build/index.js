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
exports.changeCallSignWindow = exports.changeFrequencyWindow = exports.createGPSWindow = exports.createSerialWindow = exports.change_contrast = void 0;
const electron_1 = require("electron");
const SerialPort = require("serialport");
const path = require("path");
const menuTemplate_1 = require("./menuTemplate");
const ws_1 = require("ws");
// Initializes windows as main windows.
let mainWindow;
let serialWindow;
let gpswindow;
let freqwindow;
let callsignwindow;
let serial_port;
let server;
let web_sockets = [];
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
        width: 500,
        height: 450,
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
electron_1.ipcMain.on('frequency', (frequency) => {
    freqwindow.close();
    console.log(`Changing frequency to ${frequency}`);
    // serial_port.write('{Command for Changing Frequency}' + frequency); //CHANGE COMMAND ASAP
});
electron_1.ipcMain.on('call_sign', (call_sign) => {
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
    parser.on('data', data => {
        send_frontends_data('data', data.toString());
    });
});
electron_1.ipcMain.on('disconnect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});
function send_frontends_data(tag, data) {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(tag, data);
    for (const ws of web_sockets) {
        ws.send(JSON.stringify({ event: tag, message: data }));
    }
}
//# sourceMappingURL=index.js.map