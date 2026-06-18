import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFilePen, 
    faFolder, 
    faFolderOpen, 
    faTrashCan, 
    faPen, 
    faEye, 
    faEyeSlash, 
    faPlus, 
    faCheck, 
    faPalette, 
    faThumbtack, 
    faFileExport, 
    faCheckDouble, 
    faFileLines, 
    faListCheck 
} from '@fortawesome/free-solid-svg-icons';
import { persistDatabaseToDisk } from '../../hooks/sqlite/dbController';
import MarkdownToolbar from '../MarkdownToolbar';
import MarkdownEditor from '../MarkdownEditor';
import TaskForm from '../TaskForm';
import TaskList from '../TaskList';

const electron = window.require ? window.require('electron') : null;

export default function WidgetTab({
    allWidgets,
    currentWidgetId,
    onRenameWidget,
    onChangeWidgetTheme,
    onDeleteWidget,
    onFocusWidget,
    onCreateWidget,
    onExportWidget,

    allFolders,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onCreateWidgetInFolder,
    db,
    onTriggerRefresh,
    t
}) {
    const [activeFolderUuid, setActiveFolderUuid] = useState('folder_1');
    const [selectedWidgetUuid, setSelectedWidgetUuid] = useState(currentWidgetId || null);

    const [editingFolderUuid, setEditingFolderUuid] = useState(null);
    const [folderRenameVal, setFolderRenameVal] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [editingWidgetUuid, setEditingWidgetUuid] = useState(null);
    const [widgetRenameVal, setWidgetRenameVal] = useState("");
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");

    const [activeThemeMenu, setActiveThemeMenu] = useState(null);

    // Selected Widget Local Content Cache States
    const [tasks, setTasks] = useState([]);
    const [markdownText, setMarkdownText] = useState("");

    const colors = ['glass', 'yellow', 'pink', 'blue', 'green'];
    const bgClasses = {
        glass: 'bg-gradient-to-br from-white/80 via-slate-100/50 to-white/30 border border-slate-300',
        yellow: 'bg-amber-400',
        pink: 'bg-rose-400',
        blue: 'bg-sky-400',
        green: 'bg-emerald-400'
    };
    
    const headerBgColorClasses = {
        glass: 'bg-slate-200/55',
        yellow: 'bg-amber-100',
        pink: 'bg-rose-100',
        blue: 'bg-sky-100',
        green: 'bg-emerald-100'
    };

    const [windowsState, setWindowsState] = useState({});

    // Fetch and Sync all open windows visibility/pin status
    const refreshWindowsState = async () => {
        if (electron) {
            try {
                const states = await electron.ipcRenderer.invoke('get-windows-state');
                setWindowsState(states || {});
            } catch (err) {
                console.error("Failed to query windows state:", err);
            }
        }
    };

    useEffect(() => {
        refreshWindowsState();

        if (electron) {
            const handler = () => refreshWindowsState();
            electron.ipcRenderer.on('db-updated', handler);
            electron.ipcRenderer.on('window-moved', handler);
            electron.ipcRenderer.on('window-state-updated', handler);
            return () => {
                electron.ipcRenderer.removeListener('db-updated', handler);
                electron.ipcRenderer.removeListener('window-moved', handler);
                electron.ipcRenderer.removeListener('window-state-updated', handler);
            };
        }
    }, []);

    // Folder select guard
    useEffect(() => {
        if (allFolders.length > 0) {
            const exists = allFolders.some(f => f.uuid === activeFolderUuid);
            if (!exists) {
                setActiveFolderUuid(allFolders[0].uuid);
            }
        }
    }, [allFolders, activeFolderUuid]);

    // Note select guard
    useEffect(() => {
        if (allWidgets.length > 0) {
            const folderWidgets = allWidgets.filter(w => w.parentFolderUuid === activeFolderUuid);
            if (folderWidgets.length > 0) {
                const exists = folderWidgets.some(w => w.uuid === selectedWidgetUuid);
                if (!exists) {
                    setSelectedWidgetUuid(folderWidgets[0].uuid);
                }
            } else {
                setSelectedWidgetUuid(null);
            }
        } else {
            setSelectedWidgetUuid(null);
        }
    }, [allWidgets, activeFolderUuid, selectedWidgetUuid]);

    // Query and update tasks & markdown text cache for the selected widget
    useEffect(() => {
        if (db && selectedWidgetUuid) {
            try {
                const res = db.exec("SELECT item_uuid, item_text_payload, is_marked_completed FROM task_items WHERE parent_widget_uuid = ?", [selectedWidgetUuid]);
                if (res && res.length > 0 && res[0].values) {
                    setTasks(res[0].values.map(row => ({
                        id: row[0],
                        text: row[1],
                        done: row[2] === 1
                    })));
                } else {
                    setTasks([]);
                }

                const mdRes = db.exec("SELECT widget_markdown_content FROM sticky_widgets WHERE widget_uuid = ?", [selectedWidgetUuid]);
                if (mdRes && mdRes.length > 0 && mdRes[0].values) {
                    setMarkdownText(mdRes[0].values[0][0] || "");
                } else {
                    setMarkdownText("");
                }
            } catch (err) {
                console.error("Failed to query selected widget contents:", err);
            }
        }
    }, [db, selectedWidgetUuid, allWidgets]);

    const activeFolder = allFolders.find(f => f.uuid === activeFolderUuid);
    const selectedWidget = allWidgets.find(w => w.uuid === selectedWidgetUuid);
    const folderWidgets = allWidgets.filter(w => w.parentFolderUuid === activeFolderUuid);

    const startFolderRename = (f) => {
        setEditingFolderUuid(f.uuid);
        setFolderRenameVal(f.name);
    };

    const commitFolderRename = (uuid) => {
        if (folderRenameVal.trim()) {
            onRenameFolder(uuid, folderRenameVal.trim());
        }
        setEditingFolderUuid(null);
    };

    const startWidgetRename = (w) => {
        setEditingWidgetUuid(w.uuid);
        setWidgetRenameVal(w.title);
    };

    const commitWidgetRename = (uuid) => {
        if (widgetRenameVal.trim()) {
            onRenameWidget(uuid, widgetRenameVal.trim());
        }
        setEditingWidgetUuid(null);
    };

    // Selected Widget Local Editing Operations
    const handleAddTask = (text) => {
        if (!text.trim() || !selectedWidgetUuid) return;
        db.run("INSERT INTO task_items (item_uuid, parent_widget_uuid, item_text_payload, is_marked_completed) VALUES (?, ?, ?, 0)", ["task_" + Date.now(), selectedWidgetUuid, text.trim()]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    const handleToggleTask = (taskId, currentDone) => {
        db.run("UPDATE task_items SET is_marked_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE item_uuid = ?", [currentDone ? 0 : 1, taskId]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    const handleDeleteTask = (taskId) => {
        db.run("DELETE FROM task_items WHERE item_uuid = ?", [taskId]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    const handleClearCompleted = () => {
        db.run("DELETE FROM task_items WHERE is_marked_completed = 1 AND parent_widget_uuid = ?", [selectedWidgetUuid]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    const handleUpdateMarkdown = (text) => {
        setMarkdownText(text);
        db.run("UPDATE sticky_widgets SET widget_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [text, selectedWidgetUuid]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    const handleToggleViewMode = () => {
        if (!selectedWidget) return;
        const nextMode = selectedWidget.viewMode === "tasks" ? "markdown" : "tasks";
        db.run("UPDATE sticky_widgets SET widget_view_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [nextMode, selectedWidgetUuid]);
        persistDatabaseToDisk(electron ? electron.ipcRenderer : null, db);
        onTriggerRefresh();
    };

    // Note Window control actions (Pin/Show/Hide)
    const handleTogglePin = (uuid) => {
        if (!electron) return;
        const state = windowsState[uuid];
        const nextPin = !state?.pinned;

        if (db) {
            db.run("UPDATE sticky_widgets SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE widget_uuid = ?", [nextPin ? 1 : 0, uuid]);
            persistDatabaseToDisk(electron.ipcRenderer, db);
        }

        if (!state || !state.visible) {
            electron.ipcRenderer.send('focus-widget-window', uuid);
        }
        electron.ipcRenderer.send('set-widget-always-on-top', uuid, nextPin);
        onTriggerRefresh();
    };

    const handleShow = (uuid) => {
        if (electron) {
            electron.ipcRenderer.send('focus-widget-window', uuid);
        }
    };

    const handleHide = (uuid) => {
        if (electron) {
            electron.ipcRenderer.send('hide-widget-window', uuid);
        }
    };

    return (
        <div className="flex-1 flex min-h-0 bg-slate-50/30 text-xs">
            {/* COLUMN 1: Notebook Folders (22% width) */}
            <div className="w-[22%] border-r border-black/5 bg-slate-50 flex flex-col p-3 min-h-0 justify-between select-none">
                <div className="flex flex-col min-h-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5 block">
                        {t('folders')}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none pr-0.5">
                        {allFolders.map(f => {
                            const isFolderActive = f.uuid === activeFolderUuid;
                            return (
                                <div
                                    key={f.uuid}
                                    onClick={() => setActiveFolderUuid(f.uuid)}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                                        isFolderActive
                                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                                            : 'text-slate-600 hover:bg-black/5 font-medium'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <FontAwesomeIcon icon={isFolderActive ? faFolderOpen : faFolder} className="text-xs opacity-75" />
                                        {editingFolderUuid === f.uuid ? (
                                            <input
                                                type="text"
                                                value={folderRenameVal}
                                                onChange={e => setFolderRenameVal(e.target.value)}
                                                onBlur={() => commitFolderRename(f.uuid)}
                                                onKeyDown={e => e.key === 'Enter' && commitFolderRename(f.uuid)}
                                                maxLength={20}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                                className="w-full bg-slate-700 text-white rounded px-1 py-0.2 text-[10px] focus:outline-none"
                                            />
                                        ) : (
                                            <span className="truncate max-w-[80px]">{f.uuid === 'folder_1' ? t('myNotebook') : f.name}</span>
                                        )}
                                    </div>
                                    {editingFolderUuid !== f.uuid && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startFolderRename(f); }}
                                                className={`p-0.5 rounded ${isFolderActive ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-500'}`}
                                            >
                                                <FontAwesomeIcon icon={faPen} className="text-[8px]" />
                                            </button>
                                            {f.uuid !== 'folder_1' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirm(t('deleteFolder') + "?") && onDeleteFolder(f.uuid);
                                                    }}
                                                    className={`p-0.5 rounded ${isFolderActive ? 'hover:bg-white/10 text-red-300' : 'hover:bg-rose-50 text-rose-500'}`}
                                                >
                                                    <FontAwesomeIcon icon={faTrashCan} className="text-[8px]" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* New Folder Action Button */}
                <div className="pt-2 border-t border-black/5 flex-shrink-0">
                    {isCreatingFolder ? (
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            placeholder={t('folderName') + "..."}
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    if (newFolderName.trim()) onCreateFolder(newFolderName.trim());
                                    setNewFolderName("");
                                    setIsCreatingFolder(false);
                                }
                                if (e.key === 'Escape') setIsCreatingFolder(false);
                             }}
                            onBlur={() => setIsCreatingFolder(false)}
                            className="w-full text-[10px] px-2 py-1 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-slate-800"
                        />
                    ) : (
                        <button
                            onClick={() => setIsCreatingFolder(true)}
                            className="w-full py-1.5 border border-dashed border-black/15 hover:border-slate-800 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>
            </div>

            {/* COLUMN 2: Notes / Widgets list (28% width) */}
            <div className="w-[28%] border-r border-black/5 bg-white flex flex-col p-3 min-h-0 justify-between select-none">
                <div className="flex flex-col min-h-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5 block">
                        {t('widgets')}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-none">
                        {folderWidgets.map(w => {
                            const isNoteSelected = w.uuid === selectedWidgetUuid;
                            const isVisible = !!windowsState[w.uuid]?.visible;
                            const isPinned = w.isPinned;

                            return (
                                <div
                                    key={w.uuid}
                                    onClick={() => setSelectedWidgetUuid(w.uuid)}
                                    className={`p-2.5 border rounded-lg transition-all flex flex-col gap-1.5 cursor-pointer ${
                                        isNoteSelected
                                            ? 'border-slate-800 bg-slate-50 shadow-sm'
                                            : 'border-black/5 hover:border-black/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {/* Note Theme Picker Icon */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveThemeMenu(activeThemeMenu === w.uuid ? null : w.uuid); }}
                                                    className={`w-3.5 h-3.5 rounded-full border border-black/10 cursor-pointer shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${
                                                        bgClasses[w.theme] || 'bg-slate-200'
                                                    }`}
                                                >
                                                    <FontAwesomeIcon icon={faPalette} className="text-[6px] text-white/50" />
                                                </button>
                                                {activeThemeMenu === w.uuid && (
                                                    <div className="absolute bottom-full left-0 pb-1.5 z-50">
                                                        <div className="bg-white/95 backdrop-blur-md shadow-xl border border-black/10 rounded-full px-2 py-1 flex gap-1.5">
                                                            {colors.map(c => (
                                                                <button
                                                                    key={c}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onChangeWidgetTheme(w.uuid, c);
                                                                        setActiveThemeMenu(null);
                                                                    }}
                                                                    className={`w-3 h-3 rounded-full ${bgClasses[c]} border border-black/10 cursor-pointer hover:scale-110 transition-transform`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {editingWidgetUuid === w.uuid ? (
                                                <input
                                                    type="text"
                                                    value={widgetRenameVal}
                                                    onChange={e => setWidgetRenameVal(e.target.value)}
                                                    onBlur={() => commitWidgetRename(w.uuid)}
                                                    onKeyDown={e => e.key === 'Enter' && commitWidgetRename(w.uuid)}
                                                    maxLength={20}
                                                    autoFocus
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-[100px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                                                />
                                            ) : (
                                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
                                                    {w.title === 'New Note' ? t('newNote') : w.title}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex items-center justify-between border-t border-black/5 pt-1.5 text-slate-450">
                                        <span className="text-[8px] font-semibold select-text font-mono truncate max-w-[80px]">
                                            ID: {w.uuid}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {/* Pin button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTogglePin(w.uuid); }}
                                                className={`p-0.5 hover:bg-black/5 rounded cursor-pointer ${isPinned ? 'text-indigo-600' : 'text-slate-400'}`}
                                            >
                                                <FontAwesomeIcon icon={faThumbtack} className="text-[8px]" />
                                            </button>

                                            {/* Show / Hide */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); isVisible ? handleHide(w.uuid) : handleShow(w.uuid); }}
                                                className="p-0.5 hover:bg-black/5 rounded cursor-pointer text-slate-400"
                                            >
                                                <FontAwesomeIcon icon={isVisible ? faEyeSlash : faEye} className="text-[8px]" />
                                            </button>

                                            {/* Rename */}
                                            {editingWidgetUuid !== w.uuid && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startWidgetRename(w); }}
                                                    className="p-0.5 hover:bg-black/5 rounded cursor-pointer text-slate-400"
                                                >
                                                    <FontAwesomeIcon icon={faPen} className="text-[8px]" />
                                                </button>
                                            )}

                                            {/* Export */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onExportWidget(w.uuid, w.title); }}
                                                className="p-0.5 hover:bg-black/5 rounded cursor-pointer text-slate-400"
                                            >
                                                <FontAwesomeIcon icon={faFileExport} className="text-[8px]" />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirm(t('deleteWidget') + "?") && onDeleteWidget(w.uuid);
                                                }}
                                                className="p-0.5 hover:bg-black/5 rounded cursor-pointer text-slate-400 hover:text-rose-500"
                                            >
                                                <FontAwesomeIcon icon={faTrashCan} className="text-[8px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* New Note Action Button */}
                <div className="pt-2 border-t border-black/5 flex-shrink-0">
                    {isCreatingNote ? (
                        <input
                            type="text"
                            value={newNoteTitle}
                            onChange={e => setNewNoteTitle(e.target.value)}
                            placeholder={t('widgetTitle') + "..."}
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    if (newNoteTitle.trim()) onCreateWidgetInFolder(activeFolderUuid, newNoteTitle.trim());
                                    setNewNoteTitle("");
                                    setIsCreatingNote(false);
                                }
                                if (e.key === 'Escape') setIsCreatingNote(false);
                            }}
                            onBlur={() => setIsCreatingNote(false)}
                            className="w-full text-[10px] px-2 py-1 bg-slate-50 border border-black/10 rounded-lg focus:outline-none focus:border-slate-800"
                        />
                    ) : (
                        <button
                            onClick={() => setIsCreatingNote(true)}
                            className="w-full py-1.5 border border-dashed border-black/15 hover:border-slate-800 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1 transition-colors"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    )}
                </div>
            </div>

            {/* COLUMN 3: Note Editor (50% width) */}
            <div className="flex-1 bg-slate-100/30 flex flex-col p-4 overflow-hidden min-h-0 select-text">
                {!selectedWidget ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60 gap-1.5">
                        <FontAwesomeIcon icon={faFilePen} className="text-3xl" />
                        <span className="font-semibold text-[10px] uppercase tracking-wider">
                            {t('selectTheme')}
                        </span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Editor Header Details Card */}
                        <div className={`p-3 border border-black/10 rounded-xl mb-3 flex items-center justify-between ${headerBgColorClasses[selectedWidget.theme] || 'bg-slate-50'}`}>
                            <div className="flex-1 min-w-0 flex flex-col">
                                <span className="font-extrabold uppercase tracking-widest text-[7px] text-slate-400 select-none">
                                    {t('widgets')}
                                </span>
                                <span className="text-[13px] font-bold text-slate-800 truncate select-all">
                                    {selectedWidget.title === 'New Note' ? t('newNote') : selectedWidget.title}
                                </span>
                            </div>

                            {/* Column 3 header actions */}
                            <div className="flex items-center gap-2">
                                {/* Mode toggle switcher */}
                                <button
                                    onClick={handleToggleViewMode}
                                    className="px-2 py-1 bg-white border border-black/10 hover:bg-slate-50 rounded-lg text-[9px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                >
                                    <FontAwesomeIcon icon={selectedWidget.viewMode === 'tasks' ? faFileLines : faListCheck} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Layout Mount Zone */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {selectedWidget.viewMode === "tasks" ? (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <TaskForm onAddTask={handleAddTask} t={t} />
                                    <TaskList 
                                        tasks={tasks} 
                                        onToggleTask={(taskId, currentDone) => handleToggleTask(taskId, currentDone)} 
                                        onDeleteTask={(taskId) => handleDeleteTask(taskId)} 
                                        t={t}
                                    />
                                    {tasks.length > 0 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-black/5 flex justify-end select-none">
                                            <button
                                                onClick={handleClearCompleted}
                                                className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full text-[13px] cursor-pointer flex items-center justify-center text-slate-900 font-bold"
                                            >
                                                <FontAwesomeIcon icon={faCheckDouble} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <MarkdownToolbar onInsertMarkup={(syntax) => handleUpdateMarkdown(markdownText + syntax)} />
                                    <MarkdownEditor text={markdownText} onUpdate={(text) => handleUpdateMarkdown(text)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
