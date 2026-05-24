import { useState } from 'react';
import { persistDatabaseToDisk } from './dbController';
import {defaultTitle} from "../../../app.config";

export function useThemeActions(db, ipcRenderer, triggerRefresh, colorThemes) {
    const [noteTitle, setNoteTitle] = useState(defaultTitle);
    const [noteColor, setNoteColor] = useState(colorThemes.yellow);

    const changeTheme = (colorName) => {
        if (!db) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'color'", [colorName]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    const updateNoteTitle = (newTitle) => {
        if (!db || !newTitle.trim()) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'title'", [newTitle]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    };

    return { noteTitle, setNoteTitle, noteColor, setNoteColor, changeTheme, updateNoteTitle };
}
