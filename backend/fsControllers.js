/* eslint-env node */
const fs = require('fs');
const path = require('path');
const config = require('../app.config.json');

const { BrowserWindow } = require('electron');

function setupFilesystemHandlers(ipcMain, app) {
    const getDbPath = (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const wsPath = win ? win.workspacePath : path.join(app.getPath('documents'), 'NotepadWorkspace');
        return path.join(wsPath, config.dbFileName);
    };

    // LOAD: Fetches true local database files stream as binary arrays
    ipcMain.handle('load-db-file', async (event) => {
        try {
            const dbFilePath = getDbPath(event);
            if (fs.existsSync(dbFilePath)) {
                const fileBuffer = await fs.promises.readFile(dbFilePath);
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
            const dbFilePath = getDbPath(event);
            const buffer = Buffer.from(uint8ArrayData);
            await fs.promises.writeFile(dbFilePath, buffer);
            return true;
        } catch (err) {
            console.error("Failed writing binary buffer array back to data file:", err);
            return false;
        }
    });

    // PURGE: Drops physical file allocation references safely
    ipcMain.handle('purge-db-file', async (event) => {
        try {
            const dbFilePath = getDbPath(event);
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

    // CONFIG: Expose branding file variables to UI hooks safely
    ipcMain.handle('get-app-config', async () => {
        return {
            appName: config.appName,
            taskManagerServiceName: config.taskManagerServiceName
        };
    });

    const activeWatchers = new Map();

    ipcMain.handle('write-local-file', async (event, filePath, content) => {
        try {
            await fs.promises.writeFile(filePath, content, 'utf8');
            return true;
        } catch (err) {
            console.error(`Failed to write local file: ${filePath}`, err);
            return false;
        }
    });

    ipcMain.handle('watch-local-file', (event, filePath, noteUuid) => {
        const webContents = event.sender;
        const win = BrowserWindow.fromWebContents(webContents);
        if (!win) return;

        const watcherKey = `${win.id}-${noteUuid}`;

        if (activeWatchers.has(watcherKey)) {
            activeWatchers.get(watcherKey).close();
            activeWatchers.delete(watcherKey);
        }

        if (!fs.existsSync(filePath)) return;

        try {
            const watcher = fs.watch(filePath, async (eventType) => {
                if (eventType === 'change') {
                    try {
                        if (fs.existsSync(filePath)) {
                            const newContent = await fs.promises.readFile(filePath, 'utf8');
                            if (!win.isDestroyed()) {
                                win.webContents.send('local-file-changed', {
                                    noteUuid,
                                    filePath,
                                    content: newContent
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Error reading watched file:", e);
                    }
                }
            });
            activeWatchers.set(watcherKey, watcher);

            win.on('closed', () => {
                if (activeWatchers.has(watcherKey)) {
                    activeWatchers.get(watcherKey).close();
                    activeWatchers.delete(watcherKey);
                }
            });
        } catch (err) {
            console.error(`Failed to watch file ${filePath}:`, err);
        }
    });

    ipcMain.handle('unwatch-local-file', (event, noteUuid) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return;
        const watcherKey = `${win.id}-${noteUuid}`;
        if (activeWatchers.has(watcherKey)) {
            activeWatchers.get(watcherKey).close();
            activeWatchers.delete(watcherKey);
        }
    });
}

module.exports = { setupFilesystemHandlers };
