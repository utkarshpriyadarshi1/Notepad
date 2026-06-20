import {useCallback, useEffect, useState} from 'react';
import {initializeLocalDatabase, persistDatabaseToDisk} from './sqlite/dbController';
import {useTaskActions} from './sqlite/useTaskActions';
import {useThemeActions} from './sqlite/useThemeActions';
import {useMarkdownActions} from './sqlite/useMarkdownActions';
import {useAdminActions} from './sqlite/useAdminActions';
import config from "../../../app.config.json";

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;


export function useSqliteData() {
    const [db, setDb] = useState(null);
    const [dbReady, setDbReady] = useState(false);
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    const [serviceStatus, setServiceStatus] = useState("CHECKING...");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [windowId, setWindowId] = useState('note_1');
    const [allNotes, setAllNotes] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [savedOpenUuids, setSavedOpenUuids] = useState([]);
    const [savedSelectedUuid, setSavedSelectedUuid] = useState(null);

    const triggerRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

    // Instantiate Sub-Hook Operations Modules
    const taskModule = useTaskActions(db, ipcRenderer, triggerRefresh, windowId);
    const themeModule = useThemeActions(db, ipcRenderer, triggerRefresh, config.colorThemes, windowId);
    const markdownModule = useMarkdownActions(db, ipcRenderer, triggerRefresh, windowId);
    const adminModule = useAdminActions(db, ipcRenderer, triggerRefresh);

    const { setTasks } = taskModule;
    const { setNoteTitle, setNoteColor } = themeModule;
    const { setViewMode, setMarkdownText } = markdownModule;

    const logUiError = (level, message, errorObject = null) => {
        if (ipcRenderer) {
            ipcRenderer.send('log-ui-event', {
                level: level,
                moduleName: 'React_Frontend_UI',
                message: message,
                stack: errorObject ? errorObject.stack : ''
            });
        } else {
            console.error(`[${level}] [React_Fallback] ${message}`, errorObject);
        }
    };
    
    const refreshUiData = useCallback((targetDb, currentNoteId) => {
        if (!targetDb || !currentNoteId) return;
        try {
            // Query master note profile metrics using clean refactored columns
            const noteQuery = "SELECT note_title, note_theme_preset, note_view_mode, note_markdown_content, is_pinned FROM sticky_notes WHERE note_uuid = ?";
            const noteRes = targetDb.exec(noteQuery, [currentNoteId]);

            if (noteRes && noteRes.length > 0 && noteRes[0].values) {
                const dataRow = noteRes[0].values[0];
                setNoteTitle(dataRow[0]);
                setNoteColor(config.colorThemes[dataRow[1]] || config.colorThemes.yellow);
                const dbMode = dataRow[2] === 'checklist' ? 'tasks' : dataRow[2];
                setViewMode(dbMode);
                setMarkdownText(dataRow[3]);

                // If it is a sticky note (not main notepad), apply the saved pin/alwaysOnTop state from DB
                if (currentNoteId !== 'main_notepad') {
                    const isPinned = dataRow[4] === 1;
                    setAlwaysOnTop(isPinned);
                    if (ipcRenderer) {
                        ipcRenderer.send('set-widget-always-on-top', currentNoteId, isPinned);
                    }
                } else {
                    setAlwaysOnTop(false);
                }
            }

            // Query related checklist items using clean foreign key targets
            const itemQuery = "SELECT item_uuid, item_text_payload, is_marked_completed FROM task_items WHERE parent_note_uuid = ?";
            const itemRes = targetDb.exec(itemQuery, [currentNoteId]);

            if (itemRes && itemRes.length > 0 && itemRes[0].values) {
                setTasks(itemRes[0].values.map(row => ({
                    id: row[0],
                    text: row[1],
                    done: row[2] === 1
                })));
            } else {
                setTasks([]);
            }

            // Query all folders
            const foldersQuery = "SELECT folder_uuid, folder_name FROM sticky_folders";
            const foldersRes = targetDb.exec(foldersQuery);
            if (foldersRes && foldersRes.length > 0 && foldersRes[0].values) {
                setAllFolders(foldersRes[0].values.map(row => ({
                    uuid: row[0],
                    name: row[1]
                })));
            } else {
                setAllFolders([]);
            }

            // Query all notes with parent_folder_uuid (metadata only to optimize memory and queries)
            const allNotesQuery = "SELECT note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, is_flagged, sort_order, created_at, is_pinned, local_file_path FROM sticky_notes";
            const allNotesRes = targetDb.exec(allNotesQuery);
            if (allNotesRes && allNotesRes.length > 0 && allNotesRes[0].values) {
                setAllNotes(allNotesRes[0].values.map(row => ({
                    uuid: row[0],
                    parentFolderUuid: row[1],
                    title: row[2],
                    theme: row[3],
                    viewMode: row[4],
                    isFlagged: row[5] === 1,
                    sortOrder: row[6] || 0,
                    createdAt: row[7] || "",
                    isPinned: row[8] === 1,
                    localFilePath: row[9] || ""
                })));
            } else {
                setAllNotes([]);
            }

            // Query saved layout state
            try {
                const layoutRes = targetDb.exec("SELECT open_note_uuids, selected_note_uuid FROM sys_layout_state WHERE layout_key = 'main_workspace'");
                if (layoutRes && layoutRes.length > 0 && layoutRes[0].values) {
                    const row = layoutRes[0].values[0];
                    const openStr = row[0] || "";
                    const loadedOpenUuids = openStr ? openStr.split(',') : [];
                    setSavedOpenUuids(loadedOpenUuids);
                    setSavedSelectedUuid(row[1] || null);
                } else {
                    setSavedOpenUuids([]);
                    setSavedSelectedUuid(null);
                }
            } catch (e) {
                setSavedOpenUuids([]);
                setSavedSelectedUuid(null);
            }
        } catch (err) {
            if (ipcRenderer) {
                ipcRenderer.send('log-ui-event', {
                    level: 'ERROR', moduleName: 'React_Sync_Engine', message: err.message, stack: err.stack
                });
            }
        }
    }, [setTasks, setNoteTitle, setNoteColor, setViewMode, setMarkdownText, setAllNotes, setAllFolders, setSavedOpenUuids, setSavedSelectedUuid]);

    const reloadDatabase = useCallback(async () => {
        if (!ipcRenderer) return;
        try {
            let defaultName = config.defaultTitle;
            const configData = await ipcRenderer.invoke('get-app-config');
            if (configData?.appName) defaultName = configData.appName;
            const activeDb = await initializeLocalDatabase(ipcRenderer, defaultName, windowId);
            setDb(activeDb);
            refreshUiData(activeDb, windowId);
        } catch (err) {
            console.error("Failed to reload database from disk:", err);
        }
    }, [ipcRenderer, windowId, refreshUiData]);

    useEffect(() => {
        if (!ipcRenderer) return;
        const handleDbUpdated = () => {
            reloadDatabase();
        };
        ipcRenderer.on('db-updated', handleDbUpdated);
        return () => {
            ipcRenderer.removeListener('db-updated', handleDbUpdated);
        };
    }, [ipcRenderer, reloadDatabase]);

    useEffect(() => {
        if (!ipcRenderer) return;
        const handleDbUpdated = () => {
            triggerRefresh();
        };
        ipcRenderer.on('db-updated', handleDbUpdated);
        return () => {
            ipcRenderer.removeListener('db-updated', handleDbUpdated);
        };
    }, [triggerRefresh]);

    useEffect(() => {
        async function boot() {
            let defaultName = config.defaultTitle;
            let currentWindowId = 'main_notepad';
            if (ipcRenderer) {
                const configData = await ipcRenderer.invoke('get-app-config');
                if (configData?.appName) defaultName = configData.appName;
                setServiceStatus(await ipcRenderer.invoke('get-service-status'));
                currentWindowId = await ipcRenderer.invoke('get-window-id') || 'main_notepad';
            }
            setWindowId(currentWindowId);
            const activeDb = await initializeLocalDatabase(ipcRenderer, defaultName, currentWindowId);
            setDb(activeDb);
            refreshUiData(activeDb, currentWindowId);

            // If this is the main dashboard window, open all saved pinned notes
            if (currentWindowId === 'main_notepad' && ipcRenderer) {
                try {
                    const pinnedRes = activeDb.exec("SELECT note_uuid FROM sticky_notes WHERE is_pinned = 1 AND note_uuid != 'main_notepad'");
                    if (pinnedRes && pinnedRes.length > 0 && pinnedRes[0].values) {
                        pinnedRes[0].values.forEach(row => {
                            const pinnedWidgetId = row[0];
                            ipcRenderer.send('focus-widget-window', pinnedWidgetId);
                        });
                    }
                } catch (err) {
                    console.error("Failed to open pinned notes on boot:", err);
                }
            }

            setDbReady(true);
        }

        boot();
    }, [refreshUiData]);

    useEffect(() => {
        if (dbReady && db) refreshUiData(db, windowId);
    }, [refreshTrigger, dbReady, db, windowId, refreshUiData]);

    const resetDatabase = async () => {
        if (ipcRenderer) {
            await ipcRenderer.invoke('purge-db-file');
            window.location.reload();
        }
    };

    const toggleAlwaysOnTop = () => {
        setAlwaysOnTop(prev => {
            const nextVal = !prev;
            if (ipcRenderer) {
                if (windowId === 'main_notepad') {
                    ipcRenderer.send('set-always-on-top', nextVal);
                } else {
                    ipcRenderer.send('set-widget-always-on-top', windowId, nextVal);
                }
            }
            if (db && windowId) {
                db.run("UPDATE sticky_notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [nextVal ? 1 : 0, windowId]);
                persistDatabaseToDisk(ipcRenderer, db);
            }
            return nextVal;
        });
    };

    const handleServiceAction = async (action) => {
        if (!ipcRenderer) return;
        setServiceStatus("PROCESSING...");
        setServiceStatus(await ipcRenderer.invoke('control-task-service', action));
    };

    const exportSingleTask = (task) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            type: "Single Task Export", task
        }));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `task_${task.id}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    const exportNoteBackup = (uuid, title) => {
        if (!db) return;
        try {
            const notesRes = db.exec("SELECT * FROM sticky_notes WHERE note_uuid = ?", [uuid]);
            const tasksRes = db.exec("SELECT * FROM task_items WHERE parent_note_uuid = ?", [uuid]);

            const bundle = {
                app: "Electron Sticky Note Widget",
                exportedAt: new Date().toISOString(),
                noteUuid: uuid,
                notes: notesRes && notesRes.length > 0 && notesRes[0].values ? notesRes[0].values : [],
                tasks: tasksRes && tasksRes.length > 0 && tasksRes[0].values ? tasksRes[0].values : []
            };

            const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
            const anchor = document.createElement('a');
            anchor.setAttribute("href", dataUri);
            anchor.setAttribute("download", `note_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        } catch (err) {
            console.error("Failed to export note backup:", err);
            alert("Failed to export note data.");
        }
    };

    const createFolder = useCallback((name) => {
        if (!db || !name.trim()) return null;
        const newUuid = "folder_" + Date.now();
        db.run("INSERT INTO sticky_folders (folder_uuid, folder_name) VALUES (?, ?)", [newUuid, name.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
        return newUuid;
    }, [db, triggerRefresh]);

    const renameFolder = useCallback((uuid, newName) => {
        if (!db || !newName.trim()) return;
        db.run("UPDATE sticky_folders SET folder_name = ?, updated_at = CURRENT_TIMESTAMP WHERE folder_uuid = ?", [newName.trim(), uuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const deleteFolder = useCallback((uuid) => {
        if (!db) return;
        db.run("DELETE FROM sticky_folders WHERE folder_uuid = ?", [uuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const getEditorModeFromTitle = (title) => {
        if (!title) return 'md';
        const parts = title.split('.');
        if (parts.length > 1) {
            const ext = parts[parts.length - 1].toLowerCase();
            const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml', 'b64'];
            if (supported.includes(ext)) {
                return ext === 'yaml' ? 'yml' : ext;
            }
        }
        return 'md';
    };

    const createNoteInFolder = useCallback((folderUuid, title, initialContent = '# Write ideas here...') => {
        if (!db || !title.trim()) return null;
        const newNoteId = "note_" + Date.now();
        const mode = getEditorModeFromTitle(title);
        db.run("INSERT INTO sticky_notes (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height) VALUES (?, ?, ?, 'yellow', ?, ?, 100, 100, 350, 420)", [newNoteId, folderUuid, title.trim(), mode, initialContent]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
        return newNoteId;
    }, [db, triggerRefresh]);

    const addEvent = useCallback((noteUuid, text) => {
        if (!db || !text.trim()) return;
        db.run("INSERT INTO events_log (event_uuid, parent_note_uuid, event_text) VALUES (?, ?, ?)", ["event_" + Date.now(), noteUuid, text.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const deleteEvent = useCallback((eventUuid) => {
        if (!db) return;
        db.run("DELETE FROM events_log WHERE event_uuid = ?", [eventUuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const addExpense = useCallback((noteUuid, amount, category, description) => {
        if (!db) return;
        db.run("INSERT INTO expense_log (expense_uuid, parent_note_uuid, expense_amount, expense_category, expense_description) VALUES (?, ?, ?, ?, ?)", ["expense_" + Date.now(), noteUuid, parseFloat(amount) || 0.0, category, description.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const deleteExpense = useCallback((expenseUuid) => {
        if (!db) return;
        db.run("DELETE FROM expense_log WHERE expense_uuid = ?", [expenseUuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    const addVcsCommit = useCallback((noteUuid, title, content, message) => {
        if (!db || !noteUuid) return;
        try {
            const commitId = "commit_" + Date.now();
            const msg = message ? message.trim() : "Snapshot backup";
            db.run(
                "INSERT INTO vcs_commits (commit_uuid, parent_note_uuid, commit_message, note_title_snapshot, note_content_snapshot) VALUES (?, ?, ?, ?, ?)",
                [commitId, noteUuid, msg, title || "", content || ""]
            );
            // Prune to max 30 commits per note
            db.run(
                "DELETE FROM vcs_commits WHERE parent_note_uuid = ? AND commit_uuid NOT IN (SELECT commit_uuid FROM vcs_commits WHERE parent_note_uuid = ? ORDER BY created_at DESC LIMIT 30)",
                [noteUuid, noteUuid]
            );
            persistDatabaseToDisk(ipcRenderer, db);
            triggerRefresh();
        } catch (err) {
            console.error("VCS commit creation failed:", err);
        }
    }, [db, triggerRefresh]);

    const getVcsCommits = useCallback((noteUuid) => {
        if (!db || !noteUuid) return [];
        try {
            const res = db.exec("SELECT commit_uuid, commit_message, note_title_snapshot, note_content_snapshot, created_at FROM vcs_commits WHERE parent_note_uuid = ? ORDER BY created_at DESC", [noteUuid]);
            if (res && res.length > 0 && res[0].values) {
                return res[0].values.map(row => ({
                    id: row[0],
                    message: row[1],
                    titleSnapshot: row[2],
                    contentSnapshot: row[3],
                    createdAt: row[4]
                }));
            }
        } catch (err) {
            console.error("VCS query failed:", err);
        }
        return [];
    }, [db]);

    const restoreVcsCommit = useCallback((noteUuid, commitUuid) => {
        if (!db || !noteUuid || !commitUuid) return;
        try {
            const res = db.exec("SELECT note_title_snapshot, note_content_snapshot, commit_message FROM vcs_commits WHERE commit_uuid = ?", [commitUuid]);
            if (res && res.length > 0 && res[0].values) {
                const restoredTitle = res[0].values[0][0];
                const restoredContent = res[0].values[0][1];
                const origMsg = res[0].values[0][2];

                // Update sticky_notes
                db.run("UPDATE sticky_notes SET note_title = ?, note_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [restoredTitle, restoredContent, noteUuid]);
                
                // Create a commit tracking this restore
                const commitId = "commit_" + Date.now();
                db.run(
                    "INSERT INTO vcs_commits (commit_uuid, parent_note_uuid, commit_message, note_title_snapshot, note_content_snapshot) VALUES (?, ?, ?, ?, ?)",
                    [commitId, noteUuid, `Restored: "${origMsg}"`, restoredTitle || "", restoredContent || ""]
                );
                
                // Prune
                db.run(
                    "DELETE FROM vcs_commits WHERE parent_note_uuid = ? AND commit_uuid NOT IN (SELECT commit_uuid FROM vcs_commits WHERE parent_note_uuid = ? ORDER BY created_at DESC LIMIT 30)",
                    [noteUuid, noteUuid]
                );

                persistDatabaseToDisk(ipcRenderer, db);
                triggerRefresh();
            }
        } catch (err) {
            console.error("VCS restore failed:", err);
        }
    }, [db, triggerRefresh]);

    const toggleNoteFlag = useCallback((uuid, currentFlagState) => {
        if (!db) return;
        const nextVal = currentFlagState ? 0 : 1;
        try {
            db.run("UPDATE sticky_notes SET is_flagged = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [nextVal, uuid]);
            persistDatabaseToDisk(ipcRenderer, db);
            triggerRefresh();
        } catch (e) {
            console.error("Failed to toggle note flag:", e);
        }
    }, [db, triggerRefresh]);

    const swapNotesOrder = useCallback((uuidA, uuidB) => {
        if (!db) return;
        try {
            const resA = db.exec("SELECT sort_order FROM sticky_notes WHERE note_uuid = ?", [uuidA]);
            const resB = db.exec("SELECT sort_order FROM sticky_notes WHERE note_uuid = ?", [uuidB]);
            
            let orderA = 0;
            let orderB = 0;
            if (resA && resA.length > 0 && resA[0].values) {
                orderA = resA[0].values[0][0] || 0;
            }
            if (resB && resB.length > 0 && resB[0].values) {
                orderB = resB[0].values[0][0] || 0;
            }
            
            if (orderA === orderB) {
                orderB = orderA + 1;
            }
            
            db.run("UPDATE sticky_notes SET sort_order = ? WHERE note_uuid = ?", [orderB, uuidA]);
            db.run("UPDATE sticky_notes SET sort_order = ? WHERE note_uuid = ?", [orderA, uuidB]);
            
            persistDatabaseToDisk(ipcRenderer, db);
            triggerRefresh();
        } catch (e) {
            console.error("Failed to swap notes sort order:", e);
        }
    }, [db, triggerRefresh]);

    const toggleNotePin = useCallback((uuid, currentPinState) => {
        if (!db) return;
        const nextVal = currentPinState ? 0 : 1;
        try {
            db.run("UPDATE sticky_notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [nextVal, uuid]);
            persistDatabaseToDisk(ipcRenderer, db);
            triggerRefresh();
        } catch (e) {
            console.error("Failed to toggle note pin:", e);
        }
    }, [db, triggerRefresh]);

    const saveLayoutState = useCallback((openUuids, selectedUuid) => {
        if (!db) return;
        try {
            db.run("INSERT OR REPLACE INTO sys_layout_state (layout_key, open_note_uuids, selected_note_uuid) VALUES ('main_workspace', ?, ?)", [openUuids.join(','), selectedUuid || '']);
            persistDatabaseToDisk(ipcRenderer, db);
        } catch (e) {
            console.error("Failed to save layout state to db:", e);
        }
    }, [db, ipcRenderer]);

    return {
        db,
        dbReady,
        alwaysOnTop,
        serviceStatus,
        resetDatabase,
        toggleAlwaysOnTop,
        handleServiceAction,
        exportSingleTask,
        exportNoteBackup,
        saveToLocalStorage: (targetDb) => persistDatabaseToDisk(ipcRenderer, targetDb),
        refreshUiData,
        windowId,
        allNotes,
        allFolders,
        savedOpenUuids,
        savedSelectedUuid,
        saveLayoutState,
        createFolder,
        renameFolder,
        deleteFolder,
        createNoteInFolder,
        triggerRefresh,
        addEvent,
        deleteEvent,
        addExpense,
        deleteExpense,
        addVcsCommit,
        getVcsCommits,
        restoreVcsCommit,
        toggleNoteFlag,
        swapNotesOrder,
        toggleNotePin,
        ...taskModule,
        ...themeModule,
        ...markdownModule,
        ...adminModule,
        logUiError
    };
}
