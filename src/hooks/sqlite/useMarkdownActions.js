import { useState } from 'react';
import { persistDatabaseToDisk } from './dbController';

export function useMarkdownActions(db, ipcRenderer, triggerRefresh) {
    const [viewMode, setViewMode] = useState("tasks");
    const [markdownText, setMarkdownText] = useState("# Document Note\nWrite ideas here...");

    const toggleViewMode = () => {
        if (!db) return;
        const nextMode = viewMode === "tasks" ? "markdown" : "tasks";
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'view_mode'", [nextMode]);
        persistDatabaseToDisk(ipcRenderer, db);
        setViewMode(nextMode);
    };

    const updateMarkdown = (text) => {
        if (!db) return;
        db.run("UPDATE sticky_meta SET value = ? WHERE key = 'markdown_content'", [text]);
        persistDatabaseToDisk(ipcRenderer, db);
        setMarkdownText(text);
    };

    return { viewMode, setViewMode, markdownText, setMarkdownText, toggleViewMode, updateMarkdown };
}
