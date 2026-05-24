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
        saveToLocalStorage, refreshUiData
    } = useSqliteData();

    // 2. Hardware Bounds Tracking & Backup Handling File Hooks
    const {
        settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer
    } = useDesktopServices(db, saveToLocalStorage, refreshUiData);

    // 3. Helper Method to Safely Append Markdown Text Layout Symbols
    const handleInsertMarkup = (syntax) => {
        updateMarkdown((markdownText || "") + syntax);
    };

    return (
        <div className="w-full h-screen bg-transparent font-sans antialiased relative selection:bg-slate-800/10">

            {/* THE NOTE CARD WIDGET FRAME */}
            <div className={`
            w-full h-full 
            border border-black/10 
            rounded-2xl 
            shadow-2xl 
            flex flex-col 
            overflow-hidden 
            transition-all duration-300 
            ${noteColor}  {/* 👈 Pass the full string without stripping, to include your new .glass-effect style rules */}
        `}>

                <Header title={noteTitle} noteColor={noteColor} ipcRenderer={ipcRenderer} onUpdateTitle={updateNoteTitle} />

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
                                    <TaskList tasks={tasks} onToggleTask={toggleTask} />
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
