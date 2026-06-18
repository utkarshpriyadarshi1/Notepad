/* eslint-env node */
const {app, BrowserWindow, Tray, Menu, ipcMain, screen, session} = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('../app.config.json');
// 1. Import local sub-system brain modules
const {setupFilesystemHandlers} = require('./fsControllers');
const {setupServiceHandlers, getWorkerStatus} = require('./serviceController');
const {writeLog, setupLoggerIPC} = require('./logger'); // 👈 Import Logging system

// Helper to resolve icon asset paths correctly in both development and production
function getAssetPath(configPath) {
    if (!configPath) return '';
    const baseName = path.basename(configPath);
    return app.isPackaged
        ? path.join(process.resourcesPath, 'assets', baseName)
        : path.join(__dirname, 'assets', baseName);
}

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

    ipcMain.handle('read-help-files', async () => {
        try {
            const docsHelpPath = app.isPackaged
                ? path.join(process.resourcesPath, 'docs/help')
                : path.join(__dirname, '../docs/help');
            
            if (fs.existsSync(docsHelpPath)) {
                const files = await fs.promises.readdir(docsHelpPath);
                const mdFiles = files.filter(f => f.endsWith('.md'));
                const results = [];
                for (const file of mdFiles) {
                    const content = await fs.promises.readFile(path.join(docsHelpPath, file), 'utf8');
                    results.push({
                        name: file.replace('.md', ''),
                        content: content
                    });
                }
                return results;
            }
            return [];
        } catch (err) {
            console.error("Failed to read help files:", err);
            return [];
        }
    });

    ipcMain.handle('read-log-file', async () => {
        try {
            const logFilePath = path.join(app.getPath('userData'), 'smritipatra_runtime.log');
            if (fs.existsSync(logFilePath)) {
                const content = await fs.promises.readFile(logFilePath, 'utf8');
                return content;
            }
            return '';
        } catch (err) {
            console.error("Failed to read log file:", err);
            return 'Error reading log file.';
        }
    });

    ipcMain.handle('get-cache-stats', async () => {
        try {
            const cacheSize = await session.defaultSession.getCacheSize();
            const logFilePath = path.join(app.getPath('userData'), 'smritipatra_runtime.log');
            let logSize = 0;
            if (fs.existsSync(logFilePath)) {
                logSize = fs.statSync(logFilePath).size;
            }
            const dbFilePath = path.join(app.getPath('userData'), config.dbFileName);
            let dbSize = 0;
            if (fs.existsSync(dbFilePath)) {
                dbSize = fs.statSync(dbFilePath).size;
            }
            return {
                webCache: cacheSize,
                logFile: logSize,
                dbFile: dbSize
            };
        } catch (err) {
            console.error("Failed to get cache stats:", err);
            return { webCache: 0, logFile: 0, dbFile: 0 };
        }
    });

    ipcMain.handle('clear-app-cache', async (event, types) => {
        try {
            if (types.webCache) {
                await session.defaultSession.clearCache();
            }
            if (types.logFile) {
                const logFilePath = path.join(app.getPath('userData'), 'smritipatra_runtime.log');
                if (fs.existsSync(logFilePath)) {
                    await fs.promises.writeFile(logFilePath, '', 'utf8');
                }
            }
            return true;
        } catch (err) {
            console.error("Failed to clear cache:", err);
            return false;
        }
    });

    ipcMain.on('open-external-link', (event, url) => {
        const { shell } = require('electron');
        shell.openExternal(url);
    });

    writeLog(app, 'INFO', 'App_Lifecycle', `${config.appName} subsystem boots completely offline.`);

    createWidgetWindow();
    tray = new Tray(getAssetPath(config.icons.trayIcon));
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
    // No-op under the new Notepad main layout architecture
});

ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        if (win.widgetId === 'main_notepad') {
            app.isQuitting = true;
            app.quit();
        } else {
            win.hide();
            BrowserWindow.getAllWindows().forEach(w => {
                w.webContents.send('window-state-updated');
            });
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
    const activeWindows = BrowserWindow.getAllWindows();
    
    // Determine if this is the main notepad window
    let widgetId = targetWidgetId;
    if (!widgetId) {
        const hasMain = activeWindows.some(w => w.widgetId === 'main_notepad');
        widgetId = hasMain ? `widget_${Date.now()}` : 'main_notepad';
    }
    
    const isMain = widgetId === 'main_notepad';
    
    const width = isMain ? 1000 : (config.windowDefaults?.width || 350);
    const height = isMain ? 650 : (config.windowDefaults?.height || 420);
    const transparent = !isMain;
    const alwaysOnTop = !isMain;
    const resizable = true;
    const frame = false;

    const winOptions = {
        width,
        height,
        frame,
        transparent,
        hasShadow: true,
        alwaysOnTop,
        resizable,
        icon: getAssetPath(config.icons.taskbarIcon),
        title: config.appName,
        webPreferences: {
            nodeIntegration: true, contextIsolation: false,
        },
    };

    if (!isMain) {
        winOptions.x = 150;
        winOptions.y = 150;
    }

    const win = new BrowserWindow(winOptions);
    win.widgetId = widgetId;

    if (isMain) {
        win.center();
    }

    // SHOW WINDOW INSTANTLY WHEN READY TO PREVENT BLANK RENDERS
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });

    const startUrl = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

    win.loadURL(startUrl);

    win.on('move', () => {
        win.webContents.send('window-moved', win.getBounds());
    });

    win.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            if (win.widgetId === 'main_notepad') {
                app.isQuitting = true;
                app.quit();
            } else {
                win.hide();
                BrowserWindow.getAllWindows().forEach(w => {
                    w.webContents.send('window-state-updated');
                });
            }
        }
    });

    return win;
}
