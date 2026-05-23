const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const config = require('../app.config'); // 👈 Import the central configuration profile

let tray = null;

function createWidgetWindow() {
    // Convert relative configuration paths into absolute execution system paths
    const absoluteTaskbarIcon = path.resolve(config.icons.taskbarIcon);

    const win = new BrowserWindow({
        width: config.windowDefaults.width,
        height: config.windowDefaults.height,
        frame: false,
        transparent: true,
        alwaysOnTop: config.windowDefaults.alwaysOnTop,
        resizable: config.windowDefaults.resizable,
        icon: absoluteTaskbarIcon, // 👈 Sets the Taskbar and Window tray frame icon
        title: config.appName,     // Sets fallback application descriptor title
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    // Event hooks binding directly to each note window instance
    win.on('move', () => {
        const bounds = win.getBounds();
        win.webContents.send('window-moved', bounds);
    });

    win.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            win.hide();
        }
    });

    return win;
}

app.whenReady().then(() => {
    // Force your local operating system task scheduling profile to identify the app cleanly
    if (process.platform === 'win32') {
        app.setAppUserModelId(config.taskManagerServiceName);
    }

    createWidgetWindow();

    // Load System Tray Path mapping variables automatically
    const absoluteTrayIcon = path.resolve(config.icons.trayIcon);
    tray = new Tray(absoluteTrayIcon);

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
            label: `Quit ${config.appName}`,
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip(config.appName);
    tray.setContextMenu(contextMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && app.isQuitting) {
        app.quit();
    }
});

ipcMain.on('create-note', () => {
    createWidgetWindow();
});

// Expose configuration file properties to your React components via an IPC handler pipeline
ipcMain.handle('get-app-config', () => {
    return {
        appName: config.appName,
        taskManagerServiceName: config.taskManagerServiceName
    };
});