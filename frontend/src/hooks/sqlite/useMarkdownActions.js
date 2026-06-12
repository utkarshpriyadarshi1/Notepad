import { useState, useRef, useEffect } from 'react';
import { persistDatabaseToDisk } from './dbController';

export function useMarkdownActions(db, ipcRenderer, triggerRefresh, windowId) {
    const [viewMode, setViewMode] = useState("tasks");
    const [markdownText, setMarkdownText] = useState("# Document Note\nWrite ideas here...");
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const toggleViewMode = () => {
        if (!db) return;
        const nextMode = viewMode === "tasks" ? "markdown" : "tasks";
        db.run("UPDATE sticky_widgets SET widget_view_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [nextMode, windowId]);
        persistDatabaseToDisk(ipcRenderer, db);
        setViewMode(nextMode);
    };

    const updateMarkdown = (text, immediate = false) => {
        setMarkdownText(text);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        const saveFn = () => {
            if (!db) return;
            try {
                db.run("UPDATE sticky_widgets SET widget_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [text, windowId]);
                persistDatabaseToDisk(ipcRenderer, db);
            } catch (err) {
                console.error("Failed to save markdown:", err);
            }
        };

        if (immediate) {
            saveFn();
        } else {
            saveTimeoutRef.current = setTimeout(saveFn, 800);
        }
    };

    return { viewMode, setViewMode, markdownText, setMarkdownText, toggleViewMode, updateMarkdown };
}
