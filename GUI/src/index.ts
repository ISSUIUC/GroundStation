import { app, BrowserWindow, Menu } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';

// Initializes windows as main windows.
let mainWinow;
let serialWindow;


app.on('ready', () => {
    console.log('App is ready');
    const win = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
        }
    }); 

    const indexHTML = path.join(__dirname + '/index.html');
    win.loadFile(indexHTML).then(() => {
        serial_communicate(win);
    }).catch(e => console.error(e));

    // Builds menu template and renders it in the main window
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainMenu);
});


function serial_communicate(window: BrowserWindow){
    setInterval(async ()=>{
        const ports = await SerialPort.list();
        window.webContents.send("serial", JSON.stringify(ports));
    }, 1000);
    // const port = new SerialPort("COM3");
    // const msg = port.read(128);
    // window.webContents.send("serial", msg);
}

// Creates Serial Connect Window
function createSerialWindow() {
    serialWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: 'Serial Connect'
    });
    serialWindow.loadURL(`file://${__dirname}/serial.html`);
}

// Template for menu
const menuTemplate = [

    // "File" subgroup
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: 'ctrl+Q',
                click() { app.quit(); }
            }
        ]
    },

    // "Connct" subgroup
    {
       label: 'Connect',
       submenu: [
           {
               label: 'Serial',
               click() { createSerialWindow(); }
           },
           {
               label: 'Ethernet'
           }
       ] 
    }
];



