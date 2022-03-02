import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
import { WebSocket, WebSocketServer } from 'ws';
// Initializes windows as main windows.
let mainWindow : BrowserWindow;
let serialWindow : BrowserWindow;
let serial_port : SerialPort;
let server : WebSocketServer;
let web_sockets : WebSocket[] = [];
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
            ws.onclose = ()=>{web_sockets=web_sockets.filter(w=>w!=ws)};
        }
    )
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
        send_frontends_data('data', data.toString());
    });
});

ipcMain.on('disconnect', (evt, message, baud) => {
    console.log(`Disconnecting from serial port ${message}`);
    // serial_port = new SerialPort(message, {baudRate : baudrate});
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
});

function send_frontends_data(tag: string, data: string){
    mainWindow?.webContents?.send(tag, data);
    for(const ws of web_sockets){
        ws.send(JSON.stringify({event: tag, message: data}));
    }
}

// setInterval(()=>{

//     const val = Math.cos(Math.random());
//     const data = {
// 		LSM_IMU_mx : val,
// 		LSM_IMU_my : val,
// 		LSM_IMU_mz : val,
// 		LSM_IMU_gx : val,
// 		LSM_IMU_gy : val,
// 		LSM_IMU_gz : val,
// 		LSM_IMU_ax : val,
// 		LSM_IMU_ay : val,
// 		LSM_IMU_az : val,
// 		gps_lat : val,
// 		gps_long : val,
// 		gps_alt : val,
// 		KX_IMU_ax : val,
// 		KX_IMU_ay : val,
// 		KX_IMU_az : val,
// 		H3L_IMU_ax : val,
// 		H3L_IMU_ay : val,
// 		H3L_IMU_az : val,
//         barometer_alt : val,
//     }
//     send_frontends_data('data', JSON.stringify({type: 'data', value: data}));
// }, 30);