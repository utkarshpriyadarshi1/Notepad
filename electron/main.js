/* eslint-env node */
const {app, BrowserWindow, Tray, Menu, ipcMain, screen} = require('electron');
const path = require('path');
const config = require('../app.config');

// 1. Import decoupled structural sub-system brain files
const {setupFilesystemHandlers} = require('./fsControllers');
const {setupServiceHandlers, getWorkerStatus} = require('./serviceController');

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

    // Inside electron/main.js -> locate the startUrl generation inside createWidgetWindow():

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:5173' // 👈 MATCH THIS: Change 'localhost' to '127.0.0.1'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    win.on('move', () => win.webContents.send('window-moved', win.getBounds()));
    win.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            win.hide();
        }
    });
    return win;
}

function rebuildTrayMenu() {
    if (!tray) return;
    const isRunning = getWorkerStatus();

    tray.setContextMenu(Menu.buildFromTemplate([
        {label: `New ${config.appName} Note`, click: () => createWidgetWindow()},
        {type: 'separator'},
        {label: 'Show All Notes', click: () => BrowserWindow.getAllWindows().forEach(w => w.show())},
        {label: 'Hide All Notes', click: () => BrowserWindow.getAllWindows().forEach(w => w.hide())},

        {type: 'separator'},
        {
            label: '🎯 Force UI Reload Refresh',
            click: () => BrowserWindow.getAllWindows().forEach(w => w.webContents.reload())
        },
        {
            label: '🎯 Reset Notes Position (Center)',
            click: () => {
                const windows = BrowserWindow.getAllWindows();
                const primaryDisplay = screen.getPrimaryDisplay();
                const {width, height} = primaryDisplay.workAreaSize;

                const defaultWidth = config.windowDefaults?.width || 350;
                const defaultHeight = config.windowDefaults?.height || 420;
                const centerX = Math.floor((width - defaultWidth) / 2);
                const centerY = Math.floor((height - defaultHeight) / 2);

                windows.forEach((win, index) => {
                    // Offset cascading windows slightly if multiple windows are being reset at once
                    const offset = index * 25;
                    win.setBounds({
                        x: centerX + offset,
                        y: centerY + offset,
                        width: defaultWidth,
                        height: defaultHeight
                    });

                    // Force-notify the specific React window hook layer to log the new position parameters
                    win.webContents.send('window-moved', {
                        x: centerX + offset,
                        y: centerY + offset,
                        width: defaultWidth,
                        height: defaultHeight
                    });
                });
                console.log("⚡ [Rescue Operations] All active windows re-centered via taskbar tray context menu.");
            }
        },
        {
            label: '🎯 Reset Notes Size',
            click: () => {
                const windows = BrowserWindow.getAllWindows();
                const primaryDisplay = screen.getPrimaryDisplay();
                const {width, height} = primaryDisplay.workAreaSize;

                const defaultWidth = 350;
                const defaultHeight =  420;
                const centerX = Math.floor((width - defaultWidth) / 2);
                const centerY = Math.floor((height - defaultHeight) / 2);

                windows.forEach((win, index) => {
                    // Offset cascading windows slightly if multiple windows are being reset at once
                    const offset = index * 25;
                    win.setBounds({
                        x: centerX + offset,
                        y: centerY + offset,
                        width: defaultWidth,
                        height: defaultHeight
                    });

                    // Force-notify the specific React window hook layer to log the new position parameters
                    win.webContents.send('window-moved', {
                        x: centerX + offset,
                        y: centerY + offset,
                        width: defaultWidth,
                        height: defaultHeight
                    });
                });
                console.log("⚡ [Rescue Operations] All active windows re-centered via taskbar tray context menu.");
            }
        },
        {type: 'separator'},
        {label: `Core Engine Status: [${isRunning ? 'RUNNING' : 'STOPPED'}]`, enabled: false},
        {
            label: 'Start Task Engine Service', enabled: !isRunning, click: () => {
                ipcMain.emit('control-task-service', null, 'start');
                rebuildTrayMenu();
            }
        },
        {
            label: 'Stop Task Engine Service', enabled: isRunning, click: () => {
                ipcMain.emit('control-task-service', null, 'stop');
                rebuildTrayMenu();
            }
        },
        {
            label: 'Restart Task Engine Service', click: () => {
                ipcMain.emit('control-task-service', null, 'restart');
                rebuildTrayMenu();
            }
        },
        {type: 'separator'},
        {
            label: `Quit Application Process`, click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && app.isQuitting) app.quit();
});
ipcMain.on('create-note', () => {
    createWidgetWindow();
});
ipcMain.on('set-always-on-top', (ev, pin) => {
    const w = BrowserWindow.fromWebContents(ev.sender);
    if (w) w.setAlwaysOnTop(pin);
});

// ============================================================================
// PRODUCTION ENGINE PERFORMANCE TUNING SWITCHES
// ============================================================================
app.disableHardwareAcceleration(); // Forces software rendering (cuts memory by up to 40MB per note)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache'); // Stops unnecessary shader compiling cache
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128'); // Limits V8 garbage collector to 128MB max RAM

// Force system timers to wake up less frequently when hidden
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');