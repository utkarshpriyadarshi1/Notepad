import { useEffect } from 'react';
import { useSqliteData } from './hooks/useSqliteData';
import { useDesktopServices } from './hooks/useDesktopServices';
import MainNotepadView from './components/MainNotepadView';
import StickyNoteView from './components/StickyNoteView';

export default function App() {
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);

        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                const newDark = e.newValue === 'dark';
                document.documentElement.classList.toggle('dark', newDark);
                document.documentElement.classList.toggle('light', !newDark);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    // 1. Structural Database Lifecycle Core Hook Extraction
    const {
        db, dbReady, tasks, noteTitle, noteColor, markdownText, alwaysOnTop, serviceStatus,
        addTask, toggleTask, clearCompleted, changeTheme, updateNoteTitle, updateMarkdown,
        toggleAlwaysOnTop, resetDatabase, handleServiceAction, deleteTaskGlobal, exportNoteBackup,
        saveToLocalStorage, refreshUiData, windowId, allNotes, renameNote, changeNoteTheme,
        deleteNote, allFolders, createFolder, renameFolder, deleteFolder, createNoteInFolder, triggerRefresh,
        addEvent, deleteEvent, addExpense, deleteExpense,
        addVcsCommit, getVcsCommits, restoreVcsCommit,
        toggleNoteFlag, swapNotesOrder,
        renameTaskGlobal, exportSingleTask
    } = useSqliteData();

    // 2. Hardware Bounds Tracking & Backup Handling File Hooks
    const {
        settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer
    } = useDesktopServices(db, saveToLocalStorage, refreshUiData, windowId);

    if (!dbReady) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-xs text-slate-400 font-bold animate-pulse tracking-wide select-none">
                Initializing SQLite Disk Context...
            </div>
        );
    }

    if (windowId === 'main_notepad') {
        return (
            <MainNotepadView
                allNotes={allNotes}
                allFolders={allFolders}
                db={db}
                onTriggerRefresh={triggerRefresh}
                onCreateFolder={createFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
                onCreateNoteInFolder={createNoteInFolder}
                onRenameNote={renameNote}
                onChangeNoteTheme={changeNoteTheme}
                onDeleteNote={deleteNote}
                onExportNote={exportNoteBackup}
                
                // Logging CRUD
                addEvent={addEvent}
                deleteEvent={deleteEvent}
                addExpense={addExpense}
                deleteExpense={deleteExpense}
                
                // VCS CRUD
                addVcsCommit={addVcsCommit}
                getVcsCommits={getVcsCommits}
                restoreVcsCommit={restoreVcsCommit}
                
                // Flag & Order
                toggleNoteFlag={toggleNoteFlag}
                swapNotesOrder={swapNotesOrder}
                
                settingsOpen={settingsOpen}
                setSettingsOpen={setSettingsOpen}
                resetDatabase={resetDatabase}
                triggerJsonExport={triggerJsonExport}
                triggerJsonImport={triggerJsonImport}
                serviceStatus={serviceStatus}
                handleServiceAction={handleServiceAction}
                
                // Global Task CRUD for Data Hub
                toggleTask={toggleTask}
                deleteTaskGlobal={deleteTaskGlobal}
                renameTaskGlobal={renameTaskGlobal}
                exportSingleTask={exportSingleTask}
                
                ipcRenderer={ipcRenderer}
            />
        );
    }

    return (
        <StickyNoteView
            windowId={windowId}
            db={db}
            dbReady={dbReady}
            tasks={tasks}
            noteTitle={noteTitle}
            noteColor={noteColor}
            markdownText={markdownText}
            alwaysOnTop={alwaysOnTop}
            allNotes={allNotes}
            
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTaskGlobal={deleteTaskGlobal}
            clearCompleted={clearCompleted}
            changeTheme={changeTheme}
            updateNoteTitle={updateNoteTitle}
            toggleAlwaysOnTop={toggleAlwaysOnTop}
            updateMarkdown={updateMarkdown}
            onTriggerRefresh={triggerRefresh}
            
            // Notebook/Note Management
            allFolders={allFolders}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onCreateNoteInFolder={createNoteInFolder}
            onRenameNote={renameNote}
            onChangeNoteTheme={changeNoteTheme}
            onDeleteNote={deleteNote}
            onExportNote={exportNoteBackup}
            
            // Logging CRUD
            addEvent={addEvent}
            deleteEvent={deleteEvent}
            addExpense={addExpense}
            deleteExpense={deleteExpense}

            // VCS CRUD
            addVcsCommit={addVcsCommit}
            getVcsCommits={getVcsCommits}
            restoreVcsCommit={restoreVcsCommit}
            
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            resetDatabase={resetDatabase}
            triggerJsonExport={triggerJsonExport}
            triggerJsonImport={triggerJsonImport}
            serviceStatus={serviceStatus}
            handleServiceAction={handleServiceAction}
            
            // Global Task CRUD for Data Hub
            renameTaskGlobal={renameTaskGlobal}
            exportSingleTask={exportSingleTask}
            
            ipcRenderer={ipcRenderer}
        />
    );
}
