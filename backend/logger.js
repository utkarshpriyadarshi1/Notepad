/* eslint-env node */
const fs = require('fs');
const path = require('path');
const config = require('../app.config.json');

function writeLog(app, level, moduleName, message, stackTrace = '') {
    try {
        const userDataPath = app.getPath('userData');
        const logFilePath = path.join(userDataPath, 'smritipatra_runtime.log');

        const timestamp = new Date().toISOString();
        const cleanMessage = typeof message === 'object' ? JSON.stringify(message) : message;

        let logLine = `[${timestamp}] [${level}] [${moduleName}] ${cleanMessage}\n`;
        if (stackTrace) {
            logLine += `--- STACK TRACE ---\n${stackTrace}\n-------------------\n`;
        }

        // Standard Output tracking for fast local Dev terminal analysis
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${level}] [${moduleName}] ${cleanMessage}`);
        }

        // Asynchronous, thread-safe append writes to block file-lock bottlenecks
        fs.appendFile(logFilePath, logLine, 'utf8', (err) => {
            if (err) console.error('Logging engine failed to flash data stream to disk:', err);
        });
    } catch (err) {
        console.error('Core logger runtime crash:', err);
    }
}

function setupLoggerIPC(ipcMain, app) {
    // Listen for frontend logs coming from React UI modules
    ipcMain.on('log-ui-event', (event, { level, moduleName, message, stack }) => {
        writeLog(app, level, moduleName, message, stack);
    });

    ipcMain.handle('get-log-file-path', async () => {
        return path.join(app.getPath('userData'), 'smritipatra_runtime.log');
    });
}

module.exports = { writeLog, setupLoggerIPC };
