import  { useEffect } from 'react';
import { useSqliteData } from './hooks/useSqliteData';
import Header from './components/Header';
import ThemeSelector from './components/ThemeSelector';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

export default function App() {
    const {
        db, dbReady, tasks, noteTitle, noteColor,
        addTask, toggleTask, clearCompleted, changeTheme,
        saveToLocalStorage, refreshUiData
    } = useSqliteData();

    // Bounds Listener Configuration
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

    // Backup handling structures
    const triggerJsonExport = () => {
        if (!db) return;
        const notesRes = db.exec("SELECT * FROM sticky_meta");
        const tasksRes = db.exec("SELECT * FROM tasks");

        const bundle = {
            app: "Electron Sticky Note Widget",
            exportedAt: new Date().toISOString(),
            meta: notesRes.length > 0 ? notesRes[0].values : [],
            tasks: tasksRes.length > 0 ? tasksRes[0].values : []
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
                alert("Failed to parse JSON backup.", err);
            }
        };
        if (event.target.files?.[0]) reader.readAsText(event.target.files[0]);
    };

    return (
        /* The outer container wrapper must remain 100% transparent so your desktop engine doesn't render box borders */
        <div className="w-full h-screen p-3 bg-transparent select-none font-sans antialiased">

            {/* THE MAIN NOTE CARD WIDGET FRAME */}
            <div className={`
            w-full h-full 
            border border-black
            rounded-4xl 
            bg-red-50
            border-20
            shadow-3xl 
            flex flex-col 
            overflow-hidden 
            transition-all duration-300 
            ${noteColor.split(' ').slice(0,3).join(' ')}
        `}>

                {/* 1. Header Component Handle */}
                <Header title={noteTitle} noteColor={noteColor} ipcRenderer={ipcRenderer} />

                {/* 2. Scrollable Body Content Element */}
                <div className="flex-1 p-4 flex flex-col overflow-hidden">
                    <ThemeSelector onChangeTheme={changeTheme} />

                    {!dbReady ? (
                        <div className="flex-1 flex items-center justify-center text-xs opacity-50 animate-pulse">Initializing SQLite Context...</div>
                    ) : (
                        <>
                            db ready
                            <TaskForm onAddTask={addTask} />
                            <TaskList tasks={tasks} onToggleTask={toggleTask} />

                            {/* Utility Footer Hooks */}
                            <div style={{ WebkitAppRegion: 'no-drag' }} className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center text-[10px]">
                                <button onClick={clearCompleted} className="px-2 py-1 bg-black/5 hover:bg-black/10 rounded font-medium opacity-75 cursor-pointer">
                                    Clear Done
                                </button>

                                <div className="flex gap-1.5">
                                    <button onClick={triggerJsonExport} className="hover:underline font-bold text-slate-700 cursor-pointer">Export</button>
                                    <span className="opacity-30">|</span>
                                    <label className="hover:underline font-bold text-slate-700 cursor-pointer">
                                        Import
                                        <input type="file" accept=".json" onChange={triggerJsonImport} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
