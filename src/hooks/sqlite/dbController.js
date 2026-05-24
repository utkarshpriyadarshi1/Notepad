import initSqlJs from 'sql.js';

export async function initializeLocalDatabase(ipcRenderer, defaultName) {
    try {
        const SQL = await initSqlJs({ locateFile: () => `./sql-wasm.wasm` });
        let activeDb;
        const diskFileBuffer = ipcRenderer ? await ipcRenderer.invoke('load-db-file') : null;

        if (diskFileBuffer) {
            activeDb = new SQL.Database(diskFileBuffer);
        } else {
            activeDb = new SQL.Database();
            activeDb.run(`
                CREATE TABLE IF NOT EXISTS sticky_meta (key TEXT PRIMARY KEY, value TEXT);
                CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, task_text TEXT, is_completed INTEGER);
            `);
            activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('title', ?)", [defaultName]);
            activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('color', 'glass')");
            activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('view_mode', 'tasks')");
            activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('markdown_content', '# Document Note\\nWrite ideas here...')");

            await persistDatabaseToDisk(ipcRenderer, activeDb);
        }
        return activeDb;
    } catch (err) {
        logUiError('FATAL', `SQLite Wasm Initialization Failed: ${err.message}`, err); // 👈 FORWARDS CRASH TO DISK LOG
        console.error("Critical database boot thread crash:", err);
        throw err;
    }
}

let saveTimeout = null;

export async function persistDatabaseToDisk(ipcRenderer, targetDb) {
    if (!targetDb || !ipcRenderer) return;

    // Clear previous pending writes to debounce the disk I/O overhead
    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
        try {
            const rawUint8Array = targetDb.export(); // Binary dump snapshot
            await ipcRenderer.invoke('save-db-file', rawUint8Array);
            console.log("⚡ [Optimization] Batched database flush to physical disk completed.");
        } catch (err) {
            console.error("Failed writing binary buffer array back to data file:", err);
        }
    }, 500); // Wait for 500ms of user silence before writing to hard disk
}