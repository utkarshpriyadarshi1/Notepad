import {useCallback, useEffect, useState} from 'react';
import {initializeLocalDatabase, persistDatabaseToDisk} from './sqlite/dbController';
import {useTaskActions} from './sqlite/useTaskActions';
import {useThemeActions} from './sqlite/useThemeActions';
import {useMarkdownActions} from './sqlite/useMarkdownActions';
import {useAdminActions} from './sqlite/useAdminActions';
import {colorThemes, defaultTitle} from "../../app.config";

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;


export function useSqliteData() {
    const [db, setDb] = useState(null);
    const [dbReady, setDbReady] = useState(false);
    const [alwaysOnTop, setAlwaysOnTop] = useState(true);
    const [serviceStatus, setServiceStatus] = useState("CHECKING...");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

    // Instantiate Sub-Hook Operations Modules
    const taskModule = useTaskActions(db, ipcRenderer, triggerRefresh);
    const themeModule = useThemeActions(db, ipcRenderer, triggerRefresh, colorThemes);
    const markdownModule = useMarkdownActions(db, ipcRenderer, triggerRefresh);
    const adminModule = useAdminActions(db, ipcRenderer, triggerRefresh);

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

    const refreshUiData = useCallback((targetDb) => {
        if (!targetDb) return;
        try {
            const metaRes = targetDb.exec("SELECT key, value FROM sticky_meta");
            if (metaRes?.length > 0 && metaRes[0].values) {
                const metaRows = metaRes[0].values;
                const titleRow = metaRows.find(r => r[0] === 'title');
                const colorRow = metaRows.find(r => r[0] === 'color');
                const viewRow = metaRows.find(r => r === 'view_mode');
                const mdRow = metaRows.find(r => r === 'markdown_content');

                if (titleRow) themeModule.setNoteTitle(titleRow[1]);
                if (colorRow && colorThemes[colorRow[1]]) themeModule.setNoteColor(colorThemes[colorRow[1]]);
                if (viewRow) markdownModule.setViewMode(viewRow[1]);
                if (mdRow) markdownModule.setMarkdownText(mdRow[1]);
            }

            const taskRes = targetDb.exec("SELECT id, task_text, is_completed FROM tasks");
            if (taskRes?.length > 0 && taskRes[0].values) {
                taskModule.setTasks(taskRes[0].values.map(row => ({id: row[0], text: row[1], done: row[2] === 1})));
            } else {
                taskModule.setTasks([]);
            }
        } catch (err) {
            console.error("Sync structural error:", err);
        }
    }, [taskModule, themeModule, markdownModule]);

    useEffect(() => {
        async function boot() {
            let defaultName = defaultTitle;
            if (ipcRenderer) {
                const config = await ipcRenderer.invoke('get-app-config');
                if (config?.appName) defaultName = config.appName;
                setServiceStatus(await ipcRenderer.invoke('get-service-status'));
            }
            const activeDb = await initializeLocalDatabase(ipcRenderer, defaultName);
            setDb(activeDb);
            refreshUiData(activeDb);
            setDbReady(true);
        }

        boot();
    }, []);

    useEffect(() => {
        if (dbReady && db) refreshUiData(db);
    }, [refreshTrigger]);

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

    return {
        db,
        dbReady,
        alwaysOnTop,
        serviceStatus,
        resetDatabase,
        toggleAlwaysOnTop,
        handleServiceAction,
        exportSingleTask,
        saveToLocalStorage: (targetDb) => persistDatabaseToDisk(ipcRenderer, targetDb),
        refreshUiData, ...taskModule, ...themeModule, ...markdownModule, ...adminModule, logUiError
    };
}
