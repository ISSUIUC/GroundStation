import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';
import { makeMainMenu, makeSerialMenu } from './menuTemplate';
import { WebSocket, WebSocketServer } from 'ws';
import * as fs from 'fs';
import { write } from 'original-fs';
import CSVWriter, { readDemo } from './csv';
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
let rawjsonwindow: BrowserWindow;
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
        icon: __dirname + '../build/iss_logo.png',
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

export function openRawJSONWindow() {
    rawjsonwindow = new BrowserWindow({
        width: 800,
        height: 800,
        title: 'Rocket Connection Status',
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    });
    rawjsonwindow.loadURL(`file://${__dirname}/rawjson.html`);
    if (isMac) {
        Menu.setApplicationMenu(makeMainMenu(rawjsonwindow));
    }
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

export function actuateFlaps() {
    console.log(`Actuating Flaps`);
    serial_port.write(`FLAP \n`);
    serial_port.flush();
}



ipcMain.on('frequency', (evt, frequency) => {
    freqwindow.close();
    let float_Frequency = parseFloat(frequency);
    console.log(`Changing frequency to ${float_Frequency}`);
    serial_port.write(`FREQ ${float_Frequency}\n`);
    serial_port.flush();
});

ipcMain.on('local_frequency', (evt, frequency) => {
    localfreqwindow.close();
    let float_Frequency = parseFloat(frequency);
    console.log(`Changing frequency to ${float_Frequency}`);
    serial_port.write(`FLOC ${float_Frequency}\n`);
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
    try {
        if (serial_port.isOpen) {
            serial_port.close();
        }
    } catch (e) {
        
    }
    console.log(`Connecting to serial port ${message}`);
    let baudrate = parseInt(baud);
    serial_port = new SerialPort(message);
    const parser = new SerialPort.parsers.Readline({ delimiter: '\n' });
    try {
        rawjsonwindow?.webContents?.send('feather')
    } catch (e) {

    }
    serial_port.addListener('close', () => {
        rawjsonwindow?.webContents?.send('disc_feather')
    })
    serial_port.pipe(parser);
    parser.on('data', on_serial_data);
});

ipcMain.on('disconnect', (evt, message, baud) => {
    serialWindow.close();
    console.log(`Disconnecting from serial port ${message}`);
    serial_port.close(function (err) {
        console.log('port closed', err);
    });
    serial_port = undefined;
});

function on_serial_data(data: string) {
    try {
        if (JSON.parse(data)["type"] != "data") {
            console.log(data);
        }
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
    } catch (e) {
        console.log(e);
    }
}

function send_frontends_data(tag: string, data: string) {
    mainWindow?.webContents?.send(tag, data);
    for (const ws of web_sockets) {
        ws.send(JSON.stringify({ event: tag, message: data }));
    }
    rawjsonwindow?.webContents?.send(tag, data);

}

ipcMain.on('load_coords', (evt) => {
    let data = csv.read_data();
    gpswindow?.webContents?.send('csv', JSON.stringify(data.split("\n")), latitude, longitude, altitude);
});

ipcMain.on('debugger', (evt, message) => {
    console.log(message);
});

ipcMain.on('long_time_no_see', (evt) => {
    try {
        rawjsonwindow?.webContents?.send('no_data')
    } catch (e) {

    }
    
})

export function playback() {
    let filename = dialog.showOpenDialogSync({ properties: ['openFile'] });
    if (filename == undefined) {
        return;
    }
    let filedump = readDemo(filename[0]).split("\n");
    let packets: SerialResponse[] = [];
    for (let i = 1; i < filedump.length - 1; i++) {
        let data: string[] = filedump.at(i).split(",");
        const temp: SerialResponse = {
            type: 'data',
            value: {
                LSM_IMU_mx: parseFloat(data[1]),
                LSM_IMU_my: parseFloat(data[2]),
                LSM_IMU_mz: parseFloat(data[3]),
                LSM_IMU_gx: parseFloat(data[4]),
                LSM_IMU_gy: parseFloat(data[5]),
                LSM_IMU_gz: parseFloat(data[6]),
                LSM_IMU_ax: parseFloat(data[7]),
                LSM_IMU_ay: parseFloat(data[8]),
                LSM_IMU_az: parseFloat(data[9]),
                gps_lat: parseFloat(data[10]),
                gps_long: parseFloat(data[11]),
                gps_alt: parseFloat(data[12]),
                STE_ALT: parseFloat(data[13]),
                STE_VEL: parseFloat(data[14]),
                STE_ACC: parseFloat(data[15]),
                STE_APO: parseFloat(data[16]),
                KX_IMU_ax: parseFloat(data[17]),
                KX_IMU_ay: parseFloat(data[18]),
                KX_IMU_az: parseFloat(data[19]),
                TEMP: parseFloat(data[20]),
                barometer_alt: parseFloat(data[21]),
                sign: data[22],
                FSM_state: parseFloat(data[23]),
                RSSI: parseFloat(data[24]),
                Voltage: parseFloat(data[25]),
                frequency: parseFloat(data[26]),
                flap_extension: parseFloat(data[27]),
                pressure: parseFloat(data[28])
            }
        }
        packets.push(temp);

    }
    let index = 0;
    myLoop(packets);
}

var i = 0;

function myLoop(packets: SerialResponse[]) {
    //  create a loop function
    setTimeout(function () {   //  call a 3s setTimeout when the loop is called
        const data: SerialResponse = packets[i];
        on_serial_data(JSON.stringify(data));   //  your code here
        i++;                    //  increment the counter
        if (i < packets.length) {           //  if the counter < 10, call the loop function
            myLoop(packets);             //  ..  again which will trigger another 
        }                       //  ..  setTimeout()
    }, 200)
}

export function demo() {
    var num = 0;
    var interval = setInterval(() => {
        num++;
        if (num > 150) {
            clearInterval(interval);
        }

        const val = Math.cos(num/10);
        const rand = Math.sin(num/10);

        const data: SerialResponse = {
            type: 'data',
            value: {
                LSM_IMU_mx: val,
                LSM_IMU_my: rand,
                LSM_IMU_mz: val * rand,
                LSM_IMU_gx: val,
                LSM_IMU_gy: rand,
                LSM_IMU_gz: val * rand,
                LSM_IMU_ax: val,
                LSM_IMU_ay: rand,
                LSM_IMU_az: val * rand,
                // gps_lat: 40.1119 + val / 1000, //Talbot Lat
                // gps_long: -88.2282 + rand / 1000, //Talbot Long
                gps_lat: 41.488167 + val / 1000, //QCRC
                gps_long: -89.500778 + rand / 1000, //QCRC
                // gps_lat: 32.990 + val / 1000, //IREC
                // gps_long: -106.9754 + rand / 1000, //IREC
                // gps_lat: 0,
                // gps_long: 0,
                gps_alt: (num/150) * 45000,
                STE_ALT: val,
                STE_VEL: rand,
                STE_ACC: val * rand,
                STE_APO: rand*val*2,
                KX_IMU_ax: val,
                KX_IMU_ay: rand,
                KX_IMU_az: val + rand,
                barometer_alt: val,
                RSSI: val,
                sign: "qxqxlol",
                FSM_state: num * (15/150),
                Voltage: val,
                TEMP: val,
                frequency: val,
                flap_extension: rand/val,
                pressure: 918
            }
        }

        on_serial_data(JSON.stringify(data));
    }, 66);
}
