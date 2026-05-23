/* eslint-env node */
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron'); // Core module mappings
const path = require('path');
const fs = require('fs'); // Node localized filesystem core bindings
const config = require('../app.config');

let tray = null;
let backgroundWorkerProcess = false; // Internal lifecycle state tracking boolean

// Absolute local directory storage path mapping
const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, config.dbFileName);

// ============================================================================
// 1. BACKGROUND ENGINE LIFE-CYCLE SERVICE MANAGEMENT
// ============================================================================
function toggleBackgroundWorker(action) {
    console.log(`Executing background core process action: ${action}`);

    // Cross-Platform Native Service Management Handling
    if (process.platform === 'win32' && config.taskManagerServiceName) {
        // Controlled natively via shell wrappers once packaged:
        // const { exec } = require('child_process');
        // exec(`net ${action} ${config.taskManagerServiceName}`);
    }

    if (action === 'start') {
        backgroundWorkerProcess = true;
        return "RUNNING";
    } else if (action === 'stop') {
        backgroundWorkerProcess = false;
        return "STOPPED";
    } else if (action === 'restart') {
        backgroundWorkerProcess = false;
        backgroundWorkerProcess = true;
        return "RUNNING";
    }
    return "UNKNOWN";
}

// ============================================================================
// 2. FRAMELESS WINDOW GENERATION INITIALIZATION LOOP
// ============================================================================
function createWidgetWindow() {
    const win = new BrowserWindow({
        width: config.windowDefaults?.width || 350,
        height: config.windowDefaults?.height || 420,
        frame: false,          // Strip native operating system framing windows titles bar
        transparent: true,     // Unlocks custom webkit container border-radius options
        alwaysOnTop: true,     // Pins individual sticky widgets above external window profiles
        resizable: config.windowDefaults?.resizable ?? true,
        icon: path.resolve(config.icons.taskbarIcon),
        title: config.appName,
        webPreferences: {
            nodeIntegration: true,     // Direct React execution integration
            contextIsolation: false,   // Accessible pure offline modules communication
        },
    });

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    // Binds dynamic layout position tracking handlers directly inside this window instance
    win.on('move', () => {
        const bounds = win.getBounds();
        win.webContents.send('window-moved', bounds);
    });

    // Intercept window close actions to tuck stickies cleanly away to system tray
    win.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            win.hide();
        }
    });

    return win;
}

// ============================================================================
// 3. SYSTEM TRAY INTEGRATION (DYNAMIC STATE SYNCHRONIZER)
// ============================================================================
function rebuildTrayMenu() {
    if (!tray) return;

    const currentStatus = backgroundWorkerProcess ? "RUNNING" : "STOPPED";

    const contextMenu = Menu.buildFromTemplate([
        {
            label: `New ${config.appName} Note`,
            click: () => {
                const newWin = createWidgetWindow();
                newWin.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Show All Notes',
            click: () => BrowserWindow.getAllWindows().forEach(w => { w.show(); w.focus(); })
        },
        {
            label: 'Hide All Notes',
            click: () => BrowserWindow.getAllWindows().forEach(w => w.hide())
        },
        {
            label: 'Force UI Reload Refresh',
            accelerator: 'CmdOrCtrl+R',
            click: () => BrowserWindow.getAllWindows().forEach(w => w.webContents.reload())
        },
        { type: 'separator' },
        {
            label: `Core Engine Status: [${currentStatus}]`,
            enabled: false // Explicit static context visualization label badge
        },
        {
            label: 'Start Task Engine Service',
            enabled: !backgroundWorkerProcess,
            click: () => {
                toggleBackgroundWorker('start');
                rebuildTrayMenu();
            }
        },
        {
            label: 'Stop Task Engine Service',
            enabled: backgroundWorkerProcess,
            click: () => {
                toggleBackgroundWorker('stop');
                rebuildTrayMenu();
            }
        },
        {
            label: 'Restart Task Engine Service',
            click: () => {
                toggleBackgroundWorker('restart');
                rebuildTrayMenu();
            }
        },
        { type: 'separator' },
        {
            label: `Quit Application Process`,
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu); // Attach the compiled template array instance
}

// ============================================================================
// 4. CORE APPLICATION LIFE-CYCLE EVENTS CONTROLLER
// ============================================================================
app.whenReady().then(() => {
    if (process.platform === 'win32') {
        app.setAppUserModelId(config.taskManagerServiceName);
    }

    createWidgetWindow();

    // Setup tray parameters tracking
    const iconPath = path.resolve(config.icons.trayIcon);
    tray = new Tray(iconPath);
    tray.setToolTip(config.appName);

    toggleBackgroundWorker('start'); // Spin up initial state mapping configurations
    rebuildTrayMenu();

    // Context overlay listener toggle handler for tray single click activations
    tray.on('click', () => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            const anyVisible = windows.some(win => win.isVisible());
            windows.forEach(win => {
                if (anyVisible) win.hide();
                else { win.show(); win.focus(); }
            });
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && app.isQuitting) {
        app.quit();
    }
});

// ============================================================================
// 5. ASYNCHRONOUS FILE-SYSTEM IPC HANDLING PIPELINES
// ============================================================================
ipcMain.on('create-note', () => {
    createWidgetWindow();
});

// Safe window-specific pin level modifier router
ipcMain.on('set-always-on-top', (event, shouldPin) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setAlwaysOnTop(shouldPin);
    }
});

// LOAD: Fetches true local database files stream as binary Uint8Array arrays
ipcMain.handle('load-db-file', async () => {
    try {
        if (fs.existsSync(dbFilePath)) {
            const fileBuffer = await fs.promises.readFile(dbFilePath); // Asynchronous parsing thread safe
            return new Uint8Array(fileBuffer);
        }
        return null;
    } catch (err) {
        console.error("Failed to load binary SQLite database data stream from disk:", err);
        return null;
    }
});

// SAVE: Flushes binary SQLite buffer datasets directly back onto local hard disks
ipcMain.handle('save-db-file', async (event, uint8ArrayData) => {
    try {
        const buffer = Buffer.from(uint8ArrayData);
        await fs.promises.writeFile(dbFilePath, buffer); // Asynchronous filesystem execution loop
        return true;
    } catch (err) {
        console.error("Failed writing binary buffer array back to data file:", err);
        return false;
    }
});

// PURGE: Drops physical file allocation references safely
ipcMain.handle('purge-db-file', async () => {
    try {
        if (fs.existsSync(dbFilePath)) {
            await fs.promises.unlink(dbFilePath);
            return true;
        }
        return false;
    } catch (err) {
        console.error("Failed to execute data block file drop routine:", err);
        return false;
    }
});

ipcMain.handle('get-service-status', async () => {
    return backgroundWorkerProcess ? "RUNNING" : "STOPPED";
});

ipcMain.handle('control-task-service', async (event, action) => {
    const resultStatus = toggleBackgroundWorker(action);
    rebuildTrayMenu();
    return resultStatus;
});
