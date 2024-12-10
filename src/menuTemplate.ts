import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { actuateFlaps, callAbort, changeCallSignWindow, changeFrequencyWindow, changeHomePoints, changeLocalFrequencyWindow, change_contrast, createGPSWindow, createSerialWindow, demo, openAboutWindow, openRawJSONWindow, playback, showOrientationData, createMQTTWindow } from './index';
const isMac = process.platform === 'darwin';

export function makeSerialMenu(window: BrowserWindow) {
    return Menu.buildFromTemplate(serialWindowTemplate(window));
}

export function makeMQTTMenu(window: BrowserWindow) {
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
                accelerator: 'cmdOrctrl+Q',
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
                    label: 'MQTT',
                    accelerator: 'ctrl+shift+M',
                    click() { createMQTTWindow(); }
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
                    label: 'Raw Command',
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
                },
                {
                    label: 'Actuate Flaps',
                    click() { actuateFlaps(); }
                },
            ]
        },
        {
            label: 'Pyro Test',
            submenu: [
                {
                    label: 'Pyro Menu',
                    click() { changeCallSignWindow(); }
                }
            ]
        },
        {
            label: 'Maps',
            submenu: [
                {
                    label: 'GPS Window',
                    click() { createGPSWindow(); }
                },
            ]
        },
        {
            label: 'Utility',
            submenu: [
                {
                    label: 'Playback',
                    click() { playback(); }
                },
                {
                    label: 'Demonstrate',
                    accelerator: 'ctrl+shift+D',
                    click() { demo(); }
                },
                {
                    label: 'Rocket Connection Status',
                    accelerator: 'ctrl+shift+s',
                    click() { openRawJSONWindow(); }
                }
            ]
        }
    ];
}
