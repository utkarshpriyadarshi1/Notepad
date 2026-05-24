/* eslint-env node */
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const config = require('../app.config');

// 1. Import decoupled structural sub-system brain files
const { setupFilesystemHandlers } = require('./fsControllers');
const { setupServiceHandlers, getWorkerStatus } = require('./serviceController');

let tray = null;
app.disableHardwareAcceleration(); // Forces alpha layer glass transparency rendering

function createWidgetWindow() {
    const win = new BrowserWindow({
        width: config.windowDefaults?.width || 350,
        height: config.windowDefaults?.height || 420,
        frame: false,
        transparent: true,
        hasShadow: false,      // Stop OS shadow blocks from breaking translucent layers
        alwaysOnTop: true,
        resizable: config.windowDefaults?.resizable ?? true,
        icon: path.resolve(config.icons.taskbarIcon),
        title: config.appName,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);
    win.on('move', () => win.webContents.send('window-moved', win.getBounds()));
    win.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); win.hide(); } });
    return win;
}

function rebuildTrayMenu() {
    if (!tray) return;
    const isRunning = getWorkerStatus();

    tray.setContextMenu(Menu.buildFromTemplate([
        { label: `New ${config.appName} Note`, click: () => createWidgetWindow() },
        { type: 'separator' },
        { label: 'Show All Notes', click: () => BrowserWindow.getAllWindows().forEach(w => w.show()) },
        { label: 'Hide All Notes', click: () => BrowserWindow.getAllWindows().forEach(w => w.hide()) },
        { label: 'Force UI Reload Refresh', click: () => BrowserWindow.getAllWindows().forEach(w => w.webContents.reload()) },
        { type: 'separator' },
        { label: `Core Engine Status: [${isRunning ? 'RUNNING' : 'STOPPED'}]`, enabled: false },
        { label: 'Start Task Engine Service', enabled: !isRunning, click: () => { ipcMain.emit('control-task-service', null, 'start'); rebuildTrayMenu(); } },
        { label: 'Stop Task Engine Service', enabled: isRunning, click: () => { ipcMain.emit('control-task-service', null, 'stop'); rebuildTrayMenu(); } },
        { label: 'Restart Task Engine Service', click: () => { ipcMain.emit('control-task-service', null, 'restart'); rebuildTrayMenu(); } },
        { type: 'separator' },
        { label: `Quit Application Process`, click: () => { app.isQuitting = true; app.quit(); } }
    ]));
}

app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId(config.taskManagerServiceName);

    // 2. Initialize Sub-system operations pipelines
    setupFilesystemHandlers(ipcMain, app);
    setupServiceHandlers(ipcMain);

    createWidgetWindow();
    tray = new Tray(path.resolve(config.icons.trayIcon));
    tray.setToolTip(config.appName);
    rebuildTrayMenu();

    tray.on('click', () => {
        const windows = BrowserWindow.getAllWindows();
        const anyVisible = windows.some(w => w.isVisible());
        windows.forEach(w => anyVisible ? w.hide() : w.show());
    });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin' && app.isQuitting) app.quit(); });
ipcMain.on('create-note', () => { createWidgetWindow(); });
ipcMain.on('set-always-on-top', (ev, pin) => { const w = BrowserWindow.fromWebContents(ev.sender); if (w) w.setAlwaysOnTop(pin); });
