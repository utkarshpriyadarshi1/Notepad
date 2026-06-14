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
import { translations } from './services/i18n';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faXmark, faRotateRight, faQuestionCircle, faBug } from '@fortawesome/free-solid-svg-icons';
import { marked } from 'marked';

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

    // Day/Night Dark Mode state
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('smritipatra_dark_mode') === 'true');

    // Language state
    const [lang, setLang] = useState(() => localStorage.getItem('smritipatra_lang') || 'en');

    // Modals states
    const [logsOpen, setLogsOpen] = useState(false);
    const [logContent, setLogContent] = useState('');
    const [helpOpen, setHelpOpen] = useState(false);
    const [helpGuides, setHelpGuides] = useState([]);
    const [activeHelpGuide, setActiveHelpGuide] = useState('');

    useEffect(() => {
        if (helpOpen && ipcRenderer) {
            ipcRenderer.invoke('read-help-files').then(guides => {
                setHelpGuides(guides || []);
                if (guides && guides.length > 0) {
                    setActiveHelpGuide(guides[0].name);
                }
            });
        }
    }, [helpOpen, ipcRenderer]);

    useEffect(() => {
        localStorage.setItem('smritipatra_lang', lang);
    }, [lang]);

    useEffect(() => {
        localStorage.setItem('smritipatra_dark_mode', isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

    const loadLogs = async () => {
        if (ipcRenderer) {
            const content = await ipcRenderer.invoke('read-log-file');
            setLogContent(content || t('noLogs'));
        }
    };

    useEffect(() => {
        if (logsOpen) {
            loadLogs();
        }
    }, [logsOpen]);

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

    // Helper Method to Safely Append Markdown Text Layout Symbols
    const handleInsertMarkup = (syntax) => {
        updateMarkdown((markdownText || "") + syntax);
    };

    // Enhanced shadow and scale effects on focus and hover
    const isShadowActive = isFocused || isHovered;
    const shadowClass = isShadowActive
        ? "shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-black/15 scale-[0.99] border-black/20"
        : "shadow-[0_4px_12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 scale-100 border-black/10";

    const containerBg = isDarkMode ? 'bg-slate-950 border-zinc-800 text-slate-100' : noteColor;

    return (
        // The outermost parent container must take up 100% of the screen width and height
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full h-screen p-1.5 bg-transparent font-sans antialiased relative transition-all duration-300 ${isDarkMode ? 'dark text-slate-100' : 'text-slate-900'}`}
        >
            <div className={`w-full h-full border rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${containerBg} ${shadowClass}`}>

                <Header
                    title={noteTitle === "New Note" ? t('newNote') : noteTitle}
                    noteColor={noteColor}
                    ipcRenderer={ipcRenderer}
                    onUpdateTitle={updateNoteTitle}
                    alwaysOnTop={alwaysOnTop}
                    onToggleAlwaysOnTop={toggleAlwaysOnTop}
                    onToggleSettings={() => setSettingsOpen(prev => !prev)}
                    onToggleLogs={() => setLogsOpen(prev => !prev)}
                    onToggleHelp={() => setHelpOpen(prev => !prev)}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
                />

                {/* Primary Content Base Board Container Workspace Frame */}
                <div className="flex-1 p-4 flex flex-col overflow-hidden relative">

                    {/* Preferences Layout HUD Switch Panels Modal View Overlay */}
                    <SettingsPanel
                        isOpen={settingsOpen}
                        onClose={() => setSettingsOpen(false)}
                        appName={t('appName')}
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

                        // i18n
                        t={t}
                        lang={lang}
                        setLang={setLang}
                    />

                    {!dbReady ? (
                        <div className="flex-1 flex items-center justify-center text-xs opacity-50 font-bold animate-pulse tracking-wide select-none">
                            {t('initializing')}
                        </div>
                    ) : (
                        <>
                            {/* Dual-Mode Canvas Layer Content Selection Logic Router */}
                            {viewMode === "tasks" ? (
                                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-100">
                                    <TaskForm onAddTask={addTask} t={t} />
                                    <TaskList tasks={tasks} onToggleTask={toggleTask} onDeleteTask={deleteTaskGlobal} t={t} />
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
                                t={t}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Console Log Overlay Modal */}
            {logsOpen && (
                <div style={{WebkitAppRegion: 'no-drag'}} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 z-[60] animate-in fade-in duration-150">
                    <div className="w-[96%] h-[94%] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
                        <div className="px-3 py-2 bg-slate-950 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faTerminal} className="text-sky-500" /> {t('consoleLogs')}
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={loadLogs} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
                                    <FontAwesomeIcon icon={faRotateRight} />
                                </button>
                                <button onClick={() => setLogsOpen(false)} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-3 overflow-auto font-mono text-[9px] whitespace-pre-wrap select-text selection:bg-sky-500/30 selection:text-white">
                            {logContent}
                        </div>
                    </div>
                </div>
            )}

            {/* Help Overlay Modal */}
            {helpOpen && (
                <div style={{WebkitAppRegion: 'no-drag'}} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 z-[60] animate-in fade-in duration-150">
                    <div className="w-[94%] h-[94%] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden text-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-black/5 pb-1 flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faQuestionCircle} className="text-sky-500" /> {t('helpTitle')}
                            </span>
                            <button onClick={() => setHelpOpen(false)} className="text-slate-400 hover:text-slate-650 p-1 cursor-pointer">
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        {helpGuides.length > 0 ? (
                            <>
                                <div className="flex border-b border-black/5 overflow-x-auto scrollbar-none flex-shrink-0 gap-1 pb-1">
                                    {helpGuides.map(guide => (
                                        <button
                                            key={guide.name}
                                            onClick={() => setActiveHelpGuide(guide.name)}
                                            className={`py-1 px-2 border-b-2 font-bold text-[8px] uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                                                activeHelpGuide === guide.name
                                                    ? 'border-sky-500 text-sky-500 bg-sky-50/20'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            } rounded-t-md`}
                                        >
                                            {guide.name.replace(/-/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 overflow-y-auto text-[9.5px] text-slate-600 leading-relaxed select-text pr-1 markdown-body scrollbar-none pt-1">
                                    <div 
                                        className="prose prose-sm max-w-none text-slate-700"
                                        dangerouslySetInnerHTML={{ 
                                            __html: marked.parse(helpGuides.find(g => g.name === activeHelpGuide)?.content || '') 
                                        }} 
                                    />
                                </div>
                            </>
                        ) : (
                            <p className="text-[11px] text-slate-600 leading-relaxed select-text flex-1">
                                {t('helpText')}
                            </p>
                        )}

                        <div className="pt-2 border-t border-black/5 flex flex-col gap-2 flex-shrink-0">
                            <button
                                onClick={() => ipcRenderer && ipcRenderer.send('open-external-link', 'https://github.com/utkarshpriyadarshi1/e-smritipatra/issues')}
                                className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <FontAwesomeIcon icon={faBug} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
