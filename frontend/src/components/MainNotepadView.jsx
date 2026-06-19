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
    faCalendarDay,
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
    faDatabase
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
    
    ipcRenderer
}) {
    const [activeFolderUuid, setActiveFolderUuid] = useState('folder_1');
    const [selectedNoteUuid, setSelectedNoteUuid] = useState(null);
    const [showVcsPanel, setShowVcsPanel] = useState(false);
    const [editorMenuOpen, setEditorMenuOpen] = useState(false);

    // Unified sidebar states
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState({ 'folder_1': true });

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
            const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml'];
            if (supported.includes(ext)) {
                return ext === 'yaml' ? 'yml' : ext;
            }
        }
        return 'md';
    };

    const [editingFolderUuid, setEditingFolderUuid] = useState(null);
    const [folderRenameVal, setFolderRenameVal] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [editingNoteUuid, setEditingNoteUuid] = useState(null);
    const [noteRenameVal, setNoteRenameVal] = useState("");
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState("");

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
                    } catch (err) {
                        console.error("Failed to flush note contents on switch:", err);
                    }
                }
            }
            prevSelectedNoteUuidRef.current = selectedNoteUuid;
        }
    }, [selectedNoteUuid, db, onTriggerRefresh, ipcRenderer]);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const colors = ['red', 'yellow', 'blue', 'green'];
    const bgClasses = {
        yellow: 'bg-amber-400',
        pink: 'bg-rose-400',
        red: 'bg-rose-500',
        blue: 'bg-sky-400',
        green: 'bg-emerald-400'
    };
    
    const headerBgColorClasses = {
        yellow: 'bg-amber-100',
        pink: 'bg-rose-100',
        red: 'bg-rose-150',
        blue: 'bg-sky-100',
        green: 'bg-emerald-100'
    };

    const editorBodyBgClasses = {
        yellow: 'bg-amber-50/50 border-amber-200/30 dark:bg-amber-955/5',
        pink: 'bg-rose-50/50 border-rose-200/30 dark:bg-rose-955/5',
        red: 'bg-rose-50/50 border-rose-200/30 dark:bg-rose-955/5',
        blue: 'bg-sky-50/50 border-sky-200/30 dark:bg-sky-955/5',
        green: 'bg-emerald-50/50 border-emerald-200/30 dark:bg-emerald-955/5'
    };

    const cardBgClasses = {
        yellow: 'bg-amber-50/90 border-amber-200/80 hover:border-amber-300 dark:bg-amber-955/10 dark:border-amber-900/30 dark:hover:border-amber-800',
        pink: 'bg-rose-50/90 border-rose-200/80 hover:border-rose-300 dark:bg-rose-955/10 dark:border-rose-900/30 dark:hover:border-rose-800',
        red: 'bg-rose-50/90 border-rose-200/80 hover:border-rose-300 dark:bg-rose-955/10 dark:border-rose-900/30 dark:hover:border-rose-800',
        blue: 'bg-sky-50/90 border-sky-200/80 hover:border-sky-300 dark:bg-sky-955/10 dark:border-sky-900/30 dark:hover:border-sky-800',
        green: 'bg-emerald-50/90 border-emerald-200/80 hover:border-emerald-300 dark:bg-emerald-955/10 dark:border-emerald-900/30 dark:hover:border-emerald-800'
    };

    const cardSelectedClasses = {
        yellow: 'ring-1 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-955/30 shadow-xs',
        pink: 'ring-1 ring-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-955/30 shadow-xs',
        red: 'ring-1 ring-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-955/30 shadow-xs',
        blue: 'ring-1 ring-sky-500 border-sky-500 bg-sky-50 dark:bg-sky-955/30 shadow-xs',
        green: 'ring-1 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-955/30 shadow-xs'
    };

    const priorityFlags = {
        red: { label: 'Highest Priority', flagColor: 'text-rose-500', bgClass: 'bg-rose-500' },
        pink: { label: 'Highest Priority', flagColor: 'text-rose-500', bgClass: 'bg-rose-500' },
        yellow: { label: 'Higher Priority', flagColor: 'text-amber-500', bgClass: 'bg-amber-400' },
        blue: { label: 'Low Priority', flagColor: 'text-sky-400', bgClass: 'bg-sky-400' },
        green: { label: 'Very Low Priority', flagColor: 'text-emerald-400', bgClass: 'bg-emerald-400' }
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

    useEffect(() => { selectedNoteUuidRef.current = selectedNoteUuid; }, [selectedNoteUuid]);
    useEffect(() => { openNoteUuidsRef.current = openNoteUuids; }, [openNoteUuids]);
    useEffect(() => { allNotesRef.current = allNotes; }, [allNotes]);
    useEffect(() => { getVcsCommitsRef.current = getVcsCommits; }, [getVcsCommits]);
    useEffect(() => { addVcsCommitRef.current = addVcsCommit; }, [addVcsCommit]);

    // 3. 10-Minute Auto-Versioning Hook (Runs on stable interval, doesn't clear on tab switches or edits)
    useEffect(() => {
        if (!db) return;

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
                            "Auto-backup (10 min interval)"
                        );
                    }
                });
            } catch (err) {
                console.error("Auto-backup failed:", err);
            }
        };

        // Run checking interval every 10 minutes (600,000 ms)
        const intervalId = setInterval(checkAndAutoCommit, 600000);
        return () => clearInterval(intervalId);
    }, [db]);

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

    const activeFolder = allFolders.find(f => f.uuid === activeFolderUuid);
    const selectedNote = allNotes.find(n => n.uuid === selectedNoteUuid);
    const folderNotes = allNotes.filter(n => n.parentFolderUuid === activeFolderUuid);

    // Filter notes by search query (using pre-resolved database matches)
    const filteredNotes = folderNotes.filter(n => {
        const query = searchQuery.trim();
        if (!query) return true;
        return searchMatchedUuids ? searchMatchedUuids.includes(n.uuid) : false;
    });

    const sortedNotes = useMemo(() => {
        const list = [...filteredNotes];
        if (sortBy === 'alpha-asc') {
            return list.sort((a, b) => a.title.localeCompare(b.title));
        }
        if (sortBy === 'alpha-desc') {
            return list.sort((a, b) => b.title.localeCompare(a.title));
        }
        if (sortBy === 'newest') {
            return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        if (sortBy === 'oldest') {
            return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        }
        if (sortBy === 'priority') {
            const weights = { red: 5, pink: 5, yellow: 4, blue: 2, green: 1 };
            return list.sort((a, b) => (weights[b.theme] || 0) - (weights[a.theme] || 0));
        }
        if (sortBy === 'theme') {
            return list.sort((a, b) => a.theme.localeCompare(b.theme));
        }
        // 'custom' order
        return list.sort((a, b) => a.sortOrder - b.sortOrder);
    }, [filteredNotes, sortBy]);

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
            const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml', 'txt'];

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

                try {
                    db.run("INSERT INTO sticky_notes (note_uuid, parent_folder_uuid, note_title, note_theme_preset, note_view_mode, note_markdown_content, placement_x_pos, placement_y_pos, geometry_width, geometry_height) VALUES (?, ?, ?, 'yellow', ?, ?, 100, 100, 350, 420)", [noteUuid, targetFolderUuid, name, mode, dbContent]);

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
        if (files.length === 0) return;

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

    // Helper: Create today's date formatted log note page
    const handleCreateTodaysDiary = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const title = `Diary - ${year}-${month}-${day}.log`;
        
        const existing = folderNotes.find(n => n.title.toLowerCase() === title.toLowerCase());
        if (existing) {
            setSelectedNoteUuid(existing.uuid);
        } else {
            onCreateNoteInFolder(activeFolderUuid, title);
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
                    <div className="w-12 border-r border-black/5 dark:border-white/5 bg-slate-100/40 dark:bg-slate-955/20 flex flex-col items-center py-3.5 justify-between select-none flex-shrink-0">
                        <div className="flex flex-col items-center gap-4 w-full">
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-slate-450 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Expand Explorer Sidebar"
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                            </button>
                            <div className="w-full border-t border-black/5 dark:border-white/5" />
                            <div className="flex flex-col items-center gap-1.5 w-full overflow-y-auto scrollbar-none px-1">
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
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                                activeFolderUuid === f.uuid
                                                    ? 'bg-indigo-600 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                                    : 'text-slate-655 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={isFolderExpanded ? faFolderOpen : faFolder} className="text-xs" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                        style={{ width: `${sidebarWidth}px` }} 
                        className="border-r border-black/5 dark:border-white/5 bg-slate-100/40 dark:bg-slate-955/20 flex flex-col p-3.5 min-h-0 justify-between select-none flex-shrink-0"
                    >
                        <div className="flex flex-col min-h-0">
                            {/* Explorer Header */}
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-slate-400 dark:text-slate-550 text-[10px]" />
                                    Explorer
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsCreatingFolder(true)}
                                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                        title="New Notebook"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(true)}
                                        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-slate-455 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                        title="Collapse Sidebar"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
                                    </button>
                                </div>
                            </div>

                            {/* Search bar inside Sidebar */}
                            <div className="relative mb-3 flex-shrink-0">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400 dark:text-slate-550">
                                    <FontAwesomeIcon icon={faSearch} className="text-[10px]" />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search workspace files..."
                                    className="w-full text-[10px] pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-colors"
                                />
                            </div>

                            {/* Workspace Sorting selector */}
                            <div className="flex items-center justify-between mb-2.5 px-2 py-1 bg-white/40 dark:bg-slate-900/20 border border-black/5 dark:border-white/5 rounded-lg text-[9px] text-slate-500 font-medium select-none flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <FontAwesomeIcon icon={faSort} className="text-slate-400 text-[10px]" />
                                    <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400">Sort Files</span>
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer text-[9px] py-0.5"
                                >
                                    <option value="custom">Custom Order</option>
                                    <option value="alpha-asc">A - Z</option>
                                    <option value="alpha-desc">Z - A</option>
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="priority">Priority</option>
                                    <option value="theme">Theme Color</option>
                                </select>
                            </div>

                            {/* Tree View list */}
                            <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none pr-0.5">
                                {allFolders.map(folder => {
                                    const isFolderExpanded = expandedFolders[folder.uuid] || searchQuery.trim().length > 0;
                                    const isFolderActive = folder.uuid === activeFolderUuid;
                                    
                                    // Get notes inside this folder
                                    const notesInThisFolder = allNotes.filter(n => n.parentFolderUuid === folder.uuid);
                                    
                                    // Apply search filtering
                                    const filteredNotes = notesInThisFolder.filter(n => {
                                        const query = searchQuery.trim();
                                        if (!query) return true;
                                        return searchMatchedUuids ? searchMatchedUuids.includes(n.uuid) : false;
                                    });

                                    // Sort notes based on sortBy setting
                                    const sortedFolderNotes = [...filteredNotes].sort((a, b) => {
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

                                    // If search query is active and neither the folder matches nor has children, skip rendering
                                    if (searchQuery.trim().length > 0 && sortedFolderNotes.length === 0 && !folder.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                                        return null;
                                    }

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
                                                className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                                                    draggingOverFolderUuid === folder.uuid ? 'ring-2 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' : ''
                                                } ${
                                                    isFolderActive
                                                        ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold'
                                                        : 'text-slate-655 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <FontAwesomeIcon icon={isFolderExpanded ? faFolderOpen : faFolder} className="text-xs opacity-75 text-indigo-555" />
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
                                                            className="w-full bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded px-1 text-[10px] focus:outline-none border border-black/10"
                                                        />
                                                    ) : (
                                                        <span className="truncate max-w-[120px] text-[11px]">{folder.name}</span>
                                                    )}
                                                </div>

                                                {editingFolderUuid !== folder.uuid && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                                        {/* Add note directly in this folder */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveFolderUuid(folder.uuid);
                                                                setIsCreatingNote(true);
                                                            }}
                                                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
                                                            title="Add File here"
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} className="text-[8px]" />
                                                        </button>
                                                        {/* Rename Folder */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startFolderRename(folder); }}
                                                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
                                                            title="Rename notebook"
                                                        >
                                                            <FontAwesomeIcon icon={faPen} className="text-[8px]" />
                                                        </button>
                                                        {/* Delete Folder */}
                                                        {folder.uuid !== 'folder_1' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    confirm(`Wipe notebook "${folder.name}" and all notes inside it permanently?`) && onDeleteFolder(folder.uuid);
                                                                }}
                                                                className="p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
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
                                                <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-black/5 dark:border-white/5 ml-3">
                                                    {sortedFolderNotes.map((n, idx) => {
                                                        const isNoteSelected = n.uuid === selectedNoteUuid;
                                                        const isVisible = !!windowsState[n.uuid]?.visible;
                                                        const isPinned = !!windowsState[n.uuid]?.pinned;
                                                        
                                                        // Priority flag dot background classes
                                                        const themeIndicatorClasses = {
                                                            yellow: 'bg-amber-400 border-amber-500',
                                                            pink: 'bg-rose-400 border-rose-500',
                                                            red: 'bg-rose-500 border-rose-600',
                                                            blue: 'bg-sky-400 border-sky-500',
                                                            green: 'bg-emerald-400 border-emerald-500'
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
                                                                className={`group/note flex items-center justify-between py-1 px-2.5 rounded-md cursor-pointer transition-all border ${
                                                                    isNoteSelected
                                                                        ? 'bg-white dark:bg-slate-800/80 border-black/10 dark:border-white/10 shadow-xs'
                                                                        : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    {/* Color theme priority dot menu */}
                                                                    <div className="relative flex-shrink-0">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setActiveThemeMenu(activeThemeMenu === n.uuid ? null : n.uuid); }}
                                                                            className={`w-2 h-2 rounded-full border shadow-xs hover:scale-125 transition-transform ${
                                                                                themeIndicatorClasses[n.theme] || 'bg-slate-300'
                                                                            }`}
                                                                            title={`Theme: ${n.theme}`}
                                                                        />
                                                                        {activeThemeMenu === n.uuid && (
                                                                            <div className="absolute top-4 left-0 z-50">
                                                                                <div className="fixed inset-0" onClick={(e) => { e.stopPropagation(); setActiveThemeMenu(null); }} />
                                                                                <div className="relative bg-white dark:bg-slate-900 shadow-xl border border-black/10 dark:border-white/10 rounded-lg py-1 px-1 flex flex-col gap-0.5 w-[100px] text-slate-700 dark:text-slate-200">
                                                                                    {Object.entries(priorityFlags).filter(([k]) => k !== 'pink').map(([k, meta]) => (
                                                                                        <button
                                                                                            key={k}
                                                                                            type="button"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                onChangeNoteTheme(n.uuid, k === 'red' ? 'pink' : k);
                                                                                                setActiveThemeMenu(null);
                                                                                            }}
                                                                                            className="flex items-center gap-1.5 w-full text-[8px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors text-left"
                                                                                        >
                                                                                            <FontAwesomeIcon icon={faFlag} className={meta.flagColor} />
                                                                                            <span>{meta.label.split(' ')[0]}</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

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
                                                                            className="w-[120px] bg-white border border-slate-350 rounded px-1 text-[10px] focus:outline-none"
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
                                                                    <div className="opacity-0 group-hover/note:opacity-100 transition-opacity flex items-center gap-0.5">
                                                                        {/* Swap custom orders */}
                                                                        {sortBy === 'custom' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={(e) => handleMoveNoteUp(idx, e)}
                                                                                    disabled={idx === 0}
                                                                                    className={`p-0.5 rounded ${idx === 0 ? 'opacity-30 pointer-events-none' : 'text-slate-400 hover:text-slate-655'}`}
                                                                                    title="Move Up"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faArrowUp} className="text-[7px]" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => handleMoveNoteDown(idx, e)}
                                                                                    disabled={idx === sortedFolderNotes.length - 1}
                                                                                    className={`p-0.5 rounded ${idx === sortedFolderNotes.length - 1 ? 'opacity-30 pointer-events-none' : 'text-slate-400 hover:text-slate-655'}`}
                                                                                    title="Move Down"
                                                                                >
                                                                                    <FontAwesomeIcon icon={faArrowDown} className="text-[7px]" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {/* Popout window */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleShow(n.uuid); }}
                                                                            className="p-0.5 rounded hover:bg-black/10 text-slate-400 hover:text-slate-600"
                                                                            title="Float Window"
                                                                        >
                                                                            <FontAwesomeIcon icon={faUpRightFromSquare} className="text-[7px]" />
                                                                        </button>
                                                                        {/* Pin */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleTogglePin(n.uuid); }}
                                                                            className={`p-0.5 rounded hover:bg-black/10 ${isPinned ? 'text-indigo-600' : 'text-slate-400'}`}
                                                                            title="Pin window"
                                                                        >
                                                                            <FontAwesomeIcon icon={faThumbtack} className="text-[7px]" />
                                                                        </button>
                                                                        {/* Show/Hide */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); isVisible ? handleHide(n.uuid) : handleShow(n.uuid); }}
                                                                            className={`p-0.5 rounded hover:bg-black/10 ${isVisible ? 'text-emerald-500' : 'text-slate-400'}`}
                                                                            title={isVisible ? "Hide Float" : "Show Float"}
                                                                        >
                                                                            <FontAwesomeIcon icon={isVisible ? faEye : faEyeSlash} className="text-[7px]" />
                                                                        </button>
                                                                        {/* Rename */}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); startNoteRename(n); }}
                                                                            className="p-0.5 rounded hover:bg-black/10 text-slate-400 hover:text-slate-600"
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
                                                                            className="p-0.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500"
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
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic pl-2 py-0.5">Empty notebook</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sidebar Footer Controls */}
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex-shrink-0 flex flex-col gap-2">
                            {isCreatingFolder ? (
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    placeholder="Notebook name..."
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            let folderName = newFolderName.trim();
                                            if (!folderName) {
                                                let index = 1;
                                                while (allFolders.some(f => f.name.toLowerCase() === `notebook ${index}`)) {
                                                    index++;
                                                }
                                                folderName = `Notebook ${index}`;
                                            }
                                            onCreateFolder(folderName);
                                            setNewFolderName("");
                                            setIsCreatingFolder(false);
                                        }
                                        if (e.key === 'Escape') setIsCreatingFolder(false);
                                    }}
                                    onBlur={() => setIsCreatingFolder(false)}
                                    className="w-full text-[10px] px-2 py-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100"
                                />
                            ) : isCreatingNote ? (
                                <input
                                    type="text"
                                    value={newNoteTitle}
                                    onChange={e => setNewNoteTitle(e.target.value)}
                                    placeholder="File name (e.g. App.jsx)..."
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            let finalTitle = newNoteTitle.trim();
                                            if (!finalTitle) {
                                                let index = 1;
                                                while (allNotes.some(n => n.title.toLowerCase() === `note ${index}.md`)) {
                                                    index++;
                                                }
                                                finalTitle = `Note ${index}.md`;
                                            } else {
                                                const ext = finalTitle.split('.').pop().toLowerCase();
                                                const supported = ['md', 'todo', 'list', 'log', 'xpnc', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'java', 'xml', 'json', 'sql', 'properties', 'yml', 'yaml'];
                                                if (finalTitle.split('.').length === 1 || !supported.includes(ext)) {
                                                    finalTitle += '.md';
                                                }
                                            }
                                            onCreateNoteInFolder(activeFolderUuid, finalTitle);
                                            setNewNoteTitle("");
                                            setIsCreatingNote(false);
                                        }
                                        if (e.key === 'Escape') setIsCreatingNote(false);
                                    }}
                                    onBlur={() => setIsCreatingNote(false)}
                                    className="w-full text-[10px] px-2 py-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none text-slate-800 dark:text-slate-100"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsCreatingNote(true)}
                                        className="flex-1 py-1.5 border border-dashed border-black/15 dark:border-white/10 hover:border-slate-800 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1 transition-all"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Note
                                    </button>
                                    <button
                                        onClick={handleCreateTodaysDiary}
                                        className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-150 rounded-lg text-[9px] font-bold text-indigo-705 uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1 transition-colors"
                                        title="Today's Diary Log"
                                    >
                                        <FontAwesomeIcon icon={faCalendarDay} /> Diary
                                    </button>
                                </div>
                            )}
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
                <div className={`flex-1 flex flex-col p-3 overflow-hidden min-h-0 select-text transition-all duration-350 ${selectedNote ? editorBodyBgClasses[selectedNote.theme] || 'bg-slate-100/30' : 'bg-slate-100/30'}`}>
                    
                    {/* Horizontal Tab Bar */}
                    {openNoteUuids.length > 0 && (
                        <div className={`flex items-center overflow-x-auto scrollbar-none border-b ${isDarkMode ? 'border-white/5 bg-slate-900/40' : 'border-black/5 bg-slate-100/50'} pb-1 px-1 mb-2 gap-1 flex-nowrap select-none flex-shrink-0`}>
                            {openNoteUuids.map(uuid => {
                                const tabNote = allNotes.find(n => n.uuid === uuid);
                                if (!tabNote) return null;
                                const isActive = uuid === selectedNoteUuid;
                                
                                const themeDotColors = {
                                    yellow: 'bg-amber-400',
                                    pink: 'bg-rose-455',
                                    red: 'bg-rose-500',
                                    blue: 'bg-sky-400',
                                    green: 'bg-emerald-400'
                                };
                                
                                return (
                                    <div
                                        key={uuid}
                                        onClick={() => setSelectedNoteUuid(uuid)}
                                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg border border-b-0 cursor-pointer transition-all duration-200 text-[10px] font-bold flex-shrink-0 ${
                                            isActive
                                                ? isDarkMode
                                                    ? 'bg-slate-800/80 border-white/10 text-white font-extrabold shadow-sm'
                                                    : 'bg-white border-black/10 text-slate-800 font-extrabold shadow-xs'
                                                : isDarkMode
                                                    ? 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                                                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-850'
                                        }`}
                                        style={isActive ? { borderTopColor: tabNote.theme === 'yellow' ? '#f59e0b' : tabNote.theme === 'pink' || tabNote.theme === 'red' ? '#e11d48' : tabNote.theme === 'blue' ? '#0284c7' : '#059669', borderTopWidth: '2px' } : {}}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${themeDotColors[tabNote.theme] || 'bg-slate-450'}`} />
                                        <span className="truncate max-w-[100px]">{tabNote.title}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCloseTab(uuid, e);
                                            }}
                                            className="p-0.5 rounded-full text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-rose-500 transition-colors opacity-60 group-hover:opacity-100"
                                        >
                                            <FontAwesomeIcon icon={faXmark} className="text-[7px]" />
                                        </button>
                                    </div>
                                );
                            })}
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
                                        onClick={() => setIsCreatingNote(true)}
                                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> New File
                                    </button>
                                    <button
                                        onClick={() => setIsCreatingFolder(true)}
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
                            
                            {/* Note Title and Options Header Card */}
                            <div className={`py-2 px-3 border border-black/10 rounded-xl mb-2 flex items-center justify-between shadow-sm select-none transition-all duration-350 ${headerBgColorClasses[selectedNote.theme] || 'bg-slate-50'}`}>
                                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-black/5 text-slate-500 flex-shrink-0">
                                        Editor
                                    </span>
                                    {editingNoteUuid === selectedNote.uuid ? (
                                        <input
                                            type="text"
                                            value={noteRenameVal}
                                            onChange={e => setNoteRenameVal(e.target.value)}
                                            onBlur={() => commitNoteRename(selectedNote.uuid)}
                                            onKeyDown={e => e.key === 'Enter' && commitNoteRename(selectedNote.uuid)}
                                            maxLength={25}
                                            autoFocus
                                            className="bg-white border border-slate-355 rounded px-1.5 py-0.5 text-xs font-bold text-slate-805 focus:outline-none w-[180px]"
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => { startNoteRename(selectedNote); }}
                                            className="text-[12px] font-bold text-slate-850 truncate cursor-pointer hover:underline"
                                            title="Click to rename"
                                        >
                                            {selectedNote.title}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 relative">
                                    <button 
                                        onClick={() => setEditorMenuOpen(!editorMenuOpen)}
                                        className="px-2.5 py-1.5 bg-white hover:bg-slate-55 border border-black/10 rounded-lg text-[9px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-sm select-none"
                                        title="Actions on note"
                                    >
                                        Actions <FontAwesomeIcon icon={faChevronDown} className="text-[8px] opacity-75" />
                                    </button>
                                    
                                    {editorMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-45 cursor-default" onClick={() => setEditorMenuOpen(false)} />
                                            <div className="absolute right-0 top-full mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-xl shadow-xl py-1 w-44 z-50 animate-in fade-in slide-in-from-top-1.5 duration-150 select-none text-slate-700 dark:text-slate-200">
                                                <button
                                                    onClick={() => {
                                                        handleShow(selectedNote.uuid);
                                                        setEditorMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faUpRightFromSquare} className="text-slate-400 w-3 text-center" />
                                                    Pop Out Window
                                                </button>
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
                                                <div className="border-t border-black/5 dark:border-white/5 my-1" />
                                                <button
                                                    onClick={() => {
                                                        toggleNoteFlag(selectedNote.uuid, selectedNote.isFlagged);
                                                        setEditorMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5 text-[10px] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faFlag} className={`${selectedNote.isFlagged ? 'text-red-505 animate-pulse' : 'text-slate-400'} w-3 text-center`} />
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
                                                    Raw File (.txt/.md/...)
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
                                                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-[10px] text-rose-505 dark:text-rose-400 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faTrashCan} className="text-rose-450 dark:text-rose-400 w-3 text-center" />
                                                    Delete Note
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Dynamic Workspace Mount based on Title Extension */}
                            <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">
                                {(() => {
                                    const mode = getEditorModeFromTitle(selectedNote.title);
                                    
                                    if (mode === 'todo' || mode === 'list') {
                                        return (
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-black/10 dark:border-white/10 mb-2 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5 block select-none">
                                                    {mode === 'todo' ? 'Tasks Checklist (.todo)' : 'Simple Checklist (.list)'}
                                                </span>
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
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-black/10 dark:border-white/10 mb-2 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5 block select-none">
                                                    Events Log (.log)
                                                </span>
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
                                            <div className="flex-1 flex flex-col min-h-0 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-black/10 dark:border-white/10 mb-2 select-text no-drag text-left overflow-hidden animate-in fade-in duration-100 shadow-lg">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-2.5 block select-none">
                                                    Expenses Tracker (.xpnc)
                                                </span>
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
                    
                    // DataHubTab props
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTaskGlobal}
                    onRenameTask={renameTaskGlobal}
                    onExportTask={exportSingleTask}
                />

                {/* Expanded Detailed Help Modal Overlay */}
                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                />
            </div>
        </div>
    );
}
