import {useEffect, useState} from 'react';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

export function useDesktopServices(db, saveToLocalStorage, refreshUiData) {
    const [settingsOpen, setSettingsOpen] = useState(false);

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
        const notesRes = db.exec("SELECT * FROM sticky_meta");
        const tasksRes = db.exec("SELECT * FROM tasks");

        const bundle = {
            app: "Electron Sticky Note Widget",
            exportedAt: new Date().toISOString(),
            meta: notesRes.length > 0 ? notesRes.values : [],
            tasks: tasksRes.length > 0 ? tasksRes.values : []
        };

        const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataUri);
        anchor.setAttribute("download", `widget_backup_${Date.now()}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

    const triggerJsonImport = (event) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const payload = JSON.parse(e.target.result);
                if (!db) return;
                db.run("DELETE FROM tasks; DELETE FROM sticky_meta;");
                if (payload.meta) payload.meta.forEach(row => db.run("INSERT INTO sticky_meta VALUES (?, ?)", row));
                if (payload.tasks) payload.tasks.forEach(row => db.run("INSERT INTO tasks VALUES (?, ?, ?)", row));
                saveToLocalStorage(db);
                refreshUiData(db);
                alert("Backup data loaded successfully!");
            } catch (err) {
                alert("Failed to parse JSON backup.");
            }
        };
        if (event.target.files?.[0]) reader.readAsText(event.target.files[0]);
    };

    return {settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer};
}
