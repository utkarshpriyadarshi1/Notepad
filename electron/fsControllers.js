/* eslint-env node */
const fs = require('fs');
const path = require('path');
const config = require('../app.config');

function setupFilesystemHandlers(ipcMain, app) {
    const userDataPath = app.getPath('userData');
    const dbFilePath = path.join(userDataPath, config.dbFileName);

    // LOAD: Fetches true local database files stream as binary arrays
    ipcMain.handle('load-db-file', async () => {
        try {
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
            const buffer = Buffer.from(uint8ArrayData);
            await fs.promises.writeFile(dbFilePath, buffer);
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

    // CONFIG: Expose branding file variables to UI hooks safely
    ipcMain.handle('get-app-config', async () => {
        return {
            appName: config.appName,
            taskManagerServiceName: config.taskManagerServiceName
        };
    });
}

module.exports = { setupFilesystemHandlers };
