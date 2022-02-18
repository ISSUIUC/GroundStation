import { app, BrowserWindow, ipcMain } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
// Initializes windows as main windows.
let mainWindow : BrowserWindow;
let serialWindow : BrowserWindow;
let serial_port : SerialPort;

app.on('ready', () => {
    console.log('App is ready');
    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
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
        width: 400,
        height: 300,
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

ipcMain.on('connect', (evt, message) => {
    console.log(`Connecting to serial port ${message}`);
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Delimiter({delimiter:'\n'});
    serial_port.pipe(parser);
    parser.on('data', data=>{
        mainWindow.webContents.send('serial', data.toString());
    });
});


