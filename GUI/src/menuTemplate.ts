import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { createSerialWindow } from './index';
const isMac = process.platform === 'darwin';

export function makeSerialMenu(window: BrowserWindow) {
    return Menu.buildFromTemplate(serialWindowTemplate(window));
}

export function makeMainMenu(window: BrowserWindow) {
    return Menu.buildFromTemplate(mainWindowTemplate(window));
}


function serialWindowTemplate(window: BrowserWindow): MenuItemConstructorOptions[] {
    return [
        fileMenu(window)
    ];
}

function fileMenu(window: BrowserWindow): MenuItemConstructorOptions {
    return {
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
                click() { window.webContents.openDevTools(); }
            },
            {
                label: 'Reload',
                accelerator: 'F5',
                click() { window.reload(); }
            }
        ]
    };

}

function mainWindowTemplate(window: BrowserWindow): MenuItemConstructorOptions[] {
    return [
        fileMenu(window),
        // "Connct" subgroup
        {
            label: 'Connect',
            submenu: [
                {
                    label: 'Serial',
                    accelerator: 'ctrl+shift+C',
                    click() { createSerialWindow(); }
                },
                {
                    label: 'Ethernet'
                }
            ]
        },
        {
            label: 'Commands',
            submenu: [
                {
                    label: 'Call Sign',
                },
                {
                    label: 'Abort',
                },
                {
                    label: 'Frequency',
                }
            ]
        }
    ];
}
