import { useState, useEffect } from 'react';
import { useSqliteData } from './hooks/useSqliteData';
import { useDesktopServices } from './hooks/useDesktopServices';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ActionBar from './components/ActionBar';
import SettingsPanel from './components/SettingsPanel';
import MarkdownToolbar from './components/MarkdownToolbar';
import MarkdownEditor from './components/MarkdownEditor';

export default function App() {
    // 1. Structural Database Lifecycle Core Hook Extraction
    const {
        db, dbReady, tasks, noteTitle, noteColor, viewMode, markdownText, alwaysOnTop, serviceStatus,
        addTask, toggleTask, clearCompleted, changeTheme, updateNoteTitle, toggleViewMode, updateMarkdown,
        toggleAlwaysOnTop, resetDatabase, handleServiceAction, deleteTaskGlobal, renameTaskGlobal, exportSingleTask,
        exportSingleWidget, saveToLocalStorage, refreshUiData, windowId, allWidgets, renameWidget, changeWidgetTheme,
        deleteWidget, focusWidget, allFolders, createFolder, renameFolder, deleteFolder, createWidgetInFolder, triggerRefresh
    } = useSqliteData();

    // 2. Hardware Bounds Tracking & Backup Handling File Hooks
    const {
        settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer
    } = useDesktopServices(db, saveToLocalStorage, refreshUiData, windowId);

    const [isFocused, setIsFocused] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

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

    // Expand/contract window automatically when settings open
    useEffect(() => {
        if (ipcRenderer) {
            ipcRenderer.send('resize-to-settings', settingsOpen);
        }
    }, [settingsOpen, ipcRenderer]);

    // 3. Helper Method to Safely Append Markdown Text Layout Symbols
    const handleInsertMarkup = (syntax) => {
        updateMarkdown((markdownText || "") + syntax);
    };

    // Enhanced shadow and scale effects on focus and hover
    const isShadowActive = isFocused || isHovered;
    const shadowClass = isShadowActive
        ? "shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-black/15 scale-[0.99] border-black/20"
        : "shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 scale-100 border-black/10";

    return (
        // The outermost parent container must take up 100% of the screen width and height
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full h-screen p-1.5 bg-transparent font-sans antialiased relative transition-all duration-300"
        >
            <div className={`w-full h-full border rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${noteColor} ${shadowClass}`}>

                <Header
                    title={noteTitle}
                    noteColor={noteColor}
                    ipcRenderer={ipcRenderer}
                    onUpdateTitle={updateNoteTitle}
                    alwaysOnTop={alwaysOnTop}
                    onToggleAlwaysOnTop={toggleAlwaysOnTop}
                />

                {/* Primary Content Base Board Container Workspace Frame */}
                <div className="flex-1 p-4 flex flex-col overflow-hidden relative">

                    {/* Preferences Layout HUD Switch Panels Modal View Overlay */}
                    <SettingsPanel
                        isOpen={settingsOpen}
                        onClose={() => setSettingsOpen(false)}
                        appName="StickyFlow Desktop Core"
                        noteTitle={noteTitle}
                        onUpdateTitle={updateNoteTitle}
                        alwaysOnTop={alwaysOnTop}
                        onToggleAlwaysOnTop={toggleAlwaysOnTop}
                        onResetDatabase={resetDatabase}
                        tasks={tasks}
                        onToggleTask={toggleTask}
                        onExport={triggerJsonExport}
                        onImport={triggerJsonImport}
                        serviceStatus={serviceStatus}
                        onServiceAction={handleServiceAction}
                        onDeleteTaskGlobal={deleteTaskGlobal}
                        onRenameTaskGlobal={renameTaskGlobal}
                        onExportSingleTask={exportSingleTask}
                        onExportWidget={exportSingleWidget}
                        allWidgets={allWidgets}
                        currentWidgetId={windowId}
                        onRenameWidget={renameWidget}
                        onChangeWidgetTheme={changeWidgetTheme}
                        onDeleteWidget={deleteWidget}
                        onFocusWidget={focusWidget}
                        onCreateWidget={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                        
                        // Folders & Database Sharing Props
                        allFolders={allFolders}
                        onCreateFolder={createFolder}
                        onRenameFolder={renameFolder}
                        onDeleteFolder={deleteFolder}
                        onCreateWidgetInFolder={createWidgetInFolder}
                        db={db}
                        onTriggerRefresh={triggerRefresh}
                    />

                    {!dbReady ? (
                        <div className="flex-1 flex items-center justify-center text-xs opacity-50 font-bold animate-pulse tracking-wide select-none">
                            Initializing SQLite Disk Context...
                        </div>
                    ) : (
                        <>
                            {/* Dual-Mode Canvas Layer Content Selection Logic Router */}
                            {viewMode === "tasks" ? (
                                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100">
                                    <TaskForm onAddTask={addTask} />
                                    <TaskList tasks={tasks} onToggleTask={toggleTask} onDeleteTask={deleteTaskGlobal} />
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100">
                                    <MarkdownToolbar onInsertMarkup={handleInsertMarkup} />
                                    <MarkdownEditor text={markdownText} onUpdate={updateMarkdown} />
                                </div>
                            )}

                            {/* Google Keep Styled Bottom Utility Tool Belt Frame */}
                            <ActionBar
                                onChangeTheme={changeTheme}
                                onClearDone={clearCompleted}
                                hasTasks={tasks.length > 0}
                                viewMode={viewMode}
                                onToggleView={toggleViewMode}
                                onOpenSettings={() => setSettingsOpen(true)}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
