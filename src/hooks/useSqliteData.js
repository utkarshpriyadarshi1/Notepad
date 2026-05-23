import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';

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
    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        async function setupDatabase() {
            try {
                const SQL = await initSqlJs({
                    locateFile: file => `https://js.org{file}`
                });

                let activeDb;
                const savedDbB64 = localStorage.getItem('sqlite_backup');

                if (savedDbB64) {
                    const u8Array = Uint8Array.from(atob(savedDbB64), c => c.charCodeAt(0));
                    activeDb = new SQL.Database(u8Array);
                } else {
                    activeDb = new SQL.Database();
                    activeDb.run(`
                        CREATE TABLE IF NOT EXISTS sticky_meta (key TEXT PRIMARY KEY, value TEXT);
                        CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, task_text TEXT, is_completed INTEGER);
                    `);
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('title', 'My Sticky Note')");
                    activeDb.run("INSERT OR IGNORE INTO sticky_meta VALUES ('color', 'yellow')");
                    saveToLocalStorage(activeDb);
                }

                setDb(activeDb);
                setDbReady(true);
                refreshUiData(activeDb);
            } catch (err) {
                console.error("Failed initializing SQLite Wasm instance:", err);
            }
        }
        setupDatabase();
    }, []);

    const saveToLocalStorage = (targetDb) => {
        if (!targetDb) return;
        const binaryData = targetDb.export();
        const base64Str = btoa(String.fromCharCode.apply(null, binaryData));
        localStorage.setItem('sqlite_backup', base64Str);
    };

    const refreshUiData = (targetDb) => {
        if (!targetDb) return;

        const metaRes = targetDb.exec("SELECT key, value FROM sticky_meta");
        if (metaRes.length > 0) {
            const metaRows = metaRes[0].values;
            const titleObj = metaRows.find(r => r[0] === 'title');
            const colorObj = metaRows.find(r => r[0] === 'color');
            if (titleObj) setNoteTitle(titleObj[1]);
            if (colorObj && colorThemes[colorObj[1]]) setNoteColor(colorThemes[colorObj[1]]);
        }

        const taskRes = targetDb.exec("SELECT id, task_text, is_completed FROM tasks");
        if (taskRes.length > 0) {
            const mappedTasks = taskRes[0].values.map(row => ({
                id: row[0],
                text: row[1],
                done: row[2] === 1
            }));
            setTasks(mappedTasks);
        } else {
            setTasks([]);
        }
    };

    const addTask = (text) => {
        if (!db || !text.trim()) return;
        const newId = "task_" + Date.now();
        db.run("INSERT INTO tasks VALUES (?, ?, 0)", [newId, text]);
        saveToLocalStorage(db);
        refreshUiData(db);
    };

    const toggleTask = (id, currentStatus) => {
        if (!db) return;
        const nextStatus = currentStatus ? 0 : 1;
        db.run("UPDATE tasks SET is_completed = ? WHERE id = ?", [nextStatus, id]);
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

    return { db, dbReady, tasks, noteTitle, noteColor, addTask, toggleTask, clearCompleted, changeTheme, saveToLocalStorage, refreshUiData };
}
