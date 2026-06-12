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
        db.run("DELETE FROM task_items WHERE item_uuid = ?", [id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const renameTaskGlobal = (id, newText) => {
        if (!db || !newText.trim()) return;
        db.run("UPDATE task_items SET item_text_payload = ?, updated_at = CURRENT_TIMESTAMP WHERE item_uuid = ?", [newText.trim(), id]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const renameWidget = (uuid, newTitle) => {
        if (!db || !newTitle.trim()) return;
        db.run("UPDATE sticky_widgets SET widget_title = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [newTitle.trim(), uuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const changeWidgetTheme = (uuid, themeName) => {
        if (!db) return;
        db.run("UPDATE sticky_widgets SET widget_theme_preset = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [themeName, uuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const deleteWidget = (uuid) => {
        if (!db) return;
        db.run("DELETE FROM sticky_widgets WHERE widget_uuid = ?", [uuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        if (ipcRenderer) {
            ipcRenderer.send('delete-widget-window', uuid);
        }
        triggerRefresh();
    };

    const focusWidget = (uuid) => {
        if (ipcRenderer) {
            ipcRenderer.send('focus-widget-window', uuid);
        }
    };

    return {
        executeRawInsert,
        executeRawUpdate,
        executeRawDelete,
        deleteTaskGlobal,
        renameTaskGlobal,
        renameWidget,
        changeWidgetTheme,
        deleteWidget,
        focusWidget
    };
}
