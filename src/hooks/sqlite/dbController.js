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
        console.error("Critical database boot thread crash:", err);
        throw err;
    }
}

export async function persistDatabaseToDisk(ipcRenderer, targetDb) {
    if (!targetDb || !ipcRenderer) return;
    try {
        const rawUint8Array = targetDb.export();
        await ipcRenderer.invoke('save-db-file', rawUint8Array);
    } catch (err) {
        console.error("Failed writing binary buffer array back to data file:", err);
    }
}
