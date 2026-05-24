import { persistDatabaseToDisk } from './dbController';

export function useAdminActions(db, ipcRenderer, triggerRefresh) {
    const executeRawInsert = (tableName, columns, values) => {
        if (!db) return;
        const placeholders = columns.map(() => '?').join(', ');
        db.run(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`, values);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const executeRawUpdate = (tableName, idColumn, idValue, updateColumns, updateValues) => {
        if (!db) return;
        const setString = updateColumns.map(col => `${col} = ?`).join(', ');
        db.run(`UPDATE ${tableName} SET ${setString} WHERE ${idColumn} = ?`, [...updateValues, idValue]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const executeRawDelete = (tableName, idColumn, idValue) => {
        if (!db) return;
        db.run(`DELETE FROM ${tableName} WHERE ${idColumn} = ?`, [idValue]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const deleteTaskGlobal = (id) => {
        if (!db) return;
        db.run("DELETE FROM tasks WHERE id = ?", [id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const renameTaskGlobal = (id, newText) => {
        if (!db || !newText.trim()) return;
        db.run("UPDATE tasks SET task_text = ? WHERE id = ?", [newText.trim(), id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    return { executeRawInsert, executeRawUpdate, executeRawDelete, deleteTaskGlobal, renameTaskGlobal };
}
