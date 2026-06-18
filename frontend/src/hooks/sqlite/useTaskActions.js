import { useState } from 'react';
import { persistDatabaseToDisk } from './dbController';

export function useTaskActions(db, ipcRenderer, triggerRefresh, windowId) {
    const [tasks, setTasks] = useState([]);

    const addTask = (text) => {
        if (!db || !text.trim()) return;
        db.run("INSERT INTO task_items (item_uuid, parent_note_uuid, item_text_payload, is_marked_completed) VALUES (?, ?, ?, 0)", ["task_" + Date.now(), windowId, text]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const toggleTask = (id, currentStatus) => {
        if (!db) return;
        db.run("UPDATE task_items SET is_marked_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE item_uuid = ?", [currentStatus ? 0 : 1, id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const clearCompleted = () => {
        if (!db) return;
        db.run("DELETE FROM task_items WHERE is_marked_completed = 1 AND parent_note_uuid = ?", [windowId]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };


    return { tasks, setTasks, addTask, toggleTask, clearCompleted };
}
