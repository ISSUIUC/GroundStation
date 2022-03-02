"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMainMenu = exports.makeSerialMenu = void 0;
const electron_1 = require("electron");
const index_1 = require("./index");
const isMac = process.platform === 'darwin';
function makeSerialMenu(window) {
    return electron_1.Menu.buildFromTemplate(serialWindowTemplate(window));
}
exports.makeSerialMenu = makeSerialMenu;
function makeMainMenu(window) {
    return electron_1.Menu.buildFromTemplate(mainWindowTemplate(window));
}
exports.makeMainMenu = makeMainMenu;
function serialWindowTemplate(window) {
    return [
        fileMenu(window)
    ];
}
function fileMenu(window) {
    return {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                accelerator: 'ctrl+Q',
                click() { electron_1.app.quit(); }
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
function mainWindowTemplate(window) {
    return [
        fileMenu(window),
        // "Connct" subgroup
        {
            label: 'Connect',
            submenu: [
                {
                    label: 'Serial',
                    accelerator: 'ctrl+shift+C',
                    click() { (0, index_1.createSerialWindow)(); }
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
                    click() { (0, index_1.changeCallSignWindow)(); }
                },
                {
                    label: 'Abort',
                    click() { (0, index_1.callAbort)(); }
                },
                {
                    label: 'Frequency',
                    click() { (0, index_1.changeFrequencyWindow)(); }
                },
                {
                    label: 'GPS Window',
                    click() { (0, index_1.createGPSWindow)(); }
                },
                {
                    label: 'Change Contrast',
                    click() { (0, index_1.change_contrast)(); }
                }
            ]
        },
        {
            label: 'Maps',
            submenu: [
                {
                    label: 'GPS Window',
                    click() { (0, index_1.createGPSWindow)(); }
                }
            ]
        }
    ];
}
//# sourceMappingURL=menuTemplate.js.map