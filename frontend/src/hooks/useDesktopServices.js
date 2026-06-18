import {useEffect, useState} from 'react';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

export function useDesktopServices(db, saveToLocalStorage, refreshUiData, windowId) {
    const [settingsOpen, setSettingsOpen] = useState(windowId === 'main_notepad');

    useEffect(() => {
        if (windowId === 'main_notepad') {
            setSettingsOpen(true);
        }
    }, [windowId]);

    // Bounds Listener Configuration Setup
    useEffect(() => {
        if (!ipcRenderer) return;
        const onWindowMoveUpdate = (event, bounds) => {
            localStorage.setItem('widget_last_coordinates', JSON.stringify(bounds));
        };
        ipcRenderer.on('window-moved', onWindowMoveUpdate);
        return () => {
            ipcRenderer.removeListener('window-moved', onWindowMoveUpdate);
        };
    }, []);

    const triggerJsonExport = () => {
        if (!db) return;
        try {
            const widgetsRes = db.exec("SELECT * FROM sticky_widgets");
            const tasksRes = db.exec("SELECT * FROM task_items");

            const bundle = {
                app: "Electron Sticky Note Widget",
                exportedAt: new Date().toISOString(),
                widgets: widgetsRes.length > 0 && widgetsRes[0].values ? widgetsRes[0].values : [],
                tasks: tasksRes.length > 0 && tasksRes[0].values ? tasksRes[0].values : []
            };

            const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
            const anchor = document.createElement('a');
            anchor.setAttribute("href", dataUri);
            anchor.setAttribute("download", `widget_backup_${Date.now()}.json`);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        } catch (err) {
            console.error("Failed to export JSON backup:", err);
            alert("Failed to export backup data.");
        }
    };

    const triggerJsonImport = (event) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const payload = JSON.parse(e.target.result);
                if (!db) return;
                db.run("DELETE FROM task_items; DELETE FROM sticky_widgets;");
                if (payload.widgets) {
                    payload.widgets.forEach(row => {
                        const placeholders = row.map(() => '?').join(', ');
                        db.run(`INSERT INTO sticky_widgets VALUES (${placeholders})`, row);
                    });
                }
                if (payload.tasks) {
                    payload.tasks.forEach(row => {
                        const placeholders = row.map(() => '?').join(', ');
                        db.run(`INSERT INTO task_items VALUES (${placeholders})`, row);
                    });
                }
                saveToLocalStorage(db);
                refreshUiData(db, windowId);
                alert("Backup data loaded successfully!");
            } catch (err) {
                console.error("Failed to import JSON backup:", err);
                alert("Failed to parse JSON backup.");
            }
        };
        if (event.target.files?.[0]) reader.readAsText(event.target.files[0]);
    };

    return {settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer};
}
