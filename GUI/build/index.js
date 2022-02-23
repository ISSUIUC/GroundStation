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
exports.createSerialWindow = void 0;
const electron_1 = require("electron");
const SerialPort = require("serialport");
const path = require("path");
const menuTemplate_1 = require("./menuTemplate");
// Initializes windows as main windows.
let mainWindow;
let serialWindow;
let serial_port;
const isMac = process.platform === 'darwin';
electron_1.app.on('ready', () => {
    console.log('App is ready');
    mainWindow = new electron_1.BrowserWindow({
        width: 900,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    const indexHTML = path.join(__dirname + '/index.html');
    mainWindow.loadFile(indexHTML);
    // Builds menu template and renders it in the main window
    mainWindow.setMenu((0, menuTemplate_1.makeMainMenu)(mainWindow));
    if (isMac) {
        electron_1.Menu.setApplicationMenu((0, menuTemplate_1.makeMainMenu)(mainWindow));
    }
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
electron_1.ipcMain.on('connect', (evt, message, baud) => {
    console.log(`Connecting to serial port ${message}`);
    let baudrate = parseInt(baud);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Delimiter({ delimiter: '\n' });
    serial_port.pipe(parser);
    parser.on('data', data => {
        mainWindow.webContents.send('connection', data.toString());
    });
});
electron_1.ipcMain.on('disconnect', (evt, message, baud) => {
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});
//# sourceMappingURL=index.js.map