import {useSqliteData} from './hooks/useSqliteData';
import {useDesktopServices} from './hooks/useDesktopServices';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import ActionBar from './components/ActionBar';
import SettingsPanel from './components/SettingsPanel';
import MarkdownToolbar from './components/MarkdownToolbar';
import MarkdownEditor from './components/MarkdownEditor';

export default function App() {
    const {
        db,
        dbReady,
        tasks,
        noteTitle,
        noteColor,
        viewMode,
        markdownText,
        alwaysOnTop,
        addTask,
        toggleTask,
        clearCompleted,
        changeTheme,
        updateNoteTitle,
        toggleViewMode,
        updateMarkdown,
        saveToLocalStorage,
        refreshUiData,
        toggleAlwaysOnTop,
        resetDatabase
    } = useSqliteData();

    const {
        settingsOpen, setSettingsOpen, triggerJsonExport, triggerJsonImport, ipcRenderer
    } = useDesktopServices(db, saveToLocalStorage, refreshUiData);

    const handleInsertMarkup = (syntax) => {
        updateMarkdown((markdownText || "") + syntax);
    };

    return (<div className="w-full h-screen p-3 bg-transparent font-sans antialiased relative">
            <div
                className={`w-full h-full border border-black/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${noteColor.split(' ').slice(0, 3).join(' ')}`}>

                <Header title={noteTitle} noteColor={noteColor} ipcRenderer={ipcRenderer}
                        onUpdateTitle={updateNoteTitle}/>

                <div className="flex-1 p-4 flex flex-col overflow-hidden relative">

                    <SettingsPanel
                        isOpen={settingsOpen}
                        onClose={() => setSettingsOpen(false)}
                        appName="StickyFlow Desktop Core"
                        noteTitle={noteTitle}
                        onUpdateTitle={updateNoteTitle}
                        alwaysOnTop={alwaysOnTop}
                        onToggleAlwaysOnTop={toggleAlwaysOnTop}
                        onResetDatabase={resetDatabase}

                        // NEW PASSTHROUGH CHANNELS FOR SUB-LIST DISPLAY AND STORAGE OPERATIONS
                        tasks={tasks}
                        onToggleTask={toggleTask}
                        onExport={triggerJsonExport}
                        onImport={triggerJsonImport}
                    />

                    {!dbReady ? (<div
                            className="flex-1 flex items-center justify-center text-xs opacity-50 animate-pulse">Initializing
                            SQLite Context...</div>) : (<>
                            {viewMode === "tasks" ? (<div className="flex-1 flex flex-col overflow-hidden">
                                    <TaskForm onAddTask={addTask}/>
                                    <TaskList tasks={tasks} onToggleTask={toggleTask}/>
                                </div>) : (<div className="flex-1 flex flex-col overflow-hidden">
                                    <MarkdownToolbar onInsertMarkup={handleInsertMarkup}/>
                                    <MarkdownEditor text={markdownText} onUpdate={updateMarkdown}/>
                                </div>)}

                            <ActionBar
                                onChangeTheme={changeTheme} onExport={triggerJsonExport} onImport={triggerJsonImport}
                                onClearDone={clearCompleted} hasTasks={tasks.length > 0} viewMode={viewMode}
                                onToggleView={toggleViewMode} onOpenSettings={() => setSettingsOpen(true)}
                            />
                        </>)}
                </div>
            </div>
        </div>);
}
