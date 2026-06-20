import { useEffect, useState } from 'react';
import { useSqliteData } from './hooks/useSqliteData';
import { useDesktopServices } from './hooks/useDesktopServices';
import MainNotepadView from './components/MainNotepadView';
import StickyNoteView from './components/StickyNoteView';

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const next = !prev;
            const themeStr = next ? 'dark' : 'light';
            localStorage.setItem('theme', themeStr);
            document.documentElement.classList.toggle('dark', next);
            document.documentElement.classList.toggle('light', !next);
            return next;
        });
    };

    const [editorPrefs, setEditorPrefs] = useState(() => {
        const stored = localStorage.getItem('editorPrefs');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse editorPrefs from localStorage:", e);
            }
        }
        return {
            theme: 'standard', // 'standard', 'monokai', 'dracula', 'github-dark'
            fontSize: 12,
            tabSize: 4,
            lineWrap: true,
            backupInterval: 600000, // 10 minutes in ms
            enableMultiCursor: false,
            enableLocalFileAutoSync: true,
            defaultFileName: 'Note',
            defaultFolderName: 'Notebook',
            defaultFileType: 'md'
        };
    });

    const updateEditorPrefs = (newPrefs) => {
        setEditorPrefs(prev => {
            const next = { ...prev, ...newPrefs };
            localStorage.setItem('editorPrefs', JSON.stringify(next));
            return next;
        });
    };


    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme') {
                const nextDark = e.newValue === 'dark';
                setIsDarkMode(nextDark);
                document.documentElement.classList.toggle('dark', nextDark);
                document.documentElement.classList.toggle('light', !nextDark);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.classList.toggle('light', !isDarkMode);
    }, [isDarkMode]);
    // 1. Structural Database Lifecycle Core Hook Extraction
    const {
        db, dbReady, tasks, noteTitle, noteColor, markdownText, alwaysOnTop, serviceStatus,
        addTask, toggleTask, clearCompleted, changeTheme, updateNoteTitle, updateMarkdown,
        toggleAlwaysOnTop, resetDatabase, handleServiceAction, deleteTaskGlobal, exportNoteBackup,
        saveToLocalStorage, refreshUiData, windowId, allNotes, renameNote, changeNoteTheme,
        deleteNote, allFolders, createFolder, renameFolder, deleteFolder, createNoteInFolder, triggerRefresh,
        addEvent, deleteEvent, addExpense, deleteExpense,
        addVcsCommit, getVcsCommits, restoreVcsCommit,
        toggleNoteFlag, swapNotesOrder, toggleNotePin,
        savedOpenUuids, savedSelectedUuid, saveLayoutState,
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
                onToggleNotePin={toggleNotePin}
                
                // Layout states & persist
                savedOpenUuids={savedOpenUuids}
                savedSelectedUuid={savedSelectedUuid}
                onSaveLayoutState={saveLayoutState}
                
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
                
                // Day/Night mode props
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                
                // Preferences
                editorPrefs={editorPrefs}
                onUpdateEditorPrefs={updateEditorPrefs}
                
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
            
            // Day/Night mode props
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            
            // Preferences
            editorPrefs={editorPrefs}
            onUpdateEditorPrefs={updateEditorPrefs}
            
            ipcRenderer={ipcRenderer}
        />
    );
}
