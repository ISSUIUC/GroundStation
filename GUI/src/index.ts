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
let serialWindow: BrowserWindow;
let gpswindow: BrowserWindow;
let freqwindow: BrowserWindow;
let callsignwindow: BrowserWindow;
let serial_port: SerialPort;
let server: WebSocketServer;
let web_sockets: WebSocket[] = [];
let csv: CSVWriter;
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
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
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

function on_serial_data(data: string){
    send_frontends_data('data', data.toString());
    csv.write_data(JSON.parse(data));
}

function send_frontends_data(tag: string, data: string){
    mainWindow?.webContents?.send(tag, data);
    for(const ws of web_sockets){
        ws.send(JSON.stringify({event: tag, message: data}));
    }
}

setInterval(()=>{

    const val = Math.cos(Math.random());
    const data: SerialResponse = {
        type: 'data',
        value:{
            LSM_IMU_mx : val,
            LSM_IMU_my : val,
            LSM_IMU_mz : val,
            LSM_IMU_gx : val,
            LSM_IMU_gy : val,
            LSM_IMU_gz : val,
            LSM_IMU_ax : val,
            LSM_IMU_ay : val,
            LSM_IMU_az : val,
            gps_lat : val,
            gps_long : val,
            gps_alt : val,
            KX_IMU_ax : val,
            KX_IMU_ay : val,
            KX_IMU_az : val,
            H3L_IMU_ax : val,
            H3L_IMU_ay : val,
            H3L_IMU_az : val,
            barometer_alt : val,
            signal : val,
            sign: "qxqxlol",
            FSM_state: 1
        }
    }

    on_serial_data(JSON.stringify(data));
}, 30);