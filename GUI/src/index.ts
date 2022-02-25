import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
// Initializes windows as main windows.
let mainWindow : BrowserWindow;
let serialWindow : BrowserWindow;
let serial_port : SerialPort;
const isMac = process.platform === 'darwin';

app.on('ready', () => {
    console.log('App is ready');
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    }); 

    const indexHTML = path.join(__dirname + '/index.html');
    mainWindow.loadFile(indexHTML);
    // Builds menu template and renders it in the main window
    mainWindow.setMenu(makeMainMenu(mainWindow));
    if (isMac) {
        Menu.setApplicationMenu(makeMainMenu(mainWindow));
    }

});


function serial_communicate(window: BrowserWindow){
    const interval = setInterval(async ()=>{
        if(window.isDestroyed()){
            clearInterval(interval);
        }
        const ports = await SerialPort.list();
        window.webContents.send("serial", JSON.stringify(ports));
    }, 1000);
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

ipcMain.on('connect', (evt, message, baud) => {
    console.log(`Connecting to serial port ${message}`);
    let baudrate = parseInt(baud);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Readline({delimiter:'\n'});
    serial_port.pipe(parser);
    parser.on('data', data=>{
        mainWindow.webContents.send('connection', data.toString());
    });
});

ipcMain.on('disconnect', (evt, message, baud) => {
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});


