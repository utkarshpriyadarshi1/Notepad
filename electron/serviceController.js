/* eslint-env node */
let backgroundWorkerProcess = false;

function toggleBackgroundWorker(action) {
    console.log(`Executing background core process action: ${action}`);

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

function setupServiceHandlers(ipcMain) {
    ipcMain.handle('get-service-status', async () => {
        return backgroundWorkerProcess ? "RUNNING" : "STOPPED";
    });

    ipcMain.handle('control-task-service', async (event, action) => {
        return toggleBackgroundWorker(action);
    });
}

module.exports = { setupServiceHandlers, getWorkerStatus: () => backgroundWorkerProcess };
