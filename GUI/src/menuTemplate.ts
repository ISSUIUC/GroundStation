import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { callAbort, changeCallSignWindow, changeFrequencyWindow, changeHomePoints, changeLocalFrequencyWindow, change_contrast, createGPSWindow, createSerialWindow, openAboutWindow } from './index';
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
                label: 'About',
                click() { openAboutWindow() }
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
            },
            {
                label: 'Quit',
                accelerator: 'ctrl+Q',
                click() { app.quit(); }
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
                    click() { changeCallSignWindow(); }
                },
                {
                    label: 'Abort',
                    click() { callAbort(); }
                },
                {
                    label: 'Frequency',
                    submenu: [
                        {
                            label: 'Both',
                            click() { changeFrequencyWindow(); }
                        },
                        {
                            label: 'Local',
                            click() { changeLocalFrequencyWindow(); }
                        }
                    ]

                },
                {
                    label: 'Change Contrast',
                    click() { change_contrast(); }
                },
                {
                    label: 'Set Home',
                    click() { changeHomePoints(); }
                }
            ]
        },
        {
            label: 'Maps',
            submenu: [
                {
                    label: 'GPS Window',
                    click() { createGPSWindow(); }
                }
            ]
        }
    ];
}
