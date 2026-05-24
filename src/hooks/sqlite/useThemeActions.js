import { useState } from 'react';
import { persistDatabaseToDisk } from './dbController';
import config from "../../../app.config.json";

export function useThemeActions(db, ipcRenderer, triggerRefresh, colorThemes, windowId) {
    const [noteTitle, setNoteTitle] = useState(config.defaultTitle);
    const [noteColor, setNoteColor] = useState(colorThemes.yellow);

    const changeTheme = (colorName) => {
        if (!db) return;
        db.run("UPDATE sticky_widgets SET widget_theme_preset = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [colorName, windowId]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const updateNoteTitle = (newTitle) => {
        if (!db || !newTitle.trim()) return;
        db.run("UPDATE sticky_widgets SET widget_title = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [newTitle.trim(), windowId]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };


    return { noteTitle, setNoteTitle, noteColor, setNoteColor, changeTheme, updateNoteTitle };
}
