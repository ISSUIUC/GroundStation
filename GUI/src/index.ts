import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as SerialPort from "serialport"
import * as path from 'path';

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
    const mainMenu = Menu.buildFromTemplate(mainWindowTemplate(mainWindow));
    mainWindow.setMenu(mainMenu);
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
function createSerialWindow() {
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
    const menu = Menu.buildFromTemplate(serialWindowTemplate(serialWindow));
    serialWindow.setMenu(menu);
    serial_communicate(serialWindow);
}

function serialWindowTemplate(window: BrowserWindow) : MenuItemConstructorOptions[] {
    return [
        // "File" subgroup
        {
            label: 'File',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'ctrl+Q',
                    click() { app.quit(); }
                },
                {
                    label: 'Debug',
                    accelerator: 'F12',
                    click() { window.webContents.openDevTools() }
                }
            ]
        },
    ];
}

function mainWindowTemplate(window: BrowserWindow) : MenuItemConstructorOptions[] {
    return [
        // "File" subgroup
        {
            label: 'File',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'ctrl+Q',
                    click() { app.quit(); }
                },
                {
                    label: 'Debug',
                    accelerator: 'F12',
                    click() { window.webContents.openDevTools() }
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
}
// Template for menu



