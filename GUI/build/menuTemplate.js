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
                    click() { (0, index_1.createSerialWindow)(); }
                },
                {
                    label: 'Ethernet'
                }
            ]
        }
    ];
}
//# sourceMappingURL=menuTemplate.js.map