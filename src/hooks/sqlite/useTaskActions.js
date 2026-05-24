import { useState } from 'react';
import { persistDatabaseToDisk } from './dbController';

export function useTaskActions(db, ipcRenderer, triggerRefresh) {
    const [tasks, setTasks] = useState([]);

    const addTask = (text) => {
        if (!db || !text.trim()) return;
        db.run("INSERT INTO tasks VALUES (?, ?, 0)", ["task_" + Date.now(), text]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const toggleTask = (id, currentStatus) => {
        if (!db) return;
        db.run("UPDATE tasks SET is_completed = ? WHERE id = ?", [currentStatus ? 0 : 1, id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const clearCompleted = () => {
        if (!db) return;
        db.run("DELETE FROM tasks WHERE is_completed = 1");
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    return { tasks, setTasks, addTask, toggleTask, clearCompleted };
}
