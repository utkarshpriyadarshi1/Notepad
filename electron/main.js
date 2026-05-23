const {app, BrowserWindow, Tray, Menu, ipcMain} = require('electron'); // 1. Added ipcMain
const path = require('path');

let tray = null;

function createWidgetWindow() {
    const win = new BrowserWindow({
        width: 350,
        height: 400,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    win.loadURL(startUrl);

    // 3. Move 'move' tracking right here so it binds to EVERY single sticky note window instance
    win.on('move', () => {
        const bounds = win.getBounds();
        win.webContents.send('window-moved', bounds);
    });

    // 4. Move the Tray close interceptor loop here so clicking X hides individual instances
    win.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            win.hide(); // Hides window instead of destroying it
        }
    });

    return win; // 2. Critical: Return the instance so hooks don't throw null reference errors
}

app.whenReady().then(() => {
    // Spawn your single initial sticky note widget
    createWidgetWindow();

    // Setup Tray Icon (Ensure a real/placeholder 'tray-icon.png' is inside your /electron folder)
    const iconPath = path.join(__dirname, 'tray-icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'New Sticky Note',
            click: () => {
                const newWin = createWidgetWindow();
                newWin.show();
            }
        },
        {type: 'separator'},
        {
            label: 'Quit Application',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('My Sticky Notes');
    tray.setContextMenu(contextMenu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
    });
});

// If all windows are hidden/closed, keep app active in system tray unless explicitly quit
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && app.isQuitting) {
        app.quit();
    }
});

// IPC Listener to safely spawn child notes on click events inside React
ipcMain.on('create-note', () => {
    createWidgetWindow();
});