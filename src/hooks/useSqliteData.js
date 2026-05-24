import {useCallback, useEffect, useState} from 'react';
import {initializeLocalDatabase, persistDatabaseToDisk} from './sqlite/dbController';
import {useTaskActions} from './sqlite/useTaskActions';
import {useThemeActions} from './sqlite/useThemeActions';
import {useMarkdownActions} from './sqlite/useMarkdownActions';
import {useAdminActions} from './sqlite/useAdminActions';
import config from "../../app.config.json";

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;


export function useSqliteData() {
    const [db, setDb] = useState(null);
    const [dbReady, setDbReady] = useState(false);
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    const [serviceStatus, setServiceStatus] = useState("CHECKING...");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [windowId, setWindowId] = useState('widget_1');
    const [allWidgets, setAllWidgets] = useState([]);
    const [allFolders, setAllFolders] = useState([]);

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
    
    const refreshUiData = useCallback((targetDb, currentWidgetId) => {
        if (!targetDb || !currentWidgetId) return;
        try {
            // Query master widget profile metrics using clean refactored columns
            const widgetQuery = "SELECT widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content FROM sticky_widgets WHERE widget_uuid = ?";
            const widgetRes = targetDb.exec(widgetQuery, [currentWidgetId]);

            if (widgetRes && widgetRes.length > 0 && widgetRes[0].values) {
                const dataRow = widgetRes[0].values[0];
                setNoteTitle(dataRow[0]);
                if (config.colorThemes[dataRow[1]]) setNoteColor(config.colorThemes[dataRow[1]]);
                const dbMode = dataRow[2] === 'checklist' ? 'tasks' : dataRow[2];
                setViewMode(dbMode);
                setMarkdownText(dataRow[3]);
            }

            // Query related checklist items using clean foreign key targets
            const itemQuery = "SELECT item_uuid, item_text_payload, is_marked_completed FROM task_items WHERE parent_widget_uuid = ?";
            const itemRes = targetDb.exec(itemQuery, [currentWidgetId]);

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

            // Query all widgets with parent_folder_uuid
            const allWidgetsQuery = "SELECT widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode FROM sticky_widgets";
            const allWidgetsRes = targetDb.exec(allWidgetsQuery);
            if (allWidgetsRes && allWidgetsRes.length > 0 && allWidgetsRes[0].values) {
                setAllWidgets(allWidgetsRes[0].values.map(row => ({
                    uuid: row[0],
                    parentFolderUuid: row[1],
                    title: row[2],
                    theme: row[3],
                    viewMode: row[4]
                })));
            } else {
                setAllWidgets([]);
            }
        } catch (err) {
            if (ipcRenderer) {
                ipcRenderer.send('log-ui-event', {
                    level: 'ERROR', moduleName: 'React_Sync_Engine', message: err.message, stack: err.stack
                });
            }
        }
    }, [setTasks, setNoteTitle, setNoteColor, setViewMode, setMarkdownText, setAllWidgets, setAllFolders]);

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
            let currentWindowId = 'widget_1';
            if (ipcRenderer) {
                const configData = await ipcRenderer.invoke('get-app-config');
                if (configData?.appName) defaultName = configData.appName;
                setServiceStatus(await ipcRenderer.invoke('get-service-status'));
                currentWindowId = await ipcRenderer.invoke('get-window-id') || 'widget_1';
            }
            setWindowId(currentWindowId);
            const activeDb = await initializeLocalDatabase(ipcRenderer, defaultName, currentWindowId);
            setDb(activeDb);
            refreshUiData(activeDb, currentWindowId);
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
            if (ipcRenderer) ipcRenderer.send('set-always-on-top', !prev);
            return !prev;
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

    const exportSingleWidget = (uuid, title) => {
        if (!db) return;
        try {
            const widgetRes = db.exec("SELECT * FROM sticky_widgets WHERE widget_uuid = ?", [uuid]);
            const tasksRes = db.exec("SELECT * FROM task_items WHERE parent_widget_uuid = ?", [uuid]);

            const bundle = {
                app: "Electron Sticky Note Widget",
                exportedAt: new Date().toISOString(),
                widgetUuid: uuid,
                widgets: widgetRes && widgetRes.length > 0 && widgetRes[0].values ? widgetRes[0].values : [],
                tasks: tasksRes && tasksRes.length > 0 && tasksRes[0].values ? tasksRes[0].values : []
            };

            const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
            const anchor = document.createElement('a');
            anchor.setAttribute("href", dataUri);
            anchor.setAttribute("download", `widget_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        } catch (err) {
            console.error("Failed to export widget backup:", err);
            alert("Failed to export widget data.");
        }
    };

    const createFolder = useCallback((name) => {
        if (!db || !name.trim()) return;
        db.run("INSERT INTO sticky_folders (folder_uuid, folder_name) VALUES (?, ?)", ["folder_" + Date.now(), name.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
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

    const createWidgetInFolder = useCallback((folderUuid, title) => {
        if (!db || !title.trim()) return;
        const newWidgetId = "widget_" + Date.now();
        db.run("INSERT INTO sticky_widgets (widget_uuid, parent_folder_uuid, widget_title, widget_theme_preset, widget_view_mode, widget_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height) VALUES (?, ?, ?, 'yellow', 'tasks', '# Write ideas here...', 100, 100, 350, 420)", [newWidgetId, folderUuid, title.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        triggerRefresh();
    }, [db, triggerRefresh]);

    return {
        db,
        dbReady,
        alwaysOnTop,
        serviceStatus,
        resetDatabase,
        toggleAlwaysOnTop,
        handleServiceAction,
        exportSingleTask,
        exportSingleWidget,
        saveToLocalStorage: (targetDb) => persistDatabaseToDisk(ipcRenderer, targetDb),
        refreshUiData,
        windowId,
        allWidgets,
        allFolders,
        createFolder,
        renameFolder,
        deleteFolder,
        createWidgetInFolder,
        triggerRefresh,
        ...taskModule,
        ...themeModule,
        ...markdownModule,
        ...adminModule,
        logUiError
    };
}
