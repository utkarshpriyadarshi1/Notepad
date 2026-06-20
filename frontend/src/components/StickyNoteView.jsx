import { useState, useEffect } from 'react';
import Header from './Header';
import ActionBar from './ActionBar';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import EventForm from './EventForm';
import EventList from './EventList';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import GenericEditorWorkspace from './GenericEditorWorkspace';
import SettingsPanel from './SettingsPanel';
import VCSHistoryPanel from './VCSHistoryPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckDouble, 
    faClock, 
    faTag, 
    faFileLines, 
    faListCheck,
    faHistory
} from '@fortawesome/free-solid-svg-icons';
import { persistDatabaseToDisk } from '../hooks/sqlite/dbController';

export default function StickyNoteView({
    windowId,
    db,
    dbReady,
    tasks,
    noteTitle,
    noteColor,
    markdownText,
    alwaysOnTop,
    allNotes,
    
    addTask,
    toggleTask,
    deleteTaskGlobal,
    clearCompleted,
    changeTheme,
    updateNoteTitle,
    toggleAlwaysOnTop,
    updateMarkdown,
    onTriggerRefresh,
    
    // Notebook/Note Management
    allFolders,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onCreateNoteInFolder,
    onRenameNote,
    onChangeNoteTheme,
    onDeleteNote,
    onExportNote,
    
    // Logging features CRUD
    addEvent,
    deleteEvent,
    addExpense,
    deleteExpense,
    
    // VCS CRUD
    addVcsCommit,
    getVcsCommits,
    restoreVcsCommit,
    
    // Settings panel
    settingsOpen,
    setSettingsOpen,
    resetDatabase,
    triggerJsonExport,
    triggerJsonImport,
    serviceStatus,
    handleServiceAction,
    
    // Global Task CRUD for Data Hub
    renameTaskGlobal,
    exportSingleTask,
    
    // Day/Night mode props
    isDarkMode,
    onToggleDarkMode,
    
    // Preferences
    editorPrefs,
    onUpdateEditorPrefs,
    
    ipcRenderer
}) {
    const [isFocused, setIsFocused] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const [showVcsPanel, setShowVcsPanel] = useState(false);

    const [events, setEvents] = useState([]);
    const [expenses, setExpenses] = useState([]);

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


    const handleClearCompleted = () => {
        if (!db) return;
        db.run("DELETE FROM task_items WHERE is_marked_completed = 1 AND parent_note_uuid = ?", [windowId]);
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
    };

    // Query events and expenses log inside the compact sticky note
    useEffect(() => {
        if (db && windowId) {
            try {
                // Query events
                const evRes = db.exec("SELECT event_uuid, event_text, event_time FROM events_log WHERE parent_note_uuid = ? ORDER BY event_time DESC", [windowId]);
                if (evRes && evRes.length > 0 && evRes[0].values) {
                    setEvents(evRes[0].values.map(row => ({
                        id: row[0],
                        text: row[1],
                        time: row[2]
                    })));
                } else {
                    setEvents([]);
                }

                // Query expenses
                const expRes = db.exec("SELECT expense_uuid, expense_amount, expense_category, expense_description, expense_date FROM expense_log WHERE parent_note_uuid = ? ORDER BY expense_date DESC, created_at DESC", [windowId]);
                if (expRes && expRes.length > 0 && expRes[0].values) {
                    setExpenses(expRes[0].values.map(row => ({
                        id: row[0],
                        amount: row[1],
                        category: row[2],
                        description: row[3],
                        date: row[4]
                    })));
                } else {
                    setExpenses([]);
                }
            } catch (e) {
                console.error("Failed to query compact note logs:", e);
            }
        }
    }, [db, windowId, allNotes]);

    useEffect(() => {
        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        setShowVcsPanel(false);
    }, [windowId]);

    const isShadowActive = isFocused || isHovered;
    const shadowClass = isShadowActive
        ? "shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-black/15 scale-[0.99] border-black/20"
        : "shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 scale-100 border-black/10";

    const mode = getEditorModeFromTitle(noteTitle);

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full h-full p-1.5 bg-transparent font-sans antialiased relative transition-all duration-350"
        >
            <div className={`w-full h-full border rounded-2xl flex flex-col overflow-hidden transition-all duration-350 ${noteColor} ${shadowClass}`}>
                
                {/* Header Section */}
                <Header
                    title={noteTitle}
                    noteColor={noteColor}
                    ipcRenderer={ipcRenderer}
                    onUpdateTitle={(newTitle) => {
                        const oldExt = getEditorModeFromTitle(noteTitle);
                        const newExt = getEditorModeFromTitle(newTitle);
                        
                        if (oldExt !== newExt) {
                            // Auto-backup snapshot before extension changes
                            addVcsCommit(
                                windowId, 
                                noteTitle, 
                                markdownText, 
                                `Auto-backup: Changed type from .${oldExt} to .${newExt}`
                            );
                            try {
                                db.run("UPDATE sticky_notes SET note_view_mode = ? WHERE note_uuid = ?", [newExt, windowId]);
                            } catch (e) {
                                console.error("Failed to update note view mode on rename:", e);
                            }
                        }
                        updateNoteTitle(newTitle);
                    }}
                    alwaysOnTop={alwaysOnTop}
                    onToggleAlwaysOnTop={toggleAlwaysOnTop}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                />

                {/* Workspace Content Mount Zone */}
                <div className="flex-1 p-4 pt-3 flex flex-col overflow-hidden relative min-h-0">
                    
                    {!dbReady ? (
                        <div className="flex-1 flex items-center justify-center text-xs opacity-50 font-bold animate-pulse tracking-wide select-none">
                            Initializing SQLite...
                        </div>
                    ) : (
                        <>
                            {showVcsPanel ? (
                                <div className="flex-1 flex flex-col overflow-hidden bg-white/20 p-3 rounded-xl border border-black/5 mb-2 select-text no-drag text-left min-h-0">
                                    <VCSHistoryPanel
                                        noteUuid={windowId}
                                        activeTitle={noteTitle}
                                        activeContent={markdownText}
                                        getVcsCommits={getVcsCommits}
                                        addVcsCommit={addVcsCommit}
                                        restoreVcsCommit={restoreVcsCommit}
                                        onClose={() => setShowVcsPanel(false)}
                                    />
                                </div>
                            ) : (() => {
                                if (mode === 'todo' || mode === 'list') {
                                    return (
                                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100 min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-3.5 rounded-2xl border border-black/10 dark:border-white/10 mb-2 text-left shadow-lg">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block select-none">
                                                {mode === 'todo' ? 'Tasks Checklist (.todo)' : 'Simple Checklist (.list)'}
                                            </span>
                                            <TaskForm onAddTask={addTask} />
                                            <TaskList 
                                                tasks={tasks} 
                                                onToggleTask={toggleTask} 
                                                onDeleteTask={deleteTaskGlobal} 
                                            />
                                            {tasks.length > 0 && (
                                                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex justify-end select-none flex-shrink-0">
                                                    <button
                                                        onClick={handleClearCompleted}
                                                        className="px-2 py-0.8 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded text-[9px] font-bold text-slate-655 dark:text-slate-350 cursor-pointer flex items-center gap-1 opacity-85 transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faCheckDouble} /> Clear Done
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                
                                if (mode === 'log') {
                                    return (
                                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100 min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-3.5 rounded-2xl border border-black/10 dark:border-white/10 mb-2 text-left shadow-lg">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block select-none">
                                                Events Log (.log)
                                            </span>
                                            <EventForm onAddEvent={(text) => {
                                                addEvent(windowId, text);
                                                onTriggerRefresh();
                                            }} />
                                            <EventList 
                                                events={events} 
                                                onDeleteEvent={(id) => {
                                                    deleteEvent(id);
                                                    onTriggerRefresh();
                                                }} 
                                            />
                                        </div>
                                    );
                                }
                                
                                if (mode === 'xpnc') {
                                    return (
                                        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100 min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-3.5 rounded-2xl border border-black/10 dark:border-white/10 mb-2 text-left shadow-lg">
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block select-none">
                                                Expenses Log (.xpnc)
                                            </span>
                                            <ExpenseForm onAddExpense={(amount, cat, desc) => {
                                                addExpense(windowId, amount, cat, desc);
                                                onTriggerRefresh();
                                            }} />
                                            <ExpenseList 
                                                expenses={expenses} 
                                                onDeleteExpense={(id) => {
                                                    deleteExpense(id);
                                                    onTriggerRefresh();
                                                }} 
                                            />
                                        </div>
                                    );
                                }
                                
                                return (
                                    <GenericEditorWorkspace 
                                        text={markdownText} 
                                        onUpdate={updateMarkdown} 
                                        language={mode} 
                                        isCompact={true}
                                        editorPrefs={editorPrefs}
                                    />
                                );
                            })()}

                            {/* Utility ActionBar */}
                            <ActionBar
                                onChangeTheme={changeTheme}
                                onClearDone={clearCompleted}
                                hasTasks={tasks.length > 0}
                                viewMode={mode}
                                onToggleView={() => {}}
                                onOpenSettings={() => setSettingsOpen(true)}
                                hideViewToggle={true}
                                onToggleVcs={() => setShowVcsPanel(!showVcsPanel)}
                                vcsActive={showVcsPanel}
                            />
                        </>
                    )}

                    {/* Settings Modal Overlay */}
                    <SettingsPanel
                        isOpen={settingsOpen}
                        onClose={() => setSettingsOpen(false)}
                        appName="Notepad Floating Widget"
                        onResetDatabase={resetDatabase}
                        onExport={triggerJsonExport}
                        onImport={triggerJsonImport}
                        db={db}
                        onTriggerRefresh={onTriggerRefresh}

                        // Widget/Note Management Props
                        allWidgets={allNotes}
                        currentWidgetId={windowId}
                        onRenameWidget={onRenameNote}
                        onChangeWidgetTheme={onChangeNoteTheme}
                        onDeleteWidget={onDeleteNote}
                        onFocusWidget={(uuid) => ipcRenderer && ipcRenderer.send('focus-widget-window', uuid)}
                        onCreateWidget={(name) => onCreateNoteInFolder('folder_1', name)}
                        onExportWidget={onExportNote}
                        
                        // Folder & DB Props
                        allFolders={allFolders}
                        onCreateFolder={onCreateFolder}
                        onRenameFolder={onRenameFolder}
                        onDeleteFolder={onDeleteFolder}
                        onCreateWidgetInFolder={onCreateNoteInFolder}
                        
                        serviceStatus={serviceStatus}
                        onServiceAction={handleServiceAction}

                        // Preferences
                        editorPrefs={editorPrefs}
                        onUpdateEditorPrefs={onUpdateEditorPrefs}
                        ipcRenderer={ipcRenderer}
                    />
                </div>
            </div>
        </div>
    );
}
