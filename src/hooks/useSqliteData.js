// src/hooks/useSqliteData.js
import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const colorThemes = {
    yellow: "bg-amber-200 border-amber-300 text-amber-900 header-amber-300",
    pink: "bg-rose-200 border-rose-300 text-rose-900 header-rose-300",
    blue: "bg-sky-200 border-sky-300 text-sky-900 header-sky-300",
    green: "bg-emerald-200 border-emerald-300 text-emerald-900 header-emerald-300"
};

export function useSqliteData() {
    const [db, setDb] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [noteTitle, setNoteTitle] = useState("My Sticky Note");
    const [noteColor, setNoteColor] = useState(colorThemes.yellow);
    const [viewMode, setViewMode] = useState("tasks");
    const [markdownText, setMarkdownText] = useState("# Document Note\nWrite ideas here...");
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    const [serviceStatus, setServiceStatus] = useState("CHECKING...");
    const [dbReady, setDbReady] = useState(false);

    const refreshUiData = (targetDb) => {
        if (!targetDb) return;
        try {
            const metaRes = targetDb.exec("SELECT key, value FROM sticky_meta");
            if (metaRes && metaRes.length > 0 && metaRes[0].values) {
                const metaRows = metaRes[0].values;
                const titleRow = metaRows.find(r => r[0] === 'title');
                const colorRow = metaRows.find(r => r[0] === 'color');
                const viewRow = metaRows.find(r => r[0] === 'view_mode');
                const mdRow = metaRows.find(r => r[0] === 'markdown_content');

                if (titleRow) setNoteTitle(titleRow[1]);
                if (colorRow && colorThemes[colorRow[1]]) setNoteColor(colorThemes[colorRow[1]]);
                if (viewRow) setViewMode(viewRow[1]);
                if (mdRow) setMarkdownText(mdRow[1]);
            }

            const taskRes = targetDb.exec("SELECT id, task_text, is_completed FROM tasks");
            if (taskRes && taskRes.length > 0 && taskRes[0].values) {
                const mappedTasks = taskRes[0].values.map(row => ({
                    id: row[0],
                    text: row[1],
                    done: row[2] === 1
                }));
                setTasks(mappedTasks);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error("Failed structural processing updates:", err);
        }
    };

    // NEW: Persist to real disk file instead of localStorage
    const saveToLocalStorage = async (targetDb) => {
        if (!targetDb || !ipcRenderer) return;
        try {
            const rawUint8Array = targetDb.export(); // Get pure raw binary file buffer from SQLite
            await ipcRenderer.invoke('save-db-file', rawUint8Array); // Write directly to local disk
        } catch (err) {
            console.error("Failed to commit database buffer directly to disk:", err);
        }
    };

    useEffect(() => {
        async function setupDatabase() {
            try {
                let defaultName = "My Sticky Note";
                if (ipcRenderer) {
                    const runtimeConfig = await ipcRenderer.invoke('get-app-config');
                    if (runtimeConfig?.appName) defaultName = runtimeConfig.appName;
                    const status = await ipcRenderer.invoke('get-service-status');
                    setServiceStatus(status);
                }

                const SQL = await initSqlJs({ locateFile: () => `./sql-wasm.wasm` });
                let activeDb;

                // NEW: Request raw binary buffer straight from desktop file system
                const diskFileBuffer = ipcRenderer ? await ipcRenderer.invoke('load-db-file') : null;

                if (diskFileBuffer) {
                    activeDb = new SQL.Database(diskFileBuffer); // Load the physical file directly
                } else {
                    activeDb = new SQL.Database();
                    activeDb.run(`
                        CREATE TABLE IF NOT EXISTS sticky_meta (key TEXT PRIMARY KEY, value TEXT);
                        CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, task_text TEXT, is_completed INTEGER);
                    `);
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('title', ?)", [defaultName]);
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('color', 'yellow')");
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('view_mode', 'tasks')");
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('markdown_content', '# Document Note\\nWrite ideas here...')");

                    const rawUint8Array = activeDb.export();
                    if (ipcRenderer) await ipcRenderer.invoke('save-db-file', rawUint8Array);
                }

                setDb(activeDb);
                refreshUiData(activeDb);
                setDbReady(true);
            } catch (err) {
                console.error("DATABASE INITIALIZATION CRASHED:", err);
            }
        }
        setupDatabase();
    }, []);

    // NEW: Real physical disk deletion operation handler
    const resetDatabase = async () => {
        if (ipcRenderer) {
            await ipcRenderer.invoke('purge-db-file');
            window.location.reload();
        }
    };

    const addTask = (text) => {
        if (!db || !text.trim()) return;
        db.run("INSERT INTO tasks VALUES (?, ?, 0)", ["task_" + Date.now(), text]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const toggleTask = (id, currentStatus) => {
        if (!db) return;
        db.run("UPDATE tasks SET is_completed = ? WHERE id = ?", [currentStatus ? 0 : 1, id]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const clearCompleted = () => {
        if (!db) return;
        db.run("DELETE FROM tasks WHERE is_completed = 1");
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const changeTheme = (colorName) => {
        if (!db) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'color'", [colorName]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const updateNoteTitle = (newTitle) => {
        if (!db || !newTitle.trim()) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'title'", [newTitle]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const toggleViewMode = () => {
        if (!db) return;
        const nextMode = viewMode === "tasks" ? "markdown" : "tasks";
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'view_mode'", [nextMode]);
        saveToLocalStorage(db);
        setViewMode(nextMode);
    };

    const updateMarkdown = (text) => {
        if (!db) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'markdown_content'", [text]);
        saveToLocalStorage(db);
        setMarkdownText(text);
    };

    const toggleAlwaysOnTop = () => {
        const nextState = !alwaysOnTop;
        setAlwaysOnTop(nextState);
        if (ipcRenderer) ipcRenderer.send('set-always-on-top', nextState);
    };

    const handleServiceAction = async (action) => {
        if (!ipcRenderer) return;
        setServiceStatus("PROCESSING...");
        const nextStatus = await ipcRenderer.invoke('control-task-service', action);
        setServiceStatus(nextStatus);
    };

    const deleteTaskGlobal = (id) => {
        if (!db) return;
        db.run("DELETE FROM tasks WHERE id = ?", [id]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const renameTaskGlobal = (id, newText) => {
        if (!db || !newText.trim()) return;
        db.run("UPDATE tasks SET task_text = ? WHERE id = ?", [newText.trim(), id]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const exportSingleTask = (task) => {
        const dataBundle = { type: "Single Task Export", exportedAt: new Date().toISOString(), task: { id: task.id, text: task.text, completed: task.done } };
        const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataBundle, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataUri);
        anchor.setAttribute("download", `task_export_${task.id}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    return {
        db, dbReady, tasks, noteTitle, noteColor, viewMode, markdownText, alwaysOnTop, serviceStatus,
        addTask, toggleTask, clearCompleted, changeTheme, updateNoteTitle, toggleViewMode, updateMarkdown,
        toggleAlwaysOnTop, resetDatabase, handleServiceAction, deleteTaskGlobal, renameTaskGlobal, exportSingleTask,
        saveToLocalStorage, refreshUiData
    };
}
