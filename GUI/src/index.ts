import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
import { WebSocket, WebSocketServer } from 'ws';
import * as fs from 'fs';
import { write } from 'original-fs';

// Initializes windows as main windows.
let mainWindow: BrowserWindow;
let serialWindow: BrowserWindow;
let gpswindow: BrowserWindow;
let freqwindow: BrowserWindow;
let callsignwindow: BrowserWindow;
let serial_port: SerialPort;
let server: WebSocketServer;
let web_sockets: WebSocket[] = [];
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
        },
        fullscreen: true,
        icon: __dirname + '/iss_logo.png',
    });

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
        window.webContents.send("serial", JSON.stringify(ports));
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

export function callAbort() {

    let response = dialog.showMessageBoxSync(this, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to Abort?'
    });

    if(response == 0) {
        // serial_port.write("ABORT COMMAND GOES HERE"); CHANGE COMMAND ASAP
    }

    console.log(app.getPath("logs"));
    mainWindow.webContents.send("write_to_csv", app.getPath("logs"));
}

ipcMain.on('frequency', (evt, frequency) => {
    freqwindow.close();
    console.log(`Changing frequency to ${frequency}`);
    // serial_port.write('{Command for Changing Frequency}' + frequency); //CHANGE COMMAND ASAP
});

ipcMain.on('call_sign', (evt, call_sign) => {
    callsignwindow.close();
    console.log(`Changing Call Sign to ${call_sign}`);
    // serial_port.write('{Command for Changing Call Sign}' + call_sign); //CHANGE COMMAND ASAP
});

ipcMain.on('connect', (evt, message, baud) => {
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

ipcMain.on('disconnect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});

function send_frontends_data(tag: string, data: string) {
    mainWindow?.webContents.send(tag, data);
    for (const ws of web_sockets) {
        ws.send(JSON.stringify({ event: tag, message: data }));
    }
}