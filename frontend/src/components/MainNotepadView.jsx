import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    faPalette, 
    faThumbtack, 
    faFileExport, 
    faCheckDouble, 
    faListCheck,
    faFileLines,
    faMinus,
    faExpand,
    faXmark,
    faUpRightFromSquare,
    faGear,
    faClock,
    faTag,
    faHistory,
    faFlag,
    faArrowUp,
    faArrowDown,
    faChevronLeft,
    faChevronRight,
    faChevronDown,
    faSort,
    faSearch,
    faSun,
    faMoon,
    faCircleQuestion,
    faFileCsv,
    faFileCode,
    faDatabase,
    faColumns,
    faPlay
} from '@fortawesome/free-solid-svg-icons';
import { persistDatabaseToDisk } from '../hooks/sqlite/dbController';
import GenericEditorWorkspace from './GenericEditorWorkspace';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import EventForm from './EventForm';
import EventList from './EventList';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import SettingsPanel from './SettingsPanel';
import VCSHistoryPanel from './VCSHistoryPanel';
import HelpModal from './HelpModal';
import DiffViewerModal from './DiffViewerModal';


const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return "";
    try {
        const date = new Date(dateStr.replace(' ', 'T') + 'Z');
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return "";
    }
};

export default function MainNotepadView({
    allNotes,
    allFolders,
    db,
    onTriggerRefresh,
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
    toggleNoteFlag,
    swapNotesOrder,
    onToggleNotePin,
    
    // Settings props
    settingsOpen,
    setSettingsOpen,
    resetDatabase,
    triggerJsonExport,
    triggerJsonImport,
    serviceStatus,
    handleServiceAction,
    
    // Global Task CRUD for Data Hub
    toggleTask,
    deleteTaskGlobal,
    renameTaskGlobal,
    exportSingleTask,
    
    // Day/Night mode props
    isDarkMode,
    onToggleDarkMode,
    
    // Preferences
    editorPrefs,
    onUpdateEditorPrefs,
    
    savedOpenUuids,
    savedSelectedUuid,
    onSaveLayoutState,
    
    ipcRenderer
}) {
    const [activeFolderUuid, setActiveFolderUuid] = useState('folder_1');
    const [selectedNoteUuid, setSelectedNoteUuid] = useState(null);
    const [showVcsPanel, setShowVcsPanel] = useState(false);
    const [editorMenuOpen, setEditorMenuOpen] = useState(false);
    const [compareOpen, setCompareOpen] = useState(false);
    const [activeFolderPaletteUuid, setActiveFolderPaletteUuid] = useState(null);
    const [activeNotePaletteUuid, setActiveNotePaletteUuid] = useState(null);
    const [sqlResult, setSqlResult] = useState(null);
    const [sqlModalOpen, setSqlModalOpen] = useState(false);
    const [isOpenTabsMenuOpen, setIsOpenTabsMenuOpen] = useState(false);
    const [tabSearchQuery, setTabSearchQuery] = useState('');

    // Unified sidebar states
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({ 'folder_1': true });

    const handleExpandAllFolders = () => {
        const expanded = {};
        allFolders.forEach(f => {
            expanded[f.uuid] = true;
        });
        setExpandedFolders(expanded);
    };

    const handleCollapseAllFolders = () => {
        setExpandedFolders({});
    };

    // Open Document Tabs
    const [openNoteUuids, setOpenNoteUuids] = useState([]);

    // Mouse drag resize handler for unified Explorer sidebar
    const handleSidebarResizeStart = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(180, Math.min(500, startWidth + deltaX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const getEditorModeFromTitle = (title) => {
        if (!title) return 'md';
        const parts = title.split('.');
        if (parts.length > 1) {
            const ext = parts[parts.length - 1].toLowerCase();
            const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml', 'b64'];
            if (supported.includes(ext)) {
                return ext === 'yaml' ? 'yml' : ext;
            }
        }
        return 'md';
    };

    const getFileIcon = (title) => {
        const mode = getEditorModeFromTitle(title);
        switch (mode) {
            case 'todo':
            case 'list':
                return faListCheck;
            case 'sql':
                return faDatabase;
            case 'properties':
            case 'yml':
            case 'yaml':
                return faGear;
            case 'java':
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
            case 'html':
            case 'css':
            case 'json':
            case 'xml':
                return faFileCode;
            default:
                return faFileLines;
        }
    };

    const getFileIconColorClass = (title, isSelected) => {
        if (isSelected) return 'text-indigo-600 dark:text-indigo-400';
        const mode = getEditorModeFromTitle(title);
        switch (mode) {
            case 'todo':
            case 'list':
                return 'text-emerald-500 dark:text-emerald-400';
            case 'sql':
                return 'text-amber-500 dark:text-amber-400';
            case 'properties':
            case 'yml':
            case 'yaml':
                return 'text-orange-500 dark:text-orange-400';
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
                return 'text-sky-500 dark:text-sky-400';
            case 'html':
            case 'css':
                return 'text-pink-500 dark:text-pink-400';
            case 'json':
            case 'xml':
                return 'text-purple-500 dark:text-purple-400';
            case 'log':
                return 'text-rose-500 dark:text-rose-400';
            case 'xpnc':
                return 'text-indigo-500 dark:text-indigo-400';
            default:
                return 'text-slate-400 dark:text-slate-550';
        }
    };

    const folderColorClasses = {
        indigo: 'text-indigo-500 dark:text-indigo-400',
        rose: 'text-rose-500 dark:text-rose-400',
        amber: 'text-amber-500 dark:text-amber-400',
        emerald: 'text-emerald-500 dark:text-emerald-400',
        sky: 'text-sky-500 dark:text-sky-400',
        violet: 'text-violet-500 dark:text-violet-400'
    };

    const getNoteClasses = (n, isSelected) => {
        const theme = n.theme || 'yellow';
        const themeMap = {
            red: 'rose',
            pink: 'rose',
            yellow: 'amber',
            blue: 'sky',
            green: 'emerald',
            indigo: 'indigo',
            rose: 'rose',
            amber: 'amber',
            emerald: 'emerald',
            sky: 'sky',
            violet: 'violet'
        };
        const key = themeMap[theme] || 'indigo';

        const selectedStyles = {
            rose: 'bg-rose-500/25 border-rose-500/30 text-rose-800 dark:text-rose-200 font-semibold shadow-xs border-l-2 border-l-rose-500',
            amber: 'bg-amber-500/25 border-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold shadow-xs border-l-2 border-l-amber-500',
            sky: 'bg-sky-500/25 border-sky-500/30 text-sky-850 dark:text-sky-200 font-semibold shadow-xs border-l-2 border-l-sky-500',
            emerald: 'bg-emerald-500/25 border-emerald-500/30 text-emerald-850 dark:text-emerald-200 font-semibold shadow-xs border-l-2 border-l-emerald-500',
            indigo: 'bg-indigo-500/25 border-indigo-500/30 text-indigo-850 dark:text-indigo-200 font-semibold shadow-xs border-l-2 border-l-indigo-500',
            violet: 'bg-violet-500/25 border-violet-500/30 text-violet-850 dark:text-violet-200 font-semibold shadow-xs border-l-2 border-l-violet-500'
        };

        const unselectedStyles = {
            rose: 'bg-rose-500/10 hover:bg-rose-500/18 border-transparent hover:border-rose-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white',
            amber: 'bg-amber-500/10 hover:bg-amber-500/18 border-transparent hover:border-amber-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white',
            sky: 'bg-sky-500/10 hover:bg-sky-500/18 border-transparent hover:border-sky-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white',
            emerald: 'bg-emerald-500/10 hover:bg-emerald-500/18 border-transparent hover:border-emerald-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white',
            indigo: 'bg-indigo-500/10 hover:bg-indigo-500/18 border-transparent hover:border-indigo-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white',
            violet: 'bg-violet-500/10 hover:bg-violet-500/18 border-transparent hover:border-violet-500/20 text-slate-655 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
        };

        if (isSelected) {
            return selectedStyles[key] || selectedStyles.indigo;
        } else {
            return unselectedStyles[key] || unselectedStyles.indigo;
        }
    };

    const getTabClasses = (tabNote, isActive) => {
        const theme = tabNote.theme || 'yellow';
        
        // Map themes to normalized keys for simple CSS building
        const themeMap = {
            red: 'rose',
            pink: 'rose',
            yellow: 'amber',
            blue: 'sky',
            green: 'emerald',
            indigo: 'indigo',
            rose: 'rose',
            amber: 'amber',
            emerald: 'emerald',
            sky: 'sky',
            violet: 'violet'
        };
        const key = themeMap[theme] || 'indigo';

        // Background, Border, Text classes for dynamic premium tabs
        const styles = {
            indigo: {
                darkActive: 'bg-indigo-900/80 border-indigo-750 text-indigo-100 shadow-sm',
                darkInactive: 'bg-indigo-950/40 border-transparent text-indigo-350 hover:bg-indigo-900/40 hover:text-indigo-200',
                lightActive: 'bg-indigo-200 border-indigo-300 text-indigo-900 shadow-sm',
                lightInactive: 'bg-indigo-100/50 border-transparent text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900'
            },
            rose: {
                darkActive: 'bg-rose-900/80 border-rose-750 text-rose-100 shadow-sm',
                darkInactive: 'bg-rose-955/40 border-transparent text-rose-350 hover:bg-rose-900/40 hover:text-rose-200',
                lightActive: 'bg-rose-200 border-rose-300 text-rose-900 shadow-sm',
                lightInactive: 'bg-rose-100/50 border-transparent text-rose-700 hover:bg-rose-100 hover:text-rose-900'
            },
            amber: {
                darkActive: 'bg-amber-900/80 border-amber-750 text-amber-100 shadow-sm',
                darkInactive: 'bg-amber-955/40 border-transparent text-amber-400/80 hover:bg-amber-900/40 hover:text-amber-200',
                lightActive: 'bg-amber-200 border-amber-300 text-amber-900 shadow-sm',
                lightInactive: 'bg-amber-100/50 border-transparent text-amber-700 hover:bg-amber-100 hover:text-amber-900'
            },
            emerald: {
                darkActive: 'bg-emerald-900/80 border-emerald-750 text-emerald-100 shadow-sm',
                darkInactive: 'bg-emerald-955/40 border-transparent text-emerald-350 hover:bg-emerald-900/40 hover:text-emerald-200',
                lightActive: 'bg-emerald-200 border-emerald-300 text-emerald-900 shadow-sm',
                lightInactive: 'bg-emerald-100/50 border-transparent text-emerald-700 hover:bg-emerald-100/40 hover:text-emerald-900'
            },
            sky: {
                darkActive: 'bg-sky-900/80 border-sky-750 text-sky-100 shadow-sm',
                darkInactive: 'bg-sky-955/40 border-transparent text-sky-350 hover:bg-sky-900/40 hover:text-sky-200',
                lightActive: 'bg-sky-200 border-sky-300 text-sky-900 shadow-sm',
                lightInactive: 'bg-sky-100/50 border-transparent text-sky-700 hover:bg-sky-100 hover:text-sky-900'
            },
            violet: {
                darkActive: 'bg-violet-900/80 border-violet-750 text-violet-100 shadow-sm',
                darkInactive: 'bg-violet-955/40 border-transparent text-violet-350 hover:bg-violet-900/40 hover:text-violet-200',
                lightActive: 'bg-violet-200 border-violet-300 text-violet-900 shadow-sm',
                lightInactive: 'bg-violet-100/50 border-transparent text-violet-700 hover:bg-violet-100 hover:text-violet-800'
            }
        };

        const currentStyle = styles[key] || styles.indigo;
        if (isDarkMode) {
            return isActive ? currentStyle.darkActive : currentStyle.darkInactive;
        } else {
            return isActive ? currentStyle.lightActive : currentStyle.lightInactive;
        }
    };

    const handleTabBarWheel = (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    const getContextLabel = (filename) => {
        const ext = getEditorModeFromTitle(filename);
        const labelMap = {
            md: 'Markdown Actions',
            todo: 'Checklist Actions',
            list: 'Checklist Actions',
            log: 'Logging Actions',
            xpnc: 'Expense Actions',
            sql: 'SQL Database Actions',
            js: 'JavaScript Actions',
            jsx: 'React Component Actions',
            json: 'JSON Actions',
            html: 'HTML Markup Actions',
            css: 'CSS Styling Actions'
        };
        return labelMap[ext] || `${ext.toUpperCase()} Actions`;
    };

    const handleUpdateFolderColor = (folderUuid, color) => {
        if (!db) return;
        try {
            db.run("UPDATE sticky_folders SET folder_color = ? WHERE folder_uuid = ?", [color, folderUuid]);
            persistDatabaseToDisk(ipcRenderer, db);
            onTriggerRefresh();
        } catch (e) {
            console.error("Failed to update folder color:", e);
        }
    };

    const handleExecuteSqlQuery = () => {
        if (!db || !selectedNote) return;
        
        let queryText = latestContentRef.current || markdownText || '';
        queryText = queryText.trim();
        if (!queryText) {
            setSqlResult({
                columns: [],
                rows: [],
                error: 'SQL script is empty. Please enter a valid SQL command.',
                rowsAffected: 0
            });
            setSqlModalOpen(true);
            return;
        }

        try {
            const results = db.exec(queryText);
            let rowsModified = 0;
            try {
                rowsModified = db.getRowsModified();
            } catch (err) {
                console.warn("Could not get modified rows:", err);
            }

            if (results && results.length > 0) {
                const lastResult = results[results.length - 1];
                setSqlResult({
                    columns: lastResult.columns || [],
                    rows: lastResult.values || [],
                    error: null,
                    rowsAffected: rowsModified
                });
            } else {
                setSqlResult({
                    columns: [],
                    rows: [],
                    error: null,
                    rowsAffected: rowsModified,
                    successMessage: 'SQL script executed successfully.'
                });
            }
            persistDatabaseToDisk(ipcRenderer, db);
            onTriggerRefresh();
        } catch (error) {
            setSqlResult({
                columns: [],
                rows: [],
                error: error.message || 'An error occurred during query execution.',
                rowsAffected: 0
            });
        }
        setSqlModalOpen(true);
    };

    const [editingFolderUuid, setEditingFolderUuid] = useState(null);
    const [folderRenameVal, setFolderRenameVal] = useState("");

    const [editingNoteUuid, setEditingNoteUuid] = useState(null);
    const [noteRenameVal, setNoteRenameVal] = useState("");

    const fileInputRef = useRef(null);

    const handleAutoCreateFolder = async () => {
        const baseFolderName = editorPrefs?.defaultFolderName || 'Notebook';
        let index = 1;
        while (allFolders.some(f => f.name.toLowerCase() === `${baseFolderName.toLowerCase()} ${index}`)) {
            index++;
        }
        const folderName = `${baseFolderName} ${index}`;
        const newUuid = onCreateFolder(folderName);
        if (newUuid) {
            setActiveFolderUuid(newUuid);
        }
    };

    const handleAutoCreateNote = async (folderUuid = activeFolderUuid) => {
        const baseFileName = editorPrefs?.defaultFileName || 'Note';
        const defaultExt = editorPrefs?.defaultFileType || 'md';
        let index = 1;
        while (allNotes.some(n => n.title.toLowerCase() === `${baseFileName.toLowerCase()} ${index}.${defaultExt}`)) {
            index++;
        }
        const finalTitle = `${baseFileName} ${index}.${defaultExt}`;
        const newNoteUuid = onCreateNoteInFolder(folderUuid, finalTitle);
        if (newNoteUuid) {
            setSelectedNoteUuid(newNoteUuid);
            setActiveFolderUuid(folderUuid);
        }
    };

    const handleOpenWorkspaceFolder = async () => {
        if (ipcRenderer) {
            await ipcRenderer.invoke('open-workspace-folder-dialog');
        }
    };

    const handleOpenFileSelection = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleOpenFileInputChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        let lastImportedUuid = null;
        for (const file of files) {
            const uuid = await handleImportFile(file, activeFolderUuid);
            if (uuid) lastImportedUuid = uuid;
        }
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
        if (lastImportedUuid) {
            setSelectedNoteUuid(lastImportedUuid);
        }
    };

    const [activeThemeMenu, setActiveThemeMenu] = useState(null);
    const [activeExportMenuNoteUuid, setActiveExportMenuNoteUuid] = useState(null);
    const [activeFolderExportMenuUuid, setActiveFolderExportMenuUuid] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatchedUuids, setSearchMatchedUuids] = useState(null);
    const [sortBy, setSortBy] = useState('custom');
    const [isDraggingOverNotes, setIsDraggingOverNotes] = useState(false);
    const [draggingOverFolderUuid, setDraggingOverFolderUuid] = useState(null);

    // Help Open State
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Selected Note Local Content Cache States
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [markdownText, setMarkdownText] = useState("");
    const [windowsState, setWindowsState] = useState({});

    const saveTimeoutRef = useRef(null);
    const prevSelectedNoteUuidRef = useRef(selectedNoteUuid);
    const latestContentRef = useRef(markdownText);

    // Sync latestContentRef on markdown changes
    useEffect(() => {
        latestContentRef.current = markdownText;
    }, [markdownText]);

    // Flush any pending save before note selection changes
    useEffect(() => {
        if (prevSelectedNoteUuidRef.current !== selectedNoteUuid) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                // Flush immediately
                if (db && prevSelectedNoteUuidRef.current) {
                    try {
                        db.run("UPDATE sticky_notes SET note_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [latestContentRef.current, prevSelectedNoteUuidRef.current]);
                        persistDatabaseToDisk(ipcRenderer, db);
                        onTriggerRefresh();

                        const targetNote = allNotes.find(n => n.uuid === prevSelectedNoteUuidRef.current);
                        if (targetNote && targetNote.localFilePath && editorPrefs.enableLocalFileAutoSync !== false && ipcRenderer) {
                            lastWrittenContentsRef.current[prevSelectedNoteUuidRef.current] = latestContentRef.current;
                            ipcRenderer.invoke('write-local-file', targetNote.localFilePath, latestContentRef.current);
                        }
                    } catch (err) {
                        console.error("Failed to flush note contents on switch:", err);
                    }
                }
            }
            prevSelectedNoteUuidRef.current = selectedNoteUuid;
        }
    }, [selectedNoteUuid, db, onTriggerRefresh, ipcRenderer, allNotes, editorPrefs.enableLocalFileAutoSync]);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Restore layout state once database boots and layout is loaded
    const layoutRestoredRef = useRef(false);
    const prevLayoutRef = useRef({ openNoteUuids: [], selectedNoteUuid: null });

    useEffect(() => {
        if (!layoutRestoredRef.current && allNotes.length > 0) {
            const noteUuids = allNotes.map(n => n.uuid);
            if (savedOpenUuids && savedOpenUuids.length > 0) {
                const validOpenUuids = savedOpenUuids.filter(id => noteUuids.includes(id));
                setOpenNoteUuids(validOpenUuids);

                let targetSelected = null;
                if (savedSelectedUuid && noteUuids.includes(savedSelectedUuid)) {
                    targetSelected = savedSelectedUuid;
                } else if (validOpenUuids.length > 0) {
                    targetSelected = validOpenUuids[0];
                }

                if (targetSelected) {
                    setSelectedNoteUuid(targetSelected);
                }

                prevLayoutRef.current = { openNoteUuids: validOpenUuids, selectedNoteUuid: targetSelected };
            }
            layoutRestoredRef.current = true;
        }
    }, [savedOpenUuids, savedSelectedUuid, allNotes]);

    // Keep stable ref for onSaveLayoutState to prevent triggering effect on db/callback change
    const onSaveLayoutStateRef = useRef(onSaveLayoutState);
    useEffect(() => {
        onSaveLayoutStateRef.current = onSaveLayoutState;
    }, [onSaveLayoutState]);

    // Persist layout state changes back to SQLite
    useEffect(() => {
        if (layoutRestoredRef.current) {
            const prev = prevLayoutRef.current;
            const openChanged = JSON.stringify(prev.openNoteUuids) !== JSON.stringify(openNoteUuids);
            const selectedChanged = prev.selectedNoteUuid !== selectedNoteUuid;

            if (openChanged || selectedChanged) {
                onSaveLayoutStateRef.current(openNoteUuids, selectedNoteUuid);
                prevLayoutRef.current = { openNoteUuids, selectedNoteUuid };
            }
        }
    }, [openNoteUuids, selectedNoteUuid]);

    // Auto-close tabs dropdown menu when only 1 or 0 tabs remain open
    useEffect(() => {
        if (openNoteUuids.length <= 1) {
            setIsOpenTabsMenuOpen(false);
            setTabSearchQuery('');
        }
    }, [openNoteUuids.length]);

    // Watch open files that have a localFilePath
    useEffect(() => {
        if (!ipcRenderer || !layoutRestoredRef.current) return;

        const openNotesWithLocalPath = allNotes.filter(n => openNoteUuids.includes(n.uuid) && n.localFilePath);
        const currentWatched = watchedNotesRef.current;
        const nextWatched = {};

        // Watch new files
        openNotesWithLocalPath.forEach(n => {
            nextWatched[n.uuid] = n.localFilePath;
            if (currentWatched[n.uuid] !== n.localFilePath) {
                ipcRenderer.invoke('watch-local-file', n.localFilePath, n.uuid);
            }
        });

        // Unwatch files that are no longer open or no longer have localFilePath
        Object.keys(currentWatched).forEach(uuid => {
            if (!nextWatched[uuid]) {
                ipcRenderer.invoke('unwatch-local-file', uuid);
            }
        });

        watchedNotesRef.current = nextWatched;

        return () => {
            Object.keys(watchedNotesRef.current).forEach(uuid => {
                ipcRenderer.invoke('unwatch-local-file', uuid);
            });
            watchedNotesRef.current = {};
        };
    }, [openNoteUuids, allNotes, ipcRenderer]);

    // Listen to local file modifications from disk
    useEffect(() => {
        if (!ipcRenderer) return;

        const handleLocalFileChange = (event, { noteUuid, filePath, content }) => {
            if (editorPrefs.enableLocalFileAutoSync === false) return;

            // If this change event matches what we just wrote, ignore it (echo loop prevention)
            if (lastWrittenContentsRef.current[noteUuid] === content) {
                return;
            }

            const targetNote = allNotesRef.current.find(n => n.uuid === noteUuid);
            if (!targetNote) return;

            const activeUuid = selectedNoteUuidRef.current;

            if (noteUuid === activeUuid) {
                if (latestContentRef.current !== content) {
                    try {
                        db.run("UPDATE sticky_notes SET note_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [content, noteUuid]);
                        persistDatabaseToDisk(ipcRenderer, db);
                        onTriggerRefresh();
                        setMarkdownText(content);
                    } catch (e) {
                        console.error("Failed to apply active local file auto-sync change:", e);
                    }
                }
            } else {
                try {
                    db.run("UPDATE sticky_notes SET note_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [content, noteUuid]);
                    persistDatabaseToDisk(ipcRenderer, db);
                    onTriggerRefresh();
                } catch (e) {
                    console.error("Failed to apply inactive local file auto-sync change:", e);
                }
            }
        };

        ipcRenderer.on('local-file-changed', handleLocalFileChange);
        return () => {
            ipcRenderer.removeListener('local-file-changed', handleLocalFileChange);
        };
    }, [ipcRenderer, db, editorPrefs.enableLocalFileAutoSync, onTriggerRefresh]);

    const colors = ['red', 'yellow', 'blue', 'green', 'indigo', 'rose', 'amber', 'emerald', 'sky', 'violet'];
    const bgClasses = {
        yellow: 'bg-amber-400',
        pink: 'bg-rose-400',
        red: 'bg-rose-500',
        blue: 'bg-sky-400',
        green: 'bg-emerald-400',
        indigo: 'bg-indigo-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        sky: 'bg-sky-500',
        violet: 'bg-violet-500'
    };
    
    const headerBgColorClasses = {
        yellow: 'bg-amber-100',
        pink: 'bg-rose-100',
        red: 'bg-rose-150',
        blue: 'bg-sky-100',
        green: 'bg-emerald-100',
        indigo: 'bg-indigo-100',
        rose: 'bg-rose-100',
        amber: 'bg-amber-100',
        emerald: 'bg-emerald-100',
        sky: 'bg-sky-100',
        violet: 'bg-violet-100'
    };

    const editorBodyBgClasses = {
        yellow: 'bg-amber-50/50 border-amber-200/30 dark:bg-amber-955/5',
        pink: 'bg-rose-50/50 border-rose-200/30 dark:bg-rose-955/5',
        red: 'bg-rose-50/50 border-rose-200/30 dark:bg-rose-955/5',
        blue: 'bg-sky-50/50 border-sky-200/30 dark:bg-sky-955/5',
        green: 'bg-emerald-50/50 border-emerald-200/30 dark:bg-emerald-955/5',
        indigo: 'bg-indigo-50/50 border-indigo-200/30 dark:bg-indigo-955/5',
        rose: 'bg-rose-50/50 border-rose-200/30 dark:bg-rose-955/5',
        amber: 'bg-amber-50/50 border-amber-200/30 dark:bg-amber-955/5',
        emerald: 'bg-emerald-50/50 border-emerald-200/30 dark:bg-emerald-955/5',
        sky: 'bg-sky-50/50 border-sky-200/30 dark:bg-sky-955/5',
        violet: 'bg-violet-50/50 border-violet-200/30 dark:bg-violet-955/5'
    };

    const cardBgClasses = {
        yellow: 'bg-amber-50/90 border-amber-200/80 hover:border-amber-300 dark:bg-amber-955/10 dark:border-amber-900/30 dark:hover:border-amber-800',
        pink: 'bg-rose-50/90 border-rose-200/80 hover:border-rose-300 dark:bg-rose-955/10 dark:border-rose-900/30 dark:hover:border-rose-800',
        red: 'bg-rose-50/90 border-rose-200/80 hover:border-rose-300 dark:bg-rose-955/10 dark:border-rose-900/30 dark:hover:border-rose-800',
        blue: 'bg-sky-50/90 border-sky-200/80 hover:border-sky-300 dark:bg-sky-955/10 dark:border-sky-900/30 dark:hover:border-sky-800',
        green: 'bg-emerald-50/90 border-emerald-200/80 hover:border-emerald-300 dark:bg-emerald-955/10 dark:border-emerald-900/30 dark:hover:border-emerald-800',
        indigo: 'bg-indigo-50/90 border-indigo-200/80 hover:border-indigo-300 dark:bg-indigo-955/10 dark:border-indigo-900/30 dark:hover:border-indigo-800',
        rose: 'bg-rose-50/90 border-rose-200/80 hover:border-rose-300 dark:bg-rose-955/10 dark:border-rose-900/30 dark:hover:border-rose-800',
        amber: 'bg-amber-50/90 border-amber-200/80 hover:border-amber-300 dark:bg-amber-955/10 dark:border-amber-900/30 dark:hover:border-amber-800',
        emerald: 'bg-emerald-50/90 border-emerald-200/80 hover:border-emerald-300 dark:bg-emerald-955/10 dark:border-emerald-900/30 dark:hover:border-emerald-800',
        sky: 'bg-sky-50/90 border-sky-200/80 hover:border-sky-300 dark:bg-sky-955/10 dark:border-sky-900/30 dark:hover:border-sky-800',
        violet: 'bg-violet-50/90 border-violet-200/80 hover:border-violet-300 dark:bg-violet-955/10 dark:border-violet-900/30 dark:hover:border-violet-800'
    };

    const cardSelectedClasses = {
        yellow: 'ring-1 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-955/30 shadow-xs',
        pink: 'ring-1 ring-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-955/30 shadow-xs',
        red: 'ring-1 ring-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-955/30 shadow-xs',
        blue: 'ring-1 ring-sky-500 border-sky-500 bg-sky-50 dark:bg-sky-955/30 shadow-xs',
        green: 'ring-1 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-955/30 shadow-xs',
        indigo: 'ring-1 ring-indigo-500 border-indigo-500 bg-indigo-50 dark:bg-indigo-955/30 shadow-xs',
        rose: 'ring-1 ring-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-955/30 shadow-xs',
        amber: 'ring-1 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-955/30 shadow-xs',
        emerald: 'ring-1 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-955/30 shadow-xs',
        sky: 'ring-1 ring-sky-500 border-sky-500 bg-sky-50 dark:bg-sky-955/30 shadow-xs',
        violet: 'ring-1 ring-violet-500 border-violet-500 bg-violet-50 dark:bg-violet-955/30 shadow-xs'
    };

    const priorityFlags = {
        red: { label: 'Highest Priority', flagColor: 'text-rose-500', bgClass: 'bg-rose-500' },
        pink: { label: 'Highest Priority', flagColor: 'text-rose-500', bgClass: 'bg-rose-500' },
        yellow: { label: 'Higher Priority', flagColor: 'text-amber-500', bgClass: 'bg-amber-400' },
        blue: { label: 'Low Priority', flagColor: 'text-sky-400', bgClass: 'bg-sky-400' },
        green: { label: 'Very Low Priority', flagColor: 'text-emerald-400', bgClass: 'bg-emerald-400' },
        indigo: { label: 'Indigo Theme', flagColor: 'text-indigo-400', bgClass: 'bg-indigo-400' },
        rose: { label: 'Rose Theme', flagColor: 'text-rose-450', bgClass: 'bg-rose-500' },
        amber: { label: 'Amber Theme', flagColor: 'text-amber-400', bgClass: 'bg-amber-400' },
        emerald: { label: 'Emerald Theme', flagColor: 'text-emerald-400', bgClass: 'bg-emerald-400' },
        sky: { label: 'Sky Theme', flagColor: 'text-sky-400', bgClass: 'bg-sky-400' },
        violet: { label: 'Violet Theme', flagColor: 'text-violet-400', bgClass: 'bg-violet-400' }
    };

    // Fetch and Sync all open windows visibility/pin status
    const refreshWindowsState = async () => {
        if (ipcRenderer) {
            try {
                const states = await ipcRenderer.invoke('get-windows-state');
                setWindowsState(states || {});
            } catch (err) {
                console.error("Failed to query windows state:", err);
            }
        }
    };

    useEffect(() => {
        refreshWindowsState();

        if (ipcRenderer) {
            const handler = () => refreshWindowsState();
            ipcRenderer.on('db-updated', handler);
            ipcRenderer.on('window-moved', handler);
            ipcRenderer.on('window-state-updated', handler);
            return () => {
                ipcRenderer.removeListener('db-updated', handler);
                ipcRenderer.removeListener('window-moved', handler);
                ipcRenderer.removeListener('window-state-updated', handler);
            };
        }
    }, [ipcRenderer]);

    // Folder select guard
    useEffect(() => {
        if (allFolders.length > 0) {
            const exists = allFolders.some(f => f.uuid === activeFolderUuid);
            if (!exists) {
                setActiveFolderUuid(allFolders[0].uuid);
            }
        }
    }, [allFolders, activeFolderUuid]);

    // 1. Automatically add selectedNoteUuid to open tabs and expand parent folder
    useEffect(() => {
        if (selectedNoteUuid && !openNoteUuids.includes(selectedNoteUuid)) {
            setOpenNoteUuids(prev => [...prev, selectedNoteUuid]);
        }
        
        if (selectedNoteUuid && allNotes.length > 0) {
            const noteObj = allNotes.find(n => n.uuid === selectedNoteUuid);
            if (noteObj && noteObj.parentFolderUuid) {
                setExpandedFolders(prev => ({ ...prev, [noteObj.parentFolderUuid]: true }));
                setActiveFolderUuid(noteObj.parentFolderUuid);
            }
        }
    }, [selectedNoteUuid, allNotes]);

    // 2. Keep tabs synced with existing notes (remove deleted ones)
    useEffect(() => {
        if (allNotes.length > 0) {
            const existingUuids = allNotes.map(n => n.uuid);
            setOpenNoteUuids(prev => prev.filter(uuid => existingUuids.includes(uuid)));
        } else {
            setOpenNoteUuids([]);
        }
    }, [allNotes]);

    // Keep refs for interval callback to prevent resetting the 10-minute timer
    const selectedNoteUuidRef = useRef(selectedNoteUuid);
    const openNoteUuidsRef = useRef(openNoteUuids);
    const allNotesRef = useRef(allNotes);
    const getVcsCommitsRef = useRef(getVcsCommits);
    const addVcsCommitRef = useRef(addVcsCommit);
    const lastWrittenContentsRef = useRef({});
    const watchedNotesRef = useRef({});

    useEffect(() => { selectedNoteUuidRef.current = selectedNoteUuid; }, [selectedNoteUuid]);
    useEffect(() => { openNoteUuidsRef.current = openNoteUuids; }, [openNoteUuids]);
    useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);
    useEffect(() => { getVcsCommitsRef.current = getVcsCommits; }, [getVcsCommits]);
    useEffect(() => { addVcsCommitRef.current = addVcsCommit; }, [addVcsCommit]);

    useEffect(() => {
        if (selectedNoteUuid) {
            const activeTabEl = document.getElementById(`tab-${selectedNoteUuid}`);
            if (activeTabEl) {
                activeTabEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [selectedNoteUuid]);

    // 3. Dynamic Auto-Versioning Hook (Runs on stable interval, restarts if backupInterval changes)
    useEffect(() => {
        if (!db) return;

        const intervalMs = (editorPrefs && editorPrefs.backupInterval) ? parseInt(editorPrefs.backupInterval) : 600000;
        const minutes = intervalMs / 60000;
        const commitMsg = `Auto-backup (${minutes} min interval)`;

        const checkAndAutoCommit = () => {
            try {
                const openUuids = openNoteUuidsRef.current || [];
                openUuids.forEach(uuid => {
                    let currentText = "";
                    let title = "";

                    if (uuid === selectedNoteUuidRef.current) {
                        currentText = latestContentRef.current;
                        const activeNoteObj = allNotesRef.current.find(n => n.uuid === uuid);
                        title = activeNoteObj ? activeNoteObj.title : "";
                    } else {
                        // Query the saved content from sqlite since it was flushed on tab switch/blur
                        const mdRes = db.exec("SELECT note_markdown_content, note_title FROM sticky_notes WHERE note_uuid = ?", [uuid]);
                        if (mdRes && mdRes.length > 0 && mdRes[0].values) {
                            currentText = mdRes[0].values[0][0] || "";
                            title = mdRes[0].values[0][1] || "";
                        } else {
                            return; // skip if note not found in db
                        }
                    }

                    const commits = getVcsCommitsRef.current(uuid);
                    const latestCommit = commits[0];

                    if (!latestCommit || latestCommit.contentSnapshot !== currentText) {
                        addVcsCommitRef.current(
                            uuid,
                            title,
                            currentText,
                            commitMsg
                        );
                    }
                });
            } catch (err) {
                console.error("Auto-backup failed:", err);
            }
        };

        const intervalId = setInterval(checkAndAutoCommit, intervalMs);
        return () => clearInterval(intervalId);
    }, [db, editorPrefs?.backupInterval]);

    // Query and update tasks, events, expenses & markdown text cache for the selected note
    useEffect(() => {
        setShowVcsPanel(false);
        if (db && selectedNoteUuid) {
            try {
                // Query tasks
                const res = db.exec("SELECT item_uuid, item_text_payload, is_marked_completed FROM task_items WHERE parent_note_uuid = ?", [selectedNoteUuid]);
                if (res && res.length > 0 && res[0].values) {
                    setTasks(res[0].values.map(row => ({
                        id: row[0],
                        text: row[1],
                        done: row[2] === 1
                    })));
                } else {
                    setTasks([]);
                }

                // Query events
                const evRes = db.exec("SELECT event_uuid, event_text, event_time FROM events_log WHERE parent_note_uuid = ? ORDER BY event_time DESC", [selectedNoteUuid]);
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
                const expRes = db.exec("SELECT expense_uuid, expense_amount, expense_category, expense_description, expense_date FROM expense_log WHERE parent_note_uuid = ? ORDER BY expense_date DESC, created_at DESC", [selectedNoteUuid]);
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

                // Query markdown content
                const mdRes = db.exec("SELECT note_markdown_content FROM sticky_notes WHERE note_uuid = ?", [selectedNoteUuid]);
                if (mdRes && mdRes.length > 0 && mdRes[0].values) {
                    setMarkdownText(mdRes[0].values[0][0] || "");
                } else {
                    setMarkdownText("");
                }
            } catch (err) {
                console.error("Failed to query selected note contents:", err);
            }
        }
    }, [db, selectedNoteUuid, allNotes]);

    // Perform database-level search lookup
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchMatchedUuids(null);
            return;
        }
        if (db) {
            try {
                const sql = `
                    SELECT DISTINCT note_uuid FROM sticky_notes 
                    WHERE note_title LIKE ? 
                       OR note_markdown_content LIKE ? 
                       OR note_uuid IN (SELECT parent_note_uuid FROM task_items WHERE item_text_payload LIKE ?)
                       OR note_uuid IN (SELECT parent_note_uuid FROM events_log WHERE event_text LIKE ?)
                       OR note_uuid IN (SELECT parent_note_uuid FROM expense_log WHERE expense_description LIKE ? OR expense_category LIKE ?)
                `;
                const param = `%${query}%`;
                const res = db.exec(sql, [param, param, param, param, param, param]);
                if (res && res.length > 0 && res[0].values) {
                    setSearchMatchedUuids(res[0].values.map(r => r[0]));
                } else {
                    setSearchMatchedUuids([]);
                }
            } catch (err) {
                console.error("Database search query failed:", err);
                setSearchMatchedUuids([]);
            }
        }
    }, [searchQuery, db, allNotes]);

    // Create an O(1) lookup map of all notes by UUID
    const notesMap = useMemo(() => {
        const map = {};
        allNotes.forEach(n => {
            map[n.uuid] = n;
        });
        return map;
    }, [allNotes]);

    const activeFolder = allFolders.find(f => f.uuid === activeFolderUuid);
    const selectedNote = notesMap[selectedNoteUuid];
    const mode = selectedNote ? getEditorModeFromTitle(selectedNote.title) : 'md';

    const sortedNotes = useMemo(() => {
        const folderNotes = allNotes.filter(n => n.parentFolderUuid === activeFolderUuid);
        const query = searchQuery.trim();
        const filtered = folderNotes.filter(n => {
            if (!query) return true;
            return searchMatchedUuids ? searchMatchedUuids.includes(n.uuid) : false;
        });

        if (sortBy === 'alpha-asc') {
            return filtered.sort((a, b) => a.title.localeCompare(b.title));
        }
        if (sortBy === 'alpha-desc') {
            return filtered.sort((a, b) => b.title.localeCompare(a.title));
        }
        if (sortBy === 'newest') {
            return filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        }
        if (sortBy === 'oldest') {
            return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        if (sortBy === 'priority') {
            const weights = { red: 5, pink: 5, yellow: 4, blue: 2, green: 1 };
            return filtered.sort((a, b) => (weights[b.theme] || 0) - (weights[a.theme] || 0));
        }
        if (sortBy === 'theme') {
            return filtered.sort((a, b) => a.theme.localeCompare(b.theme));
        }
        // 'custom' order
        return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    }, [allNotes, activeFolderUuid, searchQuery, searchMatchedUuids, sortBy]);

    // Pre-calculate notes count by folder for O(1) badge lookup
    const notesCountByFolder = useMemo(() => {
        const counts = {};
        allNotes.forEach(n => {
            counts[n.parentFolderUuid] = (counts[n.parentFolderUuid] || 0) + 1;
        });
        return counts;
    }, [allNotes]);

    // Group, filter and sort notes for each folder inside tree view list using useMemo
    const sortedNotesByFolder = useMemo(() => {
        const groups = {};
        allNotes.forEach(n => {
            if (!groups[n.parentFolderUuid]) {
                groups[n.parentFolderUuid] = [];
            }
            groups[n.parentFolderUuid].push(n);
        });

        const result = {};
        const query = searchQuery.trim();

        Object.keys(groups).forEach(folderUuid => {
            const folderNotes = groups[folderUuid];

            // Apply search filtering
            const filtered = folderNotes.filter(n => {
                if (!query) return true;
                return searchMatchedUuids ? searchMatchedUuids.includes(n.uuid) : false;
            });

            // Sort folder notes
            filtered.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;

                if (sortBy === 'alpha-asc') return a.title.localeCompare(b.title);
                if (sortBy === 'alpha-desc') return b.title.localeCompare(a.title);
                if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
                if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
                if (sortBy === 'priority' || sortBy === 'theme') {
                    const weights = { red: 5, pink: 5, yellow: 4, blue: 2, green: 1 };
                    return (weights[b.theme] || 0) - (weights[a.theme] || 0);
                }
                return a.sortOrder - b.sortOrder;
            });

            result[folderUuid] = filtered;
        });

        return result;
    }, [allNotes, searchQuery, searchMatchedUuids, sortBy]);

    const handleMoveNoteUp = (idx, e) => {
        e.stopPropagation();
        if (idx === 0) return;
        const noteA = sortedNotes[idx];
        const noteB = sortedNotes[idx - 1];
        swapNotesOrder(noteA.uuid, noteB.uuid);
    };

    const handleMoveNoteDown = (idx, e) => {
        e.stopPropagation();
        if (idx === sortedNotes.length - 1) return;
        const noteA = sortedNotes[idx];
        const noteB = sortedNotes[idx + 1];
        swapNotesOrder(noteA.uuid, noteB.uuid);
    };

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

    const startNoteRename = (n) => {
        setEditingNoteUuid(n.uuid);
        setNoteRenameVal(n.title);
    };

    const commitNoteRename = (uuid) => {
        const trimmedNew = noteRenameVal.trim();
        if (trimmedNew) {
            const targetNote = allNotes.find(n => n.uuid === uuid);
            if (targetNote && targetNote.title !== trimmedNew) {
                const oldExt = getEditorModeFromTitle(targetNote.title);
                const newExt = getEditorModeFromTitle(trimmedNew);
                
                if (oldExt !== newExt) {
                    addVcsCommit(
                        uuid, 
                        targetNote.title, 
                        markdownText, 
                        `Auto-backup: Changed type from .${oldExt} to .${newExt}`
                    );
                    try {
                        db.run("UPDATE sticky_notes SET note_view_mode = ? WHERE note_uuid = ?", [newExt, uuid]);
                    } catch (e) {
                        console.error("Failed to update note view mode on rename:", e);
                    }
                }
                onRenameNote(uuid, trimmedNew);
            }
        }
        setEditingNoteUuid(null);
    };

    // Selected Note Local Editing Operations
    const handleAddTask = (text) => {
        if (!text.trim() || !selectedNoteUuid) return;
        db.run("INSERT INTO task_items (item_uuid, parent_note_uuid, item_text_payload, is_marked_completed) VALUES (?, ?, ?, 0)", ["task_" + Date.now(), selectedNoteUuid, text.trim()]);
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
    };

    const handleToggleTask = (taskId, currentDone) => {
        db.run("UPDATE task_items SET is_marked_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE item_uuid = ?", [currentDone ? 0 : 1, taskId]);
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
    };

    const handleDeleteTask = (taskId) => {
        db.run("DELETE FROM task_items WHERE item_uuid = ?", [taskId]);
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
    };

    const handleClearCompleted = () => {
        db.run("DELETE FROM task_items WHERE is_marked_completed = 1 AND parent_note_uuid = ?", [selectedNoteUuid]);
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
    };

    const handleUpdateMarkdown = (text) => {
        // Butter-smooth typing response update
        setMarkdownText(text);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (!db || !selectedNoteUuid) return;
            try {
                db.run("UPDATE sticky_notes SET note_markdown_content = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [text, selectedNoteUuid]);
                persistDatabaseToDisk(ipcRenderer, db);
                onTriggerRefresh();

                const targetNote = allNotes.find(n => n.uuid === selectedNoteUuid);
                if (targetNote && targetNote.localFilePath && editorPrefs.enableLocalFileAutoSync !== false && ipcRenderer) {
                    lastWrittenContentsRef.current[selectedNoteUuid] = text;
                    ipcRenderer.invoke('write-local-file', targetNote.localFilePath, text);
                }
            } catch (err) {
                console.error("Failed to save note contents debounced:", err);
            }
        }, 800);
    };

    // --- DRAG & DROP FILE IMPORTER ---
    const handleImportFile = (file, targetFolderUuid) => {
        return new Promise((resolve) => {
            const name = file.name;
            const ext = name.split('.').pop().toLowerCase();
            const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml', 'txt', 'b64'];

            if (!supported.includes(ext)) {
                alert(`Unsupported file format: .${ext}. Supported formats: ${supported.join(', ')}`);
                resolve();
                return;
            }

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const content = evt.target.result;
                const noteUuid = "note_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
                const mode = ext === 'txt' ? 'md' : (ext === 'yaml' ? 'yml' : ext);

                let dbContent = '# Write ideas here...';
                if (mode === 'md' || ['html', 'css', 'js', 'jsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml'].includes(mode)) {
                    dbContent = content;
                }

                const localFilePath = file.path || '';

                try {
                    db.run("INSERT INTO sticky_notes (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height, local_file_path) VALUES (?, ?, ?, 'yellow', ?, ?, 100, 100, 350, 420, ?)", [noteUuid, targetFolderUuid, name, mode, dbContent, localFilePath]);

                    if (mode === 'todo' || mode === 'list') {
                        const lines = content.split(/\r?\n/);
                        lines.forEach((line) => {
                            if (!line.trim()) return;
                            let isDone = 0;
                            let text = line.trim();
                            if (text.startsWith('- [x]') || text.startsWith('- [X]')) {
                                isDone = 1;
                                text = text.slice(5).trim();
                            } else if (text.startsWith('- [ ]')) {
                                isDone = 0;
                                text = text.slice(5).trim();
                            } else if (text.startsWith('[x]') || text.startsWith('[X]')) {
                                isDone = 1;
                                text = text.slice(3).trim();
                            } else if (text.startsWith('[ ]')) {
                                isDone = 0;
                                text = text.slice(3).trim();
                            } else if (text.startsWith('-')) {
                                text = text.slice(1).trim();
                            }
                            db.run("INSERT INTO task_items (item_uuid, parent_note_uuid, item_text_payload, is_marked_completed) VALUES (?, ?, ?, ?)", ["task_" + Date.now() + "_" + Math.floor(Math.random() * 1000000), noteUuid, text, isDone]);
                        });
                    } else if (mode === 'log') {
                        const lines = content.split(/\r?\n/);
                        lines.forEach((line) => {
                            if (!line.trim()) return;
                            db.run("INSERT INTO events_log (event_uuid, parent_note_uuid, event_text) VALUES (?, ?, ?)", ["event_" + Date.now() + "_" + Math.floor(Math.random() * 1000000), noteUuid, line.trim()]);
                        });
                    } else if (mode === 'xpnc') {
                        const lines = content.split(/\r?\n/);
                        lines.forEach((line) => {
                            if (!line.trim()) return;
                            const parts = line.split(',');
                            let amount = 0.0;
                            let category = 'Imported';
                            let desc = line.trim();
                            if (parts.length >= 2) {
                                const parsedAmt = parseFloat(parts[0]);
                                if (!isNaN(parsedAmt)) {
                                    amount = parsedAmt;
                                    category = parts[1].trim();
                                    desc = parts.slice(2).join(',').trim() || 'Imported expense';
                                }
                            }
                            db.run("INSERT INTO expense_log (expense_uuid, parent_note_uuid, expense_amount, expense_category, expense_description) VALUES (?, ?, ?, ?, ?)", ["expense_" + Date.now() + "_" + Math.floor(Math.random() * 1000000), noteUuid, amount, category, desc]);
                        });
                    }
                } catch (e) {
                    console.error("Failed to insert imported data:", e);
                }
                resolve(noteUuid);
            };
            reader.readAsText(file);
        });
    };

    const handleDragOverNotes = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeFolderUuid) {
            setIsDraggingOverNotes(true);
        }
    };

    const handleDragLeaveNotes = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverNotes(false);
    };

    const handleDropNotes = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverNotes(false);

        if (!activeFolderUuid) {
            alert("Please select or create a notebook folder first.");
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        let lastImportedUuid = null;
        for (const file of files) {
            const uuid = await handleImportFile(file, activeFolderUuid);
            if (uuid) lastImportedUuid = uuid;
        }
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
        if (lastImportedUuid) {
            setSelectedNoteUuid(lastImportedUuid);
        }
    };

    const handleDragOverFolder = (e, folderUuid) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingOverFolderUuid(folderUuid);
    };

    const handleDragLeaveFolder = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingOverFolderUuid(null);
    };

    const handleDropFolder = async (e, folderUuid) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingOverFolderUuid(null);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) {
            // Drag-and-drop notes internally
            const draggedNoteUuid = e.dataTransfer.getData('text/plain');
            if (draggedNoteUuid) {
                try {
                    db.run("UPDATE sticky_notes SET parent_folder_uuid = ?, updated_at = CURRENT_TIMESTAMP WHERE note_uuid = ?", [folderUuid, draggedNoteUuid]);
                    persistDatabaseToDisk(ipcRenderer, db);
                    onTriggerRefresh();
                    setActiveFolderUuid(folderUuid);
                } catch (err) {
                    console.error("Failed to move note internally:", err);
                }
            }
            return;
        }

        let lastImportedUuid = null;
        for (const file of files) {
            const uuid = await handleImportFile(file, folderUuid);
            if (uuid) lastImportedUuid = uuid;
        }
        persistDatabaseToDisk(ipcRenderer, db);
        onTriggerRefresh();
        if (lastImportedUuid) {
            setSelectedNoteUuid(lastImportedUuid);
            setActiveFolderUuid(folderUuid);
        }
    };

    // --- MULTI-FORMAT EXPORTERS ---
    const handleExportRawFile = () => {
        if (!selectedNote) return;
        let textContent = '';
        const mode = getEditorModeFromTitle(selectedNote.title);

        if (mode === 'todo' || mode === 'list') {
            textContent = tasks.map(t => `${t.done ? '- [x]' : '- [ ]'} ${t.text}`).join('\n');
        } else if (mode === 'log') {
            textContent = events.map(e => `${e.time ? e.time + ' - ' : ''}${e.text}`).join('\n');
        } else if (mode === 'xpnc') {
            textContent = expenses.map(e => `${e.amount}, ${e.category}, ${e.description}`).join('\n');
        } else {
            textContent = markdownText;
        }

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = selectedNote.title;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportJson = () => {
        if (!selectedNote) return;
        const data = {
            title: selectedNote.title,
            uuid: selectedNote.uuid,
            themePreset: selectedNote.theme,
            viewMode: selectedNote.viewMode,
            createdAt: selectedNote.createdAt,
            markdownContent: markdownText,
            tasks: tasks,
            events: events,
            expenses: expenses
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedNote.title.split('.')[0] || 'note'}_backup.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCsv = () => {
        if (!selectedNote) return;
        let csvContent = '';
        const mode = getEditorModeFromTitle(selectedNote.title);

        if (mode === 'xpnc') {
            csvContent = 'Amount,Category,Description,Date\n' + 
                expenses.map(e => `"${e.amount}","${e.category.replace(/"/g, '""')}","${e.description.replace(/"/g, '""')}","${e.date || ''}"`).join('\n');
        } else if (mode === 'todo' || mode === 'list') {
            csvContent = 'Status,Task Description\n' + 
                tasks.map(t => `"${t.done ? 'Completed' : 'Pending'}","${t.text.replace(/"/g, '""')}"`).join('\n');
        } else if (mode === 'log') {
            csvContent = 'Time,Event\n' + 
                events.map(e => `"${e.time || ''}","${e.text.replace(/"/g, '""')}"`).join('\n');
        } else {
            csvContent = 'Title,Content\n' + 
                `"${selectedNote.title.replace(/"/g, '""')}","${markdownText.replace(/"/g, '""')}"`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedNote.title.split('.')[0] || 'note'}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportDb = () => {
        if (!db) return;
        try {
            const binaryDb = db.export();
            const blob = new Blob([binaryDb], { type: 'application/x-sqlite3' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'personallog_data.db';
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to export database binary:", e);
        }
    };

    const handleExportNoteData = (noteUuid, noteTitle, format) => {
        if (!db) return;
        try {
            const noteRes = db.exec("SELECT note_title, note_markdown_content, note_view_mode, created_at, note_theme_preset FROM sticky_notes WHERE note_uuid = ?", [noteUuid]);
            if (!noteRes || noteRes.length === 0 || !noteRes[0].values) {
                alert("Note not found.");
                return;
            }
            const noteRow = noteRes[0].values[0];
            const title = noteRow[0];
            const markdownContent = noteRow[1] || "";
            const viewMode = noteRow[2];
            const createdAt = noteRow[3];
            const themePreset = noteRow[4];

            let noteTasks = [];
            const taskRes = db.exec("SELECT item_text_payload, is_marked_completed FROM task_items WHERE parent_note_uuid = ?", [noteUuid]);
            if (taskRes && taskRes.length > 0 && taskRes[0].values) {
                noteTasks = taskRes[0].values.map(row => ({
                    text: row[0],
                    done: row[1] === 1
                }));
            }

            let noteEvents = [];
            const eventRes = db.exec("SELECT event_text, created_at FROM events_log WHERE parent_note_uuid = ? ORDER BY created_at DESC", [noteUuid]);
            if (eventRes && eventRes.length > 0 && eventRes[0].values) {
                noteEvents = eventRes[0].values.map(row => ({
                    text: row[0],
                    time: row[1]
                }));
            }

            let noteExpenses = [];
            const expRes = db.exec("SELECT expense_amount, expense_category, expense_description, expense_date FROM expense_log WHERE parent_note_uuid = ? ORDER BY expense_date DESC", [noteUuid]);
            if (expRes && expRes.length > 0 && expRes[0].values) {
                noteExpenses = expRes[0].values.map(row => ({
                    amount: row[0],
                    category: row[1],
                    description: row[2],
                    date: row[3]
                }));
            }

            const mode = getEditorModeFromTitle(title);

            if (format === 'raw') {
                let textContent = '';
                if (mode === 'todo' || mode === 'list') {
                    textContent = noteTasks.map(t => `${t.done ? '- [x]' : '- [ ]'} ${t.text}`).join('\n');
                } else if (mode === 'log') {
                    textContent = noteEvents.map(e => `${e.time ? e.time + ' - ' : ''}${e.text}`).join('\n');
                } else if (mode === 'xpnc') {
                    textContent = noteExpenses.map(e => `${e.amount}, ${e.category}, ${e.description}`).join('\n');
                } else {
                    textContent = markdownContent;
                }

                const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = title;
                link.click();
                URL.revokeObjectURL(url);
            } else if (format === 'json') {
                const data = {
                    title: title,
                    uuid: noteUuid,
                    themePreset: themePreset,
                    viewMode: viewMode,
                    createdAt: createdAt,
                    markdownContent: markdownContent,
                    tasks: noteTasks,
                    events: noteEvents,
                    expenses: noteExpenses
                };

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${title.split('.')[0] || 'note'}_backup.json`;
                link.click();
                URL.revokeObjectURL(url);
            } else if (format === 'csv') {
                let csvContent = '';
                if (mode === 'xpnc') {
                    csvContent = 'Amount,Category,Description,Date\n' + 
                        noteExpenses.map(e => `"${e.amount}","${e.category.replace(/"/g, '""')}","${e.description.replace(/"/g, '""')}","${e.date || ''}"`).join('\n');
                } else if (mode === 'todo' || mode === 'list') {
                    csvContent = 'Status,Task Description\n' + 
                        noteTasks.map(t => `"${t.done ? 'Completed' : 'Pending'}","${t.text.replace(/"/g, '""')}"`).join('\n');
                } else if (mode === 'log') {
                    csvContent = 'Time,Event\n' + 
                        noteEvents.map(e => `"${e.time || ''}","${e.text.replace(/"/g, '""')}"`).join('\n');
                } else {
                    csvContent = 'Title,Content\n' + 
                        `"${title.replace(/"/g, '""')}","${markdownContent.replace(/"/g, '""')}"`;
                }

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${title.split('.')[0] || 'note'}.csv`;
                link.click();
                URL.revokeObjectURL(url);
            } else if (format === 'db') {
                handleExportDb();
            }
        } catch (err) {
            console.error("Failed to export note data:", err);
            alert("Failed to export note.");
        }
    };

    const handleExportFolderData = (folderUuid, folderName, format) => {
        if (!db) return;
        try {
            const notesRes = db.exec("SELECT note_uuid, note_title, note_markdown_content, note_view_mode, created_at, note_theme_preset FROM sticky_notes WHERE parent_folder_uuid = ?", [folderUuid]);
            let folderNotesList = [];
            if (notesRes && notesRes.length > 0 && notesRes[0].values) {
                folderNotesList = notesRes[0].values.map(row => ({
                    uuid: row[0],
                    title: row[1],
                    markdownContent: row[2] || "",
                    viewMode: row[3],
                    createdAt: row[4],
                    themePreset: row[5]
                }));
            }

            if (folderNotesList.length === 0) {
                alert("This notebook contains no notes to export.");
                return;
            }

            const allNotesData = folderNotesList.map(n => {
                let noteTasks = [];
                const taskRes = db.exec("SELECT item_text_payload, is_marked_completed FROM task_items WHERE parent_note_uuid = ?", [n.uuid]);
                if (taskRes && taskRes.length > 0 && taskRes[0].values) {
                    noteTasks = taskRes[0].values.map(row => ({
                        text: row[0],
                        done: row[1] === 1
                    }));
                }

                let noteEvents = [];
                const eventRes = db.exec("SELECT event_text, created_at FROM events_log WHERE parent_note_uuid = ? ORDER BY created_at DESC", [n.uuid]);
                if (eventRes && eventRes.length > 0 && eventRes[0].values) {
                    noteEvents = eventRes[0].values.map(row => ({
                        text: row[0],
                        time: row[1]
                    }));
                }

                let noteExpenses = [];
                const expRes = db.exec("SELECT expense_amount, expense_category, expense_description, expense_date FROM expense_log WHERE parent_note_uuid = ? ORDER BY expense_date DESC", [n.uuid]);
                if (expRes && expRes.length > 0 && expRes[0].values) {
                    noteExpenses = expRes[0].values.map(row => ({
                        amount: row[0],
                        category: row[1],
                        description: row[2],
                        date: row[3]
                    }));
                }

                return {
                    ...n,
                    tasks: noteTasks,
                    events: noteEvents,
                    expenses: noteExpenses
                };
            });

            if (format === 'raw') {
                let compiledText = `# Notebook: ${folderName}\nExported on ${new Date().toLocaleDateString()}\n\n`;
                allNotesData.forEach(n => {
                    compiledText += `=========================================\n`;
                    compiledText += `NOTE: ${n.title}\n`;
                    compiledText += `Type: ${n.viewMode} | Created: ${n.createdAt}\n`;
                    compiledText += `=========================================\n\n`;

                    const mode = getEditorModeFromTitle(n.title);
                    if (mode === 'todo' || mode === 'list') {
                        compiledText += n.tasks.map(t => `${t.done ? '- [x]' : '- [ ]'} ${t.text}`).join('\n');
                    } else if (mode === 'log') {
                        compiledText += n.events.map(e => `${e.time ? e.time + ' - ' : ''}${e.text}`).join('\n');
                    } else if (mode === 'xpnc') {
                        compiledText += n.expenses.map(e => `${e.amount}, ${e.category}, ${e.description}`).join('\n');
                    } else {
                        compiledText += n.markdownContent;
                    }
                    compiledText += `\n\n\n`;
                });

                const blob = new Blob([compiledText], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${folderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notebook.txt`;
                link.click();
                URL.revokeObjectURL(url);

            } else if (format === 'json') {
                const data = {
                    notebookName: folderName,
                    notebookUuid: folderUuid,
                    exportedAt: new Date().toISOString(),
                    notes: allNotesData
                };

                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${folderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notebook_backup.json`;
                link.click();
                URL.revokeObjectURL(url);

            } else if (format === 'csv') {
                let csvContent = 'Note Title,Note Type,Field 1 (Status/Amount),Field 2 (Category/Time),Field 3 (Description/Date)\n';
                allNotesData.forEach(n => {
                    const mode = getEditorModeFromTitle(n.title);
                    const cleanTitle = n.title.replace(/"/g, '""');
                    if (mode === 'todo' || mode === 'list') {
                        n.tasks.forEach(t => {
                            csvContent += `"${cleanTitle}","Task","${t.done ? 'Completed' : 'Pending'}","","${t.text.replace(/"/g, '""')}"\n`;
                        });
                    } else if (mode === 'log') {
                        n.events.forEach(e => {
                            csvContent += `"${cleanTitle}","Log","","${(e.time || '').replace(/"/g, '""')}","${e.text.replace(/"/g, '""')}"\n`;
                        });
                    } else if (mode === 'xpnc') {
                        n.expenses.forEach(e => {
                            csvContent += `"${cleanTitle}","Expense","${e.amount}","${e.category.replace(/"/g, '""')}","${e.description.replace(/"/g, '""')} [Date: ${e.date || ''}]"\n`;
                        });
                    } else {
                        const snippet = n.markdownContent.slice(0, 100).replace(/"/g, '""');
                        csvContent += `"${cleanTitle}","Markdown","","","${snippet}..."\n`;
                    }
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${folderName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notebook.csv`;
                link.click();
                URL.revokeObjectURL(url);

            } else if (format === 'db') {
                handleExportDb();
            }
        } catch (err) {
            console.error("Failed to export folder data:", err);
            alert("Failed to export notebook data.");
        }
    };



    // Note Window control actions (Pin/Show/Hide)
    const handleTogglePin = (uuid) => {
        if (!ipcRenderer) return;
        const state = windowsState[uuid];
        const nextPin = !state?.pinned;

        if (!state || !state.visible) {
            ipcRenderer.send('focus-widget-window', uuid);
        }
        ipcRenderer.send('set-widget-always-on-top', uuid, nextPin);
    };

    const handleShow = (uuid) => {
        if (ipcRenderer) {
            ipcRenderer.send('focus-widget-window', uuid);
        }
    };

    const handleHide = (uuid) => {
        if (ipcRenderer) {
            ipcRenderer.send('hide-widget-window', uuid);
        }
    };

    // Tabs Controller helper
    const handleCloseTab = (uuid, e) => {
        if (e) e.stopPropagation();
        const nextTabs = openNoteUuids.filter(id => id !== uuid);
        setOpenNoteUuids(nextTabs);
        
        if (selectedNoteUuid === uuid) {
            if (nextTabs.length > 0) {
                const closedIdx = openNoteUuids.indexOf(uuid);
                const nextActiveIdx = Math.min(closedIdx, nextTabs.length - 1);
                setSelectedNoteUuid(nextTabs[nextActiveIdx]);
            } else {
                setSelectedNoteUuid(null);
            }
        }
    };

    // Frameless Custom Titlebar Controllers
    const handleMinimize = () => {
        if (ipcRenderer) ipcRenderer.send('window-minimize');
    };

    const handleMaximize = () => {
        if (ipcRenderer) ipcRenderer.send('window-maximize');
    };

    const handleClose = () => {
        if (ipcRenderer) ipcRenderer.send('window-close');
    };

    // Evaluate features based on current viewMode csv list
    const currentMode = selectedNote?.viewMode || 'markdown';
    const featureTasks = currentMode.includes('tasks') || currentMode.includes('both');
    const featureEvents = currentMode.includes('events');
    const featureExpenses = currentMode.includes('expenses');
    const featuresActive = featureTasks || featureEvents || featureExpenses;

    const renderActionsMenu = () => {
        if (!selectedNote) return null;
        return (
            <div className="flex items-center gap-1.5 relative">
                <button 
                    onClick={() => setEditorMenuOpen(!editorMenuOpen)}
                    className="px-2 py-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-black/10 dark:border-white/15 rounded-md text-[8px] font-extrabold uppercase tracking-wider text-slate-655 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-sm select-none"
                    title="Actions on note"
                >
                    Actions <FontAwesomeIcon icon={faChevronDown} className="text-[7px] opacity-75" />
                </button>
                
                {editorMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-45 cursor-default" onClick={() => setEditorMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 w-44 z-50 animate-in fade-in slide-in-from-top-1.5 duration-150 select-none text-slate-700 dark:text-slate-200">
                            {/* Context-aware Actions Header */}
                            <div className="px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 border-b border-black/5 dark:border-white/5 mb-1">
                                {getContextLabel(selectedNote.title)}
                            </div>

                            {/* Execute SQL Option */}
                            {mode === 'sql' && (
                                <button
                                    onClick={() => {
                                        handleExecuteSqlQuery();
                                        setEditorMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <FontAwesomeIcon icon={faPlay} className="text-indigo-500 w-3 text-center" />
                                    Execute SQL Query
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setShowVcsPanel(!showVcsPanel);
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faHistory} className="text-slate-400 w-3 text-center" />
                                Version History
                            </button>
                            <button
                                onClick={() => {
                                    setCompareOpen(true);
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faColumns} className="text-slate-400 w-3 text-center" />
                                Compare Document
                            </button>
                            <div className="border-t border-black/5 dark:border-white/5 my-1" />
                            <button
                                onClick={() => {
                                    toggleNoteFlag(selectedNote.uuid, selectedNote.isFlagged);
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faFlag} className={`${selectedNote.isFlagged ? 'text-red-500 animate-pulse' : 'text-slate-400'} w-3 text-center`} />
                                {selectedNote.isFlagged ? 'Unflag Entry' : 'Flag Entry'}
                            </button>
                            <div className="border-t border-black/5 dark:border-white/5 my-1" />
                            <div className="px-3 py-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-455 border-b border-black/5 dark:border-white/5 mb-1">Export Options</div>
                            <button
                                onClick={() => {
                                    handleExportNoteData(selectedNote.uuid, selectedNote.title, 'raw');
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[9px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faFileLines} className="text-slate-400 w-3 text-center" />
                                Raw File Export
                            </button>
                            <button
                                onClick={() => {
                                    handleExportNoteData(selectedNote.uuid, selectedNote.title, 'json');
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[9px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faFileCode} className="text-slate-400 w-3 text-center" />
                                JSON Backup
                            </button>
                            
                            {/* Restrict CSV Export */}
                            {['todo', 'list', 'log', 'xpnc'].includes(mode) && (
                                <button
                                    onClick={() => {
                                        handleExportNoteData(selectedNote.uuid, selectedNote.title, 'csv');
                                        setEditorMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[9px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <FontAwesomeIcon icon={faFileCsv} className="text-slate-400 w-3 text-center" />
                                    CSV Spreadsheet
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    handleExportNoteData(selectedNote.uuid, selectedNote.title, 'db');
                                    setEditorMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[9px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faDatabase} className="text-slate-400 w-3 text-center" />
                                SQLite Database (.db)
                            </button>
                            <div className="border-t border-black/5 dark:border-white/5 my-1" />
                            <button
                                onClick={() => {
                                    setEditorMenuOpen(false);
                                    confirm(`Delete note "${selectedNote.title}"? This will delete all its checklist items permanently.`) && onDeleteNote(selectedNote.uuid);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-955/30 dark:hover:text-rose-400 text-[10px] text-rose-500 dark:text-rose-400 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="text-rose-450 dark:text-rose-400 w-3 text-center" />
                                Delete Note
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className={`w-full h-full border ${isDarkMode ? 'border-black/15 bg-slate-900 shadow-2xl text-slate-200' : 'border-black/10 bg-slate-50 shadow-xl text-slate-800'} rounded-2xl flex flex-col overflow-hidden transition-all duration-300`}>
            {/* Custom Titlebar */}
            <div className={`h-9 ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 border-b border-black/5 text-slate-700'} flex items-center justify-between px-4 select-none flex-shrink-0`} style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilePen} className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-xs`} />
                    <span className={`text-[11px] font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-350' : 'text-slate-600'}`}>Notepad</span>
                </div>
                <div className="flex items-center gap-1.5 no-drag">
                    <button 
                        onClick={() => setSettingsOpen(true)}
                        className={`w-6 h-6 ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'} rounded flex items-center justify-center transition-colors cursor-pointer`}
                        title="Preferences"
                    >
                        <FontAwesomeIcon icon={faGear} className="text-xs" />
                    </button>
                    <button 
                        onClick={() => setIsHelpOpen(true)}
                        className={`w-6 h-6 ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'} rounded flex items-center justify-center transition-colors cursor-pointer`}
                        title="Help & Shortcuts"
                    >
                        <FontAwesomeIcon icon={faCircleQuestion} className="text-[11px]" />
                    </button>
                    <button 
                        onClick={onToggleDarkMode} 
                        className={`w-6 h-6 ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'} rounded flex items-center justify-center transition-colors cursor-pointer`}
                        title="Toggle Day/Night Theme"
                    >
                        <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="text-xs" />
                    </button>
                    <button 
                        onClick={handleMinimize} 
                        className={`w-6 h-6 ${isDarkMode ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'} rounded flex items-center justify-center transition-colors cursor-pointer`}
                        title="Minimize"
                    >
                        <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                    </button>
                    <button 
                        onClick={handleMaximize} 
                        className={`w-6 h-6 ${isDarkMode ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'} rounded flex items-center justify-center transition-colors cursor-pointer`}
                        title="Maximize"
                    >
                        <FontAwesomeIcon icon={faExpand} className="text-[10px]" />
                    </button>
                    <button 
                        onClick={handleClose} 
                        className={`w-6 h-6 hover:bg-rose-600 rounded flex items-center justify-center transition-colors cursor-pointer ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-white'}`}
                        title="Quit Application"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                </div>
            </div>

            {/* Main App Workspace */}
            <div className="flex-1 flex min-h-0 bg-slate-55 dark:bg-slate-950 text-xs relative">
                
                {/* UNIFIED SIDEBAR: File & Notebook Tree View */}
                {sidebarCollapsed ? (
                    <div className="w-12 border-r border-black/[0.06] dark:border-white/[0.06] bg-slate-100/35 dark:bg-slate-950/35 backdrop-blur-xl flex flex-col items-center py-4 justify-between select-none flex-shrink-0 shadow-sm transition-all duration-350">
                        <div className="flex flex-col items-center gap-4 w-full">
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
                                title="Expand Explorer Sidebar"
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                            </button>
                            <div className="w-8 border-t border-black/[0.06] dark:border-white/[0.06]" />
                            <div className="flex flex-col items-center gap-2 w-full overflow-y-auto scrollbar-none px-1">
                                {allFolders.map(f => {
                                    const isFolderExpanded = expandedFolders[f.uuid];
                                    return (
                                        <button
                                            key={f.uuid}
                                            onClick={() => {
                                                setSidebarCollapsed(false);
                                                setExpandedFolders(prev => ({ ...prev, [f.uuid]: !prev[f.uuid] }));
                                                setActiveFolderUuid(f.uuid);
                                            }}
                                            title={f.name}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative group ${
                                                activeFolderUuid === f.uuid
                                                    ? 'bg-indigo-600/10 text-indigo-600 dark:bg-white/10 dark:text-white shadow-xs border border-indigo-500/20 dark:border-white/15'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={isFolderExpanded ? faFolderOpen : faFolder} className="text-xs" />
                                            {/* Tooltip */}
                                            <div className="absolute left-12 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded-md shadow-lg pointer-events-none transition-all duration-150 z-50 whitespace-nowrap">
                                                {f.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                        style={{ width: `${sidebarWidth}px` }} 
                        className="border-r border-black/[0.06] dark:border-white/[0.06] bg-slate-100/35 dark:bg-slate-950/35 backdrop-blur-xl flex flex-col p-3.5 min-h-0 justify-between select-none flex-shrink-0 shadow-sm transition-all duration-350 text-xs"
                    >
                        <div className="flex flex-col min-h-0">
                            {/* Explorer Header */}
                            <div className="flex items-center justify-between mb-3 px-0.5 flex-shrink-0 border-b border-black/[0.05] dark:border-white/[0.05] pb-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-indigo-500 dark:text-indigo-400 text-[10px]" />
                                    Workspace
                                </span>
                                <div className="flex items-center gap-0.5 bg-black/[0.03] dark:bg-white/[0.03] p-0.5 rounded-lg border border-black/[0.05] dark:border-white/[0.05]">
                                    <button
                                        onClick={handleExpandAllFolders}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="Expand All Folders"
                                    >
                                        <FontAwesomeIcon icon={faFolderOpen} className="text-[8px]" />
                                    </button>
                                    <button
                                        onClick={handleCollapseAllFolders}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-455 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="Collapse All Folders"
                                    >
                                        <FontAwesomeIcon icon={faFolder} className="text-[8px]" />
                                    </button>
                                    <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/10 mx-0.5" />
                                    <button
                                        onClick={handleOpenFileSelection}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="Open File(s)"
                                    >
                                        <FontAwesomeIcon icon={faFilePen} className="text-[8px]" />
                                    </button>
                                    <button
                                        onClick={handleOpenWorkspaceFolder}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="Open Folder"
                                    >
                                        <FontAwesomeIcon icon={faFolderOpen} className="text-[8px]" />
                                    </button>
                                    <button
                                        onClick={handleAutoCreateFolder}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="New Notebook"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[8px]" />
                                    </button>
                                    <div className="w-[1px] h-2.5 bg-black/10 dark:bg-white/10 mx-0.5" />
                                    <button
                                        onClick={() => setSidebarCollapsed(true)}
                                        className="w-5 h-5 flex items-center justify-center rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all cursor-pointer"
                                        title="Collapse Sidebar"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="text-[8px]" />
                                    </button>
                                </div>
                            </div>

                            {/* Search bar inside Sidebar */}
                            <div className="relative mb-2.5 flex-shrink-0">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400 dark:text-slate-500">
                                    <FontAwesomeIcon icon={faSearch} className="text-[9px]" />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search workspace files..."
                                    className="w-full text-[10px] pl-7 pr-7 py-1.5 bg-white/70 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 transition-all focus:bg-white dark:focus:bg-slate-900 input-glow"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                        title="Clear search"
                                    >
                                        <FontAwesomeIcon icon={faXmark} className="text-[8px]" />
                                    </button>
                                )}
                            </div>

                            {/* Workspace Sorting selector */}
                            <div className="flex items-center justify-between mb-2.5 px-2 py-1 bg-white/40 dark:bg-slate-900/30 border border-black/[0.05] dark:border-white/[0.05] rounded-lg text-[9px] text-slate-500 select-none flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faSort} className="text-indigo-400 dark:text-indigo-400 text-[9px]" />
                                    <span className="font-bold uppercase tracking-widest text-[8px] text-slate-400 dark:text-slate-500">Sort Order</span>
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none text-slate-750 dark:text-slate-300 font-bold focus:outline-none cursor-pointer text-[9px] py-0.5 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                                >
                                    <option value="custom" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Custom Order</option>
                                    <option value="alpha-asc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">A - Z</option>
                                    <option value="alpha-desc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Z - A</option>
                                    <option value="newest" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Newest</option>
                                    <option value="oldest" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Oldest</option>
                                    <option value="priority" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Priority</option>
                                    <option value="theme" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">Color Theme</option>
                                </select>
                            </div>

                            {/* Tree View list */}
                            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none pr-0.5">
                                {allFolders.map(folder => {
                                    const isFolderExpanded = expandedFolders[folder.uuid] || searchQuery.trim().length > 0;
                                    const isFolderActive = folder.uuid === activeFolderUuid;
                                    
                                    // Get pre-sorted notes for this folder
                                    const sortedFolderNotes = sortedNotesByFolder[folder.uuid] || [];
                                    const totalNotesInFolderCount = notesCountByFolder[folder.uuid] || 0;

                                    // If search query is active and neither the folder matches nor has children, skip rendering
                                    if (searchQuery.trim().length > 0 && sortedFolderNotes.length === 0 && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                                        return null;
                                    }

                                    const isDraggingOver = draggingOverFolderUuid === folder.uuid;

                                    return (
                                        <div key={folder.uuid} className="flex flex-col">
                                            {/* Folder Row */}
                                            <div
                                                onClick={() => {
                                                    setExpandedFolders(prev => ({ ...prev, [folder.uuid]: !prev[folder.uuid] }));
                                                    setActiveFolderUuid(folder.uuid);
                                                }}
                                                onDragOver={(e) => handleDragOverFolder(e, folder.uuid)}
                                                onDragLeave={handleDragLeaveFolder}
                                                onDrop={(e) => handleDropFolder(e, folder.uuid)}
                                                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 explorer-item-hover ${
                                                    isDraggingOver 
                                                        ? 'drag-pulse ring-2 ring-indigo-500 border-indigo-500 shadow-md scale-[1.02]' 
                                                        : ''
                                                } ${
                                                    isFolderActive
                                                        ? 'bg-slate-200/50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 border-l-2 border-indigo-500 dark:border-indigo-400 font-semibold shadow-xs'
                                                        : 'text-slate-655 dark:text-slate-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] font-medium'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {/* Caret Chevron for premium folder expand indicators */}
                                                    <FontAwesomeIcon 
                                                        icon={faChevronRight} 
                                                        className={`text-[7.5px] opacity-60 caret-transition mr-0.5 ${
                                                            isFolderExpanded ? `rotate-90 ${folderColorClasses[folder.color || 'indigo']}` : 'text-slate-400 dark:text-slate-500'
                                                        }`}
                                                    />
                                                    <FontAwesomeIcon 
                                                        icon={isFolderExpanded ? faFolderOpen : faFolder} 
                                                        className={`text-xs transition-colors duration-200 ${folderColorClasses[folder.color || 'indigo']}`} 
                                                    />
                                                    {editingFolderUuid === folder.uuid ? (
                                                        <input
                                                            type="text"
                                                            value={folderRenameVal}
                                                            onChange={e => setFolderRenameVal(e.target.value)}
                                                            onBlur={() => commitFolderRename(folder.uuid)}
                                                            onKeyDown={e => e.key === 'Enter' && commitFolderRename(folder.uuid)}
                                                            maxLength={20}
                                                            autoFocus
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded px-1.5 py-0.5 text-[10px] focus:outline-none border border-black/10 dark:border-white/10 input-glow"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="truncate max-w-[100px] text-[11px]">{folder.name}</span>
                                                            <span className="text-[8px] bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full font-bold select-none leading-none flex items-center justify-center">
                                                                {totalNotesInFolderCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingFolderUuid !== folder.uuid && (
                                                    <div className={`flex items-center gap-0.5 ${activeFolderPaletteUuid === folder.uuid ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100'}`}>
                                                        {/* Add note directly in this folder */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAutoCreateNote(folder.uuid);
                                                            }}
                                                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                                                            title="Add Note"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} className="text-[8px]" />
                                                        </button>
                                                        {/* Rename Folder */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startFolderRename(folder); }}
                                                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                                                            title="Rename notebook"
                                                        >
                                                            <FontAwesomeIcon icon={faPen} className="text-[8px]" />
                                                        </button>

                                                        {/* Folder Color Palette Button */}
                                                        <div className="relative flex items-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveFolderPaletteUuid(activeFolderPaletteUuid === folder.uuid ? null : folder.uuid);
                                                                }}
                                                                className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${activeFolderPaletteUuid === folder.uuid ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'} cursor-pointer`}
                                                                title="Change Folder Color"
                                                            >
                                                                <FontAwesomeIcon icon={faPalette} className="text-[8px]" />
                                                            </button>
                                                            {activeFolderPaletteUuid === folder.uuid && (
                                                                <div className="absolute top-5 right-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                                    <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveFolderPaletteUuid(null); }} />
                                                                    <div className="relative bg-white dark:bg-slate-900 shadow-xl border border-black/10 dark:border-white/10 rounded-full p-1.5 flex gap-1.5 items-center z-50">
                                                                        {['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet'].map(color => {
                                                                            const colorMap = {
                                                                                indigo: 'bg-indigo-500 border-indigo-600',
                                                                                rose: 'bg-rose-500 border-rose-600',
                                                                                amber: 'bg-amber-500 border-amber-600',
                                                                                emerald: 'bg-emerald-500 border-emerald-600',
                                                                                sky: 'bg-sky-500 border-sky-600',
                                                                                violet: 'bg-violet-500 border-violet-600'
                                                                            };
                                                                            return (
                                                                                <button
                                                                                    key={color}
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleUpdateFolderColor(folder.uuid, color);
                                                                                        setActiveFolderPaletteUuid(null);
                                                                                    }}
                                                                                    className={`w-3.5 h-3.5 rounded-full border shadow-xs hover:scale-125 transition-transform cursor-pointer ${colorMap[color]}`}
                                                                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                                                                />
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Delete Folder */}
                                                        {folder.uuid !== 'folder_1' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    confirm(`Wipe notebook "${folder.name}" and all notes inside it permanently?`) && onDeleteFolder(folder.uuid);
                                                                }}
                                                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-955/40 text-rose-505 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                                                                title="Delete notebook"
                                                            >
                                                                <FontAwesomeIcon icon={faTrashCan} className="text-[8px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nested Notes (if expanded) */}
                                            {isFolderExpanded && (
                                                <div className="pl-2.5 flex flex-col gap-0.5 mt-1 border-l border-black/[0.06] dark:border-white/[0.06] ml-3.5 space-y-0.5 transition-all duration-200">
                                                    {sortedFolderNotes.map((n, idx) => {
                                                        const isNoteSelected = n.uuid === selectedNoteUuid;
                                                        
                                                        // Priority flag dot background classes
                                                        const themeIndicatorClasses = {
                                                            yellow: 'bg-amber-405 border-amber-500',
                                                            pink: 'bg-rose-450 border-rose-500',
                                                            red: 'bg-rose-505 border-rose-600',
                                                            blue: 'bg-sky-400 border-sky-500',
                                                            green: 'bg-emerald-400 border-emerald-500',
                                                            indigo: 'bg-indigo-400 border-indigo-500',
                                                            rose: 'bg-rose-400 border-rose-500',
                                                            amber: 'bg-amber-400 border-amber-500',
                                                            emerald: 'bg-emerald-400 border-emerald-500',
                                                            sky: 'bg-sky-400 border-sky-500',
                                                            violet: 'bg-violet-400 border-violet-500'
                                                        };

                                                        return (
                                                            <div
                                                                key={n.uuid}
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData('text/plain', n.uuid);
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }}
                                                                onClick={() => setSelectedNoteUuid(n.uuid)}
                                                                className={`group/note flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-all border explorer-item-hover ${getNoteClasses(n, isNoteSelected)}`}
                                                            >
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    {openNoteUuids.includes(n.uuid) && (
                                                                        <FontAwesomeIcon
                                                                            icon={faEye}
                                                                            className="text-indigo-500 dark:text-indigo-400 text-[8.5px] flex-shrink-0"
                                                                            title="Currently open"
                                                                        />
                                                                    )}

                                                                    <FontAwesomeIcon
                                                                        icon={getFileIcon(n.title)}
                                                                        className={`text-[9px] flex-shrink-0 opacity-85 ${getFileIconColorClass(n.title, isNoteSelected)}`}
                                                                    />

                                                                    {n.isPinned && (
                                                                        <FontAwesomeIcon
                                                                            icon={faThumbtack}
                                                                            className="text-[7.5px] flex-shrink-0 text-amber-550 rotate-45"
                                                                            title="Pinned to top"
                                                                        />
                                                                    )}

                                                                    {editingNoteUuid === n.uuid ? (
                                                                        <input
                                                                            type="text"
                                                                            value={noteRenameVal}
                                                                            onChange={e => setNoteRenameVal(e.target.value)}
                                                                            onBlur={() => commitNoteRename(n.uuid)}
                                                                            onKeyDown={e => e.key === 'Enter' && commitNoteRename(n.uuid)}
                                                                            maxLength={25}
                                                                            autoFocus
                                                                            onClick={e => e.stopPropagation()}
                                                                            className="w-[120px] bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded px-1.5 py-0.5 text-[10px] focus:outline-none border border-black/10 dark:border-white/10 input-glow"
                                                                        />
                                                                    ) : (
                                                                        <span 
                                                                            className={`text-[10.5px] truncate max-w-[130px] ${
                                                                                isNoteSelected ? 'text-slate-800 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-350'
                                                                            }`}
                                                                            title={n.title}
                                                                        >
                                                                            {n.title}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Hover Action Buttons */}
                                                                {editingNoteUuid !== n.uuid && (
                                                                    <div className={`flex items-center gap-0.5 ${activeNotePaletteUuid === n.uuid ? 'opacity-100' : 'opacity-0 group-hover/note:opacity-100 transition-all duration-150 transform scale-90 group-hover/note:scale-100'}`}>
                                                                        {/* Swap custom orders */}
                                                                        {sortBy === 'custom' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => handleMoveNoteUp(idx, e)}
                                                                                    disabled={idx === 0}
                                                                                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${idx === 0 ? 'opacity-30 pointer-events-none' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                                                    title="Move Up"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faArrowUp} className="text-[7px]" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => handleMoveNoteDown(idx, e)}
                                                                                    disabled={idx === sortedFolderNotes.length - 1}
                                                                                    className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${idx === sortedFolderNotes.length - 1 ? 'opacity-30 pointer-events-none' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                                                    title="Move Down"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faArrowDown} className="text-[7px]" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {/* Pin Note */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); onToggleNotePin(n.uuid, n.isPinned); }}
                                                                            className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${n.isPinned ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                                                            title={n.isPinned ? "Unpin note" : "Pin note to top"}
                                                                        >
                                                                            <FontAwesomeIcon icon={faThumbtack} className="text-[7px]" />
                                                                        </button>

                                                                        {/* Note Color Palette Button */}
                                                                        <div className="relative flex items-center">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveNotePaletteUuid(activeNotePaletteUuid === n.uuid ? null : n.uuid);
                                                                                }}
                                                                                className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${activeNotePaletteUuid === n.uuid ? 'text-indigo-550 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'} cursor-pointer`}
                                                                                title="Change Note Color"
                                                                            >
                                                                                <FontAwesomeIcon icon={faPalette} className="text-[7px]" />
                                                                            </button>
                                                                            {activeNotePaletteUuid === n.uuid && (
                                                                                <div className="absolute top-5 right-0 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                                                    <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveNotePaletteUuid(null); }} />
                                                                                    <div className="relative bg-white dark:bg-slate-900 shadow-xl border border-black/10 dark:border-white/10 rounded-full p-1.5 flex gap-1.5 items-center z-50">
                                                                                        {['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet'].map(color => {
                                                                                            const colorMap = {
                                                                                                indigo: 'bg-indigo-500 border-indigo-600',
                                                                                                rose: 'bg-rose-500 border-rose-600',
                                                                                                amber: 'bg-amber-500 border-amber-600',
                                                                                                emerald: 'bg-emerald-500 border-emerald-600',
                                                                                                sky: 'bg-sky-500 border-sky-600',
                                                                                                violet: 'bg-violet-500 border-violet-600'
                                                                                            };
                                                                                            return (
                                                                                                <button
                                                                                                    key={color}
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        onChangeNoteTheme(n.uuid, color);
                                                                                                        setActiveNotePaletteUuid(null);
                                                                                                    }}
                                                                                                    className={`w-3.5 h-3.5 rounded-full border shadow-xs hover:scale-125 transition-transform cursor-pointer ${colorMap[color]}`}
                                                                                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                                                                                />
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Rename */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); startNoteRename(n); }}
                                                                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                                                            title="Rename file"
                                                                        >
                                                                            <FontAwesomeIcon icon={faPen} className="text-[7px]" />
                                                                        </button>
                                                                        {/* Delete */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                confirm(`Delete note "${n.title}"?`) && onDeleteNote(n.uuid);
                                                                            }}
                                                                            className="p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-955/30 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 cursor-pointer"
                                                                            title="Delete file"
                                                                        >
                                                                            <FontAwesomeIcon icon={faTrashCan} className="text-[7px]" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {sortedFolderNotes.length === 0 && (
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic pl-3.5 py-0.5">Empty notebook</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Footer Controls */}
                        <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] flex-shrink-0 flex items-center gap-2">
                            <button
                                onClick={() => handleAutoCreateNote()}
                                className="flex-1 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1 animate-in fade-in duration-200"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-[8px]" /> Note
                            </button>
                            <button
                                onClick={handleAutoCreateFolder}
                                className="flex-1 py-1.5 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-655 dark:text-slate-350 border border-black/10 dark:border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 animate-in fade-in duration-200"
                            >
                                <FontAwesomeIcon icon={faFolder} className="text-[8px]" /> Notebook
                            </button>
                        </div>
                    </div>
                )}

                {/* Resize Handle for Explorer Sidebar */}
                {!sidebarCollapsed && (
                    <div 
                        onMouseDown={handleSidebarResizeStart}
                        className="w-1 cursor-col-resize hover:bg-indigo-500/50 bg-black/[0.03] hover:w-[6px] hover:-mx-[1px] transition-all duration-150 z-30 select-none flex-shrink-0"
                        title="Drag to resize Explorer"
                    />
                )}

                {/* COLUMN 3: Note Editor Workspace */}
                <div className={`flex-1 flex flex-col p-1 overflow-hidden min-h-0 select-text transition-all duration-350 ${selectedNote ? editorBodyBgClasses[selectedNote.theme] || 'bg-slate-100/30' : 'bg-slate-100/30'}`}>
                    
                    {/* Horizontal Tab Bar */}
                    {openNoteUuids.length > 0 && (
                        <div className={`relative flex items-center border-b ${isDarkMode ? 'border-white/5 bg-slate-900/40' : 'border-black/5 bg-slate-100/50'} pb-0 mb-0.5 select-none flex-shrink-0`}>
                            {/* Scrollable Tabs Wrapper */}
                            <div 
                                onWheel={handleTabBarWheel}
                                className="flex-1 flex items-center overflow-x-auto scrollbar-none pb-0 px-0.5 gap-0.5 flex-nowrap min-w-0"
                            >
                                {openNoteUuids.map(uuid => {
                                    const tabNote = notesMap[uuid];
                                    if (!tabNote) return null;
                                    const isActive = uuid === selectedNoteUuid;
                                    
                                    const themeDotColors = {
                                        yellow: 'bg-amber-400 border border-amber-500/20',
                                        amber: 'bg-amber-400 border border-amber-500/20',
                                        pink: 'bg-rose-455 border border-rose-500/20',
                                        red: 'bg-rose-505 border border-rose-600/20',
                                        rose: 'bg-rose-500 border border-rose-600/20',
                                        blue: 'bg-sky-400 border border-sky-500/20',
                                        sky: 'bg-sky-400 border border-sky-500/20',
                                        green: 'bg-emerald-400 border border-emerald-500/20',
                                        emerald: 'bg-emerald-400 border border-emerald-500/20',
                                        indigo: 'bg-indigo-400 border border-indigo-500/20',
                                        violet: 'bg-violet-400 border border-violet-500/20'
                                    };

                                    const borderColors = {
                                        yellow: '#f59e0b',
                                        amber: '#d97706',
                                        pink: '#e11d48',
                                        red: '#dc2626',
                                        rose: '#e11d48',
                                        blue: '#0284c7',
                                        sky: '#0284c7',
                                        green: '#059669',
                                        emerald: '#059669',
                                        indigo: '#4f46e5',
                                        violet: '#7c3aed'
                                    };
                                    
                                    return (
                                        <div
                                            key={uuid}
                                            id={`tab-${uuid}`}
                                            onClick={() => setSelectedNoteUuid(uuid)}
                                            className={`group flex items-center gap-1 px-2 py-0.5 rounded-t-md border border-b-0 cursor-pointer transition-all duration-200 text-[9px] font-extrabold flex-shrink-0 ${getTabClasses(tabNote, isActive)}`}
                                            style={isActive ? { borderTopColor: borderColors[tabNote.theme] || '#f59e0b', borderTopWidth: '2px' } : {}}
                                        >
                                            <span className="truncate max-w-[85px]">{tabNote.title}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCloseTab(uuid, e);
                                                }}
                                                className="p-0.5 rounded-full text-slate-400 hover:bg-black/15 dark:hover:bg-white/15 hover:text-rose-550 transition-colors opacity-60 group-hover:opacity-100"
                                            >
                                                <FontAwesomeIcon icon={faXmark} className="text-[6px]" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Dropdown for All Open Tabs */}
                            {openNoteUuids.length > 1 && (
                                <div className="relative flex-shrink-0 px-1 border-l border-black/5 dark:border-white/5">
                                    <button
                                        onClick={() => {
                                            setIsOpenTabsMenuOpen(prev => {
                                                if (prev) setTabSearchQuery('');
                                                return !prev;
                                            });
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center"
                                        title="View All Open Tabs"
                                    >
                                        <FontAwesomeIcon icon={faChevronDown} className="text-[8px]" />
                                    </button>
                                    
                                    {isOpenTabsMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => { setIsOpenTabsMenuOpen(false); setTabSearchQuery(''); }} />
                                            <div className="absolute right-1 top-full mt-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 w-48 max-h-60 overflow-y-auto scrollbar-none z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                                <div className="px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5 mb-1 flex items-center justify-between">
                                                    <span>Open Tabs ({openNoteUuids.length})</span>
                                                </div>
                                                <div className="px-2 py-1 border-b border-black/5 dark:border-white/5 sticky top-0 bg-white dark:bg-slate-900 z-10">
                                                    <div className="relative flex items-center">
                                                        <FontAwesomeIcon icon={faSearch} className="absolute left-2 text-[8px] text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search tabs..."
                                                            value={tabSearchQuery}
                                                            onChange={(e) => setTabSearchQuery(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full pl-6 pr-4 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-sm focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                                                        />
                                                        {tabSearchQuery && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTabSearchQuery('');
                                                                }}
                                                                className="absolute right-1 text-slate-400 hover:text-slate-655"
                                                            >
                                                                <FontAwesomeIcon icon={faXmark} className="text-[7.5px]" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {(() => {
                                                    const filtered = openNoteUuids.filter(uuid => {
                                                        const tabNote = notesMap[uuid];
                                                        if (!tabNote) return false;
                                                        return tabNote.title.toLowerCase().includes(tabSearchQuery.toLowerCase());
                                                    });
                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div className="px-2.5 py-2.5 text-[9px] text-slate-400 italic text-center">
                                                                No matches found
                                                            </div>
                                                        );
                                                    }
                                                    return filtered.map(uuid => {
                                                        const tabNote = notesMap[uuid];
                                                        if (!tabNote) return null;
                                                        const isActive = uuid === selectedNoteUuid;
                                                        const themeIndicatorClasses = {
                                                            yellow: 'bg-amber-405 border-amber-500',
                                                            pink: 'bg-rose-450 border-rose-500',
                                                            red: 'bg-rose-505 border-rose-600',
                                                            blue: 'bg-sky-400 border-sky-500',
                                                            green: 'bg-emerald-400 border-emerald-500',
                                                            indigo: 'bg-indigo-400 border-indigo-500',
                                                            rose: 'bg-rose-400 border-rose-500',
                                                            amber: 'bg-amber-400 border-amber-500',
                                                            emerald: 'bg-emerald-400 border-emerald-500',
                                                            sky: 'bg-sky-400 border-sky-500',
                                                            violet: 'bg-violet-400 border-violet-500'
                                                        };
                                                        return (
                                                            <button
                                                                key={uuid}
                                                                onClick={() => {
                                                                    setSelectedNoteUuid(uuid);
                                                                    setIsOpenTabsMenuOpen(false);
                                                                    setTabSearchQuery('');
                                                                }}
                                                                className={`w-full text-left px-2.5 py-1 text-[10px] flex items-center justify-between gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                                                                    isActive ? 'font-semibold text-indigo-650 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20' : 'text-slate-655 dark:text-slate-350'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5 truncate">
                                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${themeIndicatorClasses[tabNote.theme] || 'bg-slate-300'}`} />
                                                                    <span className="truncate">{tabNote.title}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCloseTab(uuid, e);
                                                                        if (isActive && openNoteUuids.length === 1) {
                                                                            setIsOpenTabsMenuOpen(false);
                                                                            setTabSearchQuery('');
                                                                        }
                                                                    }}
                                                                    className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                                >
                                                                    <FontAwesomeIcon icon={faXmark} className="text-[7px]" />
                                                                </button>
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!selectedNote ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-100/10 dark:bg-slate-900/10 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 shadow-inner select-none animate-in fade-in duration-300">
                            <div className="max-w-md flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-3xl shadow-md border border-indigo-500/25">
                                    <FontAwesomeIcon icon={faFilePen} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Welcome to Notepad++ Alternative</h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    An offline, lightweight desktop editor for text and code formats. Get started by opening a file from the sidebar explorer, or create a new file or folder.
                                </p>
                                <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    <button
                                         onClick={() => handleAutoCreateNote()}
                                         className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                                     >
                                         <FontAwesomeIcon icon={faPlus} /> New File
                                     </button>
                                     <button
                                         onClick={handleAutoCreateFolder}
                                         className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-black/10 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                                     >
                                         <FontAwesomeIcon icon={faFolder} /> New Notebook
                                     </button>
                                    <button
                                        onClick={() => setIsHelpOpen(true)}
                                        className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-black/10 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                                    >
                                        <FontAwesomeIcon icon={faCircleQuestion} /> Help & Shortcuts
                                    </button>
                                </div>
                                <div className="w-full border-t border-black/5 dark:border-white/5 my-2" />
                                <div className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold space-y-1">
                                    <div>Press <kbd className="bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded border border-black/10">Ctrl + F</kbd> in edit mode to search/replace</div>
                                    <div>Drag and drop local files into the sidebar tree to import them</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            
                            {/* Dynamic Workspace Mount based on Title Extension */}
                            <div className="flex-1 flex min-h-0 gap-2 overflow-hidden">
                                {(() => {
                                    if (mode === 'todo' || mode === 'list') {
                                        return (
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-1 pt-0.5 rounded-xl border border-black/10 dark:border-white/10 mb-0.5 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <div className="flex justify-between items-center mb-1 select-none">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-555">
                                                        {mode === 'todo' ? 'Tasks Checklist (.todo)' : 'Simple Checklist (.list)'}
                                                    </span>
                                                    {renderActionsMenu()}
                                                </div>
                                                <TaskForm onAddTask={handleAddTask} />
                                                <TaskList 
                                                    tasks={tasks} 
                                                    onToggleTask={handleToggleTask} 
                                                    onDeleteTask={handleDeleteTask} 
                                                />
                                                {tasks.length > 0 && (
                                                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex justify-end flex-shrink-0 select-none">
                                                        <button
                                                            onClick={handleClearCompleted}
                                                            className="px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-[9px] font-bold text-slate-600 dark:text-slate-350 cursor-pointer flex items-center gap-1 opacity-85 transition-colors"
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
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-1 pt-0.5 rounded-xl border border-black/10 dark:border-white/10 mb-0.5 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <div className="flex justify-between items-center mb-1 select-none">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-555">
                                                        Events Log (.log)
                                                    </span>
                                                    {renderActionsMenu()}
                                                </div>
                                                <EventForm onAddEvent={(text) => addEvent(selectedNoteUuid, text)} />
                                                <EventList 
                                                    events={events} 
                                                    onDeleteEvent={(id) => deleteEvent(id)} 
                                                />
                                            </div>
                                        );
                                    }
                                    
                                    if (mode === 'xpnc') {
                                        return (
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-1 pt-0.5 rounded-xl border border-black/10 dark:border-white/10 mb-0.5 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <div className="flex justify-between items-center mb-1 select-none">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-555">
                                                        Expenses Tracker (.xpnc)
                                                    </span>
                                                    {renderActionsMenu()}
                                                </div>
                                                <ExpenseForm onAddExpense={(amount, cat, desc) => addExpense(selectedNoteUuid, amount, cat, desc)} />
                                                <ExpenseList 
                                                    expenses={expenses} 
                                                    onDeleteExpense={(id) => deleteExpense(id)} 
                                                />
                                            </div>
                                        );
                                    }
                                    
                                    // Markdown & Code text formats use the same premium GenericEditorWorkspace
                                    return (
                                        <GenericEditorWorkspace 
                                            text={markdownText} 
                                            onUpdate={(text) => handleUpdateMarkdown(text)} 
                                            language={mode} 
                                            isCompact={false}
                                            editorPrefs={editorPrefs}
                                            actionsMenu={renderActionsMenu()}
                                        />
                                    );
                                })()}

                                {/* VCS Version History Slide-out Panel */}
                                {showVcsPanel && (
                                    <VCSHistoryPanel
                                        noteUuid={selectedNoteUuid}
                                        activeTitle={selectedNote.title}
                                        activeContent={markdownText}
                                        getVcsCommits={getVcsCommits}
                                        addVcsCommit={addVcsCommit}
                                        restoreVcsCommit={restoreVcsCommit}
                                        onClose={() => setShowVcsPanel(false)}
                                    />
                                )}
                            </div>

                        </div>
                    )}
                </div>

                {/* Settings Panel Modal Overlay */}
                <SettingsPanel
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    appName="Notepad"
                    onResetDatabase={resetDatabase}
                    onExport={triggerJsonExport}
                    onImport={triggerJsonImport}
                    db={db}
                    onTriggerRefresh={onTriggerRefresh}
                    
                    // Widget/Note Management Props
                    allWidgets={allNotes}
                    currentWidgetId={null}
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

                {/* Expanded Detailed Help Modal Overlay */}
                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                />

                <DiffViewerModal
                    isOpen={compareOpen}
                    onClose={() => setCompareOpen(false)}
                    currentNote={selectedNote}
                    allNotes={allNotes}
                    db={db}
                    isDarkMode={isDarkMode}
                />

            {/* SQL Results Modal */}
            {sqlModalOpen && (
                <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 select-text">
                    <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-inner">
                                    <FontAwesomeIcon icon={faDatabase} className="text-sm" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">SQL Execution Results</h3>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Preview query outputs and affected metadata</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSqlModalOpen(false)}
                                className="w-7 h-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                                title="Close modal"
                            >
                                <FontAwesomeIcon icon={faXmark} className="text-xs" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-5 overflow-y-auto min-h-0 space-y-4">
                            {sqlResult?.error ? (
                                <div className="p-4 bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-950 rounded-xl flex items-start gap-3 text-left">
                                    <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">!</div>
                                    <div className="space-y-1">
                                        <h4 className="text-[11px] font-bold text-rose-700 dark:text-rose-455">Execution Error</h4>
                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono break-all">{sqlResult.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Success Header / Metadata */}
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-850/30 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2.5 text-left">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Status: <strong className="text-slate-700 dark:text-slate-200">Success</strong>
                                        </span>
                                        <span className="w-[1px] h-3 bg-black/10 dark:bg-white/10 hidden sm:inline" />
                                        <span>
                                            Rows Affected: <strong className="text-slate-700 dark:text-slate-200">{sqlResult?.rowsAffected || 0}</strong>
                                        </span>
                                        <span className="w-[1px] h-3 bg-black/10 dark:bg-white/10 hidden sm:inline" />
                                        <span>
                                            Rows Returned: <strong className="text-slate-700 dark:text-slate-200">{sqlResult?.rows?.length || 0}</strong>
                                        </span>
                                    </div>

                                    {/* Tabular Output */}
                                    {sqlResult?.columns?.length > 0 ? (
                                        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto max-h-[45vh]">
                                                <table className="w-full text-left text-[11px] border-collapse">
                                                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-black/10 dark:border-white/10 select-none">
                                                        <tr>
                                                            {sqlResult.columns.map((col, idx) => (
                                                                <th
                                                                    key={idx}
                                                                    className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r border-black/[0.05] dark:border-white/[0.05] last:border-r-0"
                                                                >
                                                                    {col}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                                                        {sqlResult.rows.map((row, rowIdx) => (
                                                            <tr
                                                                key={rowIdx}
                                                                className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                            >
                                                                {row.map((val, colIdx) => (
                                                                    <td
                                                                        key={colIdx}
                                                                        className="px-4 py-2 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 border-r border-black/[0.05] dark:border-white/[0.05] last:border-r-0 whitespace-nowrap"
                                                                    >
                                                                        {val === null ? (
                                                                            <span className="text-slate-400 dark:text-slate-600 italic">NULL</span>
                                                                        ) : typeof val === 'object' ? (
                                                                            JSON.stringify(val)
                                                                        ) : (
                                                                            String(val)
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-950/20 border border-dashed border-black/10 dark:border-white/10 rounded-2xl select-none">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg mb-3 shadow-inner">✓</div>
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Query Executed Successfully</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
                                                The script did not return any tabular result sets (e.g., INSERT, UPDATE, DELETE, or ALTER statement).
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-955/20 flex justify-end flex-shrink-0 select-none">
                            <button
                                onClick={() => setSqlModalOpen(false)}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleOpenFileInputChange}
                    multiple
                    className="hidden"
                    accept=".md,.todo,.list,.log,.xpnc,.html,.css,.js,.jsx,.ts,.tsx,.java,.xml,.json,.sql,.properties,.yml,.yaml,.txt,.b64"
                />
            </div>
        </div>
    );
}
