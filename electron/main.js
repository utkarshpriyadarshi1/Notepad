/* eslint-env node */
const {app, BrowserWindow, Tray, Menu, ipcMain, screen} = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('../app.config.json');
// 1. Import local sub-system brain modules
const {setupFilesystemHandlers} = require('./fsControllers');
const {setupServiceHandlers, getWorkerStatus} = require('./serviceController');
const {writeLog, setupLoggerIPC} = require('./logger'); // 👈 Import Logging system

let tray = null;
// app.disableHardwareAcceleration();  // Forces alpha layer glass transparency rendering

function rebuildTrayMenu() {
    if (!tray) return;
    const isRunning = getWorkerStatus();

    tray.setContextMenu(Menu.buildFromTemplate([{
        label: `New ${config.appName} Note`,
        click: () => createWidgetWindow()
    }, {type: 'separator'}, {
        label: 'Show All Notes',
        click: () => BrowserWindow.getAllWindows().forEach(w => w.show())
    }, {label: 'Hide All Notes', click: () => BrowserWindow.getAllWindows().forEach(w => w.hide())},

        {type: 'separator'}, {
            label: '🎯 Force UI Reload Refresh',
            click: () => BrowserWindow.getAllWindows().forEach(w => w.webContents.reload())
        }, {
            label: '🎯 Reset Notes Position (Center)', click: () => {
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
                        x: centerX + offset, y: centerY + offset, width: defaultWidth, height: defaultHeight
                    });

                    // Force-notify the specific React window hook layer to log the new position parameters
                    win.webContents.send('window-moved', {
                        x: centerX + offset, y: centerY + offset, width: defaultWidth, height: defaultHeight
                    });
                });
                console.log("⚡ [Rescue Operations] All active windows re-centered via taskbar tray context menu.");
            }
        }, {
            label: '🎯 Reset Notes Size', click: () => {
                const windows = BrowserWindow.getAllWindows();
                const primaryDisplay = screen.getPrimaryDisplay();
                const {width, height} = primaryDisplay.workAreaSize;

                const defaultWidth = 350;
                const defaultHeight = 420;
                const centerX = Math.floor((width - defaultWidth) / 2);
                const centerY = Math.floor((height - defaultHeight) / 2);

                windows.forEach((win, index) => {
                    // Offset cascading windows slightly if multiple windows are being reset at once
                    const offset = index * 25;
                    win.setBounds({
                        x: centerX + offset, y: centerY + offset, width: defaultWidth, height: defaultHeight
                    });

                    // Force-notify the specific React window hook layer to log the new position parameters
                    win.webContents.send('window-moved', {
                        x: centerX + offset, y: centerY + offset, width: defaultWidth, height: defaultHeight
                    });
                });
                console.log("⚡ [Rescue Operations] All active windows re-centered via taskbar tray context menu.");
            }
        }, {type: 'separator'}, {label: `Core Engine Status: [${isRunning ? 'RUNNING' : 'STOPPED'}]`, enabled: false}, {
            label: 'Start Task Engine Service', enabled: !isRunning, click: () => {
                ipcMain.emit('control-task-service', null, 'start');
                rebuildTrayMenu();
            }
        }, {
            label: 'Stop Task Engine Service', enabled: isRunning, click: () => {
                ipcMain.emit('control-task-service', null, 'stop');
                rebuildTrayMenu();
            }
        }, {
            label: 'Restart Task Engine Service', click: () => {
                ipcMain.emit('control-task-service', null, 'restart');
                rebuildTrayMenu();
            }
        }, {type: 'separator'}, {
            label: `Quit Application Process`, click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }]));
}

app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId(config.taskManagerServiceName);

    // 3. Initialize ALL sub-system operations channels
    setupLoggerIPC(ipcMain, app); // 👈 Connect log channels
    setupFilesystemHandlers(ipcMain, app);
    setupServiceHandlers(ipcMain);

    ipcMain.handle('get-window-id', (event) => {
        const w = BrowserWindow.fromWebContents(event.sender);
        return w ? w.widgetId : 'widget_1';
    });

    writeLog(app, 'INFO', 'App_Lifecycle', `${config.appName} subsystem boots completely offline.`);

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
    if (w) {
        w.setAlwaysOnTop(pin);
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('window-state-updated');
        });
    }
});

