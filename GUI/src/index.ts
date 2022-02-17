import { app, BrowserWindow, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { mainMenu as makeMainMenu, mainWindowTemplate, serialMenu as makeSerialMenu, serialWindowTemplate } from './menuTemplate';

// Initializes windows as main windows.
let mainWindow : BrowserWindow;
let serialWindow : BrowserWindow;


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
    mainWindow.loadFile(indexHTML).then(() => {
        serial_communicate(mainWindow);
    }).catch(e => console.error(e));
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
    // const port = new SerialPort("COM3");
    // const msg = port.read(128);
    // window.webContents.send("serial", msg);
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


