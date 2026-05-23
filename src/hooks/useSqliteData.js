import {useEffect, useState} from 'react';
import initSqlJs from 'sql.js';

// Safe Electron environment extraction check
const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

// Tailwind styling presets mapped cleanly to database keys
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
    const [dbReady, setDbReady] = useState(false);

    // ============================================================================
    // 1. DATA SYNCHRONIZATION UTILITIES
    // ============================================================================
    const refreshUiData = (targetDb) => {
        if (!targetDb) return;
        try {
            // Fetch Meta Settings (Title, Color, View Mode, Markdown Content)
            const metaRes = targetDb.exec("SELECT key, value FROM sticky_meta");
            if (metaRes && metaRes.length > 0 && metaRes[0].values) {
                const metaRows = metaRes[0].values; // Drill safely into row matrix array

                const titleRow = metaRows.find(r => r[0] === 'title');
                const colorRow = metaRows.find(r => r[0] === 'color');
                const viewRow = metaRows.find(r => r[0] === 'view_mode');
                const mdRow = metaRows.find(r => r[0] === 'markdown_content');

                if (titleRow) setNoteTitle(titleRow[1]);
                if (colorRow && colorThemes[colorRow[1]]) setNoteColor(colorThemes[colorRow[1]]);
                if (viewRow) setViewMode(viewRow[1]);
                if (mdRow) setMarkdownText(mdRow[1]);
            }

            // Fetch Checklist Tasks
            const taskRes = targetDb.exec("SELECT id, task_text, is_completed FROM tasks");
            if (taskRes && taskRes.length > 0 && taskRes[0].values) {
                const mappedTasks = taskRes[0].values.map(row => ({
                    id: row[0], text: row[1], done: row[2] === 1
                }));
                setTasks(mappedTasks);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error("Failed structural database mapping layout arrays:", err);
        }
    };

    const saveToLocalStorage = (targetDb) => {
        if (!targetDb) return;
        try {
            const binaryData = targetDb.export();
            const base64Str = btoa(String.fromCharCode.apply(null, binaryData));
            localStorage.setItem('sqlite_backup', base64Str);
        } catch (err) {
            console.error("Failed serialization storage locker sync:", err);
        }
    };

    // ============================================================================
    // 2. ASYNCHRONOUS INITIALIZATION LAYER
    // ============================================================================
    useEffect(() => {
        async function setupDatabase() {
            try {
                // Fetch dynamic app branding configuration from main process
                let defaultName = "My Sticky Note";
                if (ipcRenderer) {
                    const runtimeConfig = await ipcRenderer.invoke('get-app-config');
                    if (runtimeConfig?.appName) defaultName = runtimeConfig.appName;
                }

                // Initialize local WebAssembly library module
                const SQL = await initSqlJs({
                    locateFile: file => `./sql-wasm.wasm`
                });

                let activeDb;
                const savedDbB64 = localStorage.getItem('sqlite_backup');

                if (savedDbB64) {
                    const u8Array = Uint8Array.from(atob(savedDbB64), c => c.charCodeAt(0));
                    activeDb = new SQL.Database(u8Array);
                } else {
                    activeDb = new SQL.Database();
                    activeDb.run(`
                        CREATE TABLE IF NOT EXISTS sticky_meta
                        (
                            key
                            TEXT
                            PRIMARY
                            KEY,
                            value
                            TEXT
                        );
                        CREATE TABLE IF NOT EXISTS tasks
                        (
                            id
                            TEXT
                            PRIMARY
                            KEY,
                            task_text
                            TEXT,
                            is_completed
                            INTEGER
                        );
                    `);
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('title', ?)", [defaultName]);
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('color', 'yellow')");
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('view_mode', 'tasks')");
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('markdown_content', '# Document Note\\nWrite ideas here...')");
                    saveToLocalStorage(activeDb);
                }

                setDb(activeDb);
                refreshUiData(activeDb); // 👈 FIXED: Passes 'activeDb' safely inside local async scope
                setDbReady(true);
            } catch (err) {
                console.error("DATABASE INITIALIZATION CRASHED:", err);
            }
        }

        setupDatabase();
    }, []);

    // ============================================================================
    // 3. ACTION HANDLERS (CRUD & PREFERENCES)
    // ============================================================================
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
        if (ipcRenderer) {
            ipcRenderer.send('set-always-on-top', nextState);
        }
    };

    const resetDatabase = () => {
        localStorage.removeItem('sqlite_backup');
        window.location.reload();
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
        const dataBundle = {
            type: "Single Task Export", exportedAt: new Date().toISOString(), task: {
                id: task.id, text: task.text, completed: task.done
            }
        };
        const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataBundle, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataUri);
        anchor.setAttribute("download", `task_export_${task.id}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };


    return {
        db,
        dbReady,
        tasks,
        noteTitle,
        noteColor,
        viewMode,
        markdownText,
        alwaysOnTop,
        addTask,
        toggleTask,
        clearCompleted,
        changeTheme,
        updateNoteTitle,
        toggleViewMode,
        updateMarkdown,
        toggleAlwaysOnTop,
        resetDatabase,
        saveToLocalStorage,
        refreshUiData,
        deleteTaskGlobal,
        renameTaskGlobal,
        exportSingleTask
    };
}