ipcMain.on('broadcast-db-update', (event) => {
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents !== event.sender) {
            w.webContents.send('db-updated');
        }
    });
});

ipcMain.on('delete-widget-window', (event, widgetId) => {
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.widgetId === widgetId) {
            w.destroy();
        }
    });
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-state-updated');
    });
});

ipcMain.on('focus-widget-window', (event, widgetId) => {
    let found = false;
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.widgetId === widgetId) {
            w.show();
            w.focus();
            found = true;
        }
    });
    if (!found) {
        createWidgetWindow(widgetId);
    }
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-state-updated');
    });
});

ipcMain.on('hide-widget-window', (event, widgetId) => {
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.widgetId === widgetId) {
            w.hide();
        }
    });
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-state-updated');
    });
});

ipcMain.on('set-widget-always-on-top', (event, widgetId, pin) => {
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.widgetId === widgetId) {
            w.setAlwaysOnTop(pin);
        }
    });
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('window-state-updated');
    });
});

ipcMain.on('drag-window', (event, dx, dy) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (w) {
        const bounds = w.getBounds();
        w.setBounds({
            x: Math.round(bounds.x + dx),
            y: Math.round(bounds.y + dy),
            width: bounds.width,
            height: bounds.height
        });
    }
});

ipcMain.on('resize-to-settings', (event, isOpen) => {
    const w = BrowserWindow.fromWebContents(event.sender);
    if (w) {
        if (isOpen) {
            w.setResizable(true);
            w.setSize(920, 550);
            w.center();
        } else {
            w.setSize(350, 420);
            w.setResizable(config.windowDefaults?.resizable ?? true);
        }
    }
});

ipcMain.handle('get-windows-state', () => {
    const states = {};
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.widgetId) {
            states[w.widgetId] = {
                visible: w.isVisible(),
                pinned: w.isAlwaysOnTop()
            };
        }
    });
    return states;
});

process.on('uncaughtException', (error) => {
    writeLog(app, 'CRITICAL', 'Main_Process_Global', error.message, error.stack);
    if (app.isReady()) app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
    const stack = reason instanceof Error ? reason.stack : '';
    const message = reason instanceof Error ? reason.message : String(reason);
    writeLog(app, 'ERROR', 'Main_Process_Rejection', message, stack);
});


// ============================================================================
// PRODUCTION ENGINE PERFORMANCE TUNING SWITCHES
// ============================================================================
// app.disableHardwareAcceleration(); // Forces software rendering (cuts memory by up to 40MB per note)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache'); // Stops unnecessary shader compiling cache
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128'); // Limits V8 garbage collector to 128MB max RAM

// Force system timers to wake up less frequently when hidden
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');


// 1. RE-ENABLE HARDWARE ACCELERATION (Disabling it causes blank/hidden windows on newer Windows 11 updates)
// Remove or comment out: app.disableHardwareAcceleration();

function createWidgetWindow(targetWidgetId = null) {
    // 2. FORCE EXPLICIT SAFE INITIAL COORDINATES
    const defaultWidth = config.windowDefaults?.width || 350;
    const defaultHeight = config.windowDefaults?.height || 420;

    // Centers the initial widget window directly on screen safely
    const win = new BrowserWindow({
        width: defaultWidth,
        height: defaultHeight,
        x: 150, // Force absolute safe X anchor placement
        y: 150, // Force absolute safe Y anchor placement
        frame: false,
        transparent: true,
        hasShadow: true, // Re-enable window shadows to allow frame drawing initialization
        alwaysOnTop: true,
        resizable: config.windowDefaults?.resizable ?? true,
        icon: path.resolve(config.icons.taskbarIcon),
        title: config.appName,
        webPreferences: {
            nodeIntegration: true, contextIsolation: false,
        },
    });

    win.widgetId = targetWidgetId || (BrowserWindow.getAllWindows().filter(w => w !== win).length === 0 ? 'widget_1' : `widget_${Date.now()}`);

    // 3. SHOW WINDOW INSTANTLY WHEN READY TO PREVENT BLANK RENDERS
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });

    const startUrl = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    win.on('move', () => {
        win.webContents.send('window-moved', win.getBounds());
    });

    win.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            win.hide();
            BrowserWindow.getAllWindows().forEach(w => {
                w.webContents.send('window-state-updated');
            });
        }
    });

    return win;
}
