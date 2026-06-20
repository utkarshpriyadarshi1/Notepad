import { useState, useEffect } from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faFileExport,
    faFileImport,
    faTrash,
    faSliders,
    faFont,
    faParagraph,
    faCode,
    faClock
} from '@fortawesome/free-solid-svg-icons';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

export default function PreferencesTab({
                                           onExport,
                                           onImport,
                                           onResetDatabase,
                                           editorPrefs = {
                                               theme: 'standard',
                                               fontSize: 12,
                                               tabSize: 4,
                                               lineWrap: true,
                                               backupInterval: 600000
                                           },
                                           onUpdateEditorPrefs
                                       }) {
    const [activeWorkspace, setActiveWorkspace] = useState("");

    useEffect(() => {
        if (ipcRenderer) {
            ipcRenderer.invoke('get-active-workspace').then(path => setActiveWorkspace(path));
        }
    }, []);

    const handleChangeWorkspace = async () => {
        if (ipcRenderer) {
            const newPath = await ipcRenderer.invoke('change-default-workspace-path');
            if (newPath) {
                alert(`Default workspace updated to:\n${newPath}\n\nNew windows will open in this workspace by default.`);
            }
        }
    };

    const handleOpenWorkspace = async () => {
        if (ipcRenderer) {
            await ipcRenderer.invoke('open-workspace-folder-dialog');
        }
    };

    return (<div className="flex-1 flex flex-col overflow-y-auto text-xs select-none p-4 space-y-4 scrollbar-none bg-slate-50/30 dark:bg-slate-950/20">

            {/* Editor Preferences Section */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-4 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-black/5 dark:border-white/5 pb-2">
                    <FontAwesomeIcon icon={faSliders} className="text-indigo-500 dark:text-indigo-400" /> Editor Preferences
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Theme Selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-450">
                            Syntax Theme
                        </label>
                        <select
                            value={editorPrefs.theme || 'standard'}
                            onChange={(e) => onUpdateEditorPrefs({ theme: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        >
                            <option value="standard">Standard (Notepad++ / System)</option>
                            <option value="monokai">Monokai Dark</option>
                            <option value="dracula">Dracula Dark</option>
                            <option value="github-dark">GitHub Dark</option>
                        </select>
                    </div>

                    {/* Font Size Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455 flex items-center gap-1">
                            <FontAwesomeIcon icon={faFont} className="text-[8px]" /> Font Size (px)
                        </label>
                        <input
                            type="number"
                            min="8"
                            max="24"
                            value={editorPrefs.fontSize || 12}
                            onChange={(e) => onUpdateEditorPrefs({ fontSize: Math.max(8, Math.min(24, parseInt(e.target.value) || 12)) })}
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Tab Indentation Size */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455 flex items-center gap-1">
                            <FontAwesomeIcon icon={faCode} className="text-[8px]" /> Tab Width
                        </label>
                        <select
                            value={editorPrefs.tabSize || 4}
                            onChange={(e) => onUpdateEditorPrefs({ tabSize: parseInt(e.target.value) || 4 })}
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        >
                            <option value="2">2 Spaces</option>
                            <option value="4">4 Spaces</option>
                        </select>
                    </div>

                    {/* Auto-backup Snapshot Frequency */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455 flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} className="text-[8px]" /> Auto-backup Interval
                        </label>
                        <select
                            value={editorPrefs.backupInterval || 600000}
                            onChange={(e) => onUpdateEditorPrefs({ backupInterval: parseInt(e.target.value) || 600000 })}
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        >
                            <option value="300000">5 Minutes</option>
                            <option value="600000">10 Minutes (Default)</option>
                            <option value="1200000">20 Minutes</option>
                            <option value="1800000">30 Minutes</option>
                        </select>
                    </div>
                </div>

                {/* Line Wrap Checkbox Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <input
                        type="checkbox"
                        id="lineWrapToggle"
                        checked={editorPrefs.lineWrap !== false}
                        onChange={(e) => onUpdateEditorPrefs({ lineWrap: e.target.checked })}
                        className="rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <label htmlFor="lineWrapToggle" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                        <FontAwesomeIcon icon={faParagraph} className="text-[8px]" /> Enable Line Wrapping
                    </label>
                </div>

                {/* Multi-Cursor Checkbox Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <input
                        type="checkbox"
                        id="multiCursorToggle"
                        checked={!!editorPrefs.enableMultiCursor}
                        onChange={(e) => onUpdateEditorPrefs({ enableMultiCursor: e.target.checked })}
                        className="rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <label htmlFor="multiCursorToggle" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                        Enable Multi-Cursor (Alt + Click / Arrow Keys)
                    </label>
                </div>

                {/* Local File Auto-Sync Checkbox Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <input
                        type="checkbox"
                        id="autoSyncToggle"
                        checked={editorPrefs.enableLocalFileAutoSync !== false}
                        onChange={(e) => onUpdateEditorPrefs({ enableLocalFileAutoSync: e.target.checked })}
                        className="rounded border-black/10 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <label htmlFor="autoSyncToggle" className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                        Enable Local File Auto-Sync
                    </label>
                </div>
                
                {/* Default File & Folder Names Configuration */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455">
                            Default New Note Name
                        </label>
                        <input
                            type="text"
                            value={editorPrefs.defaultFileName || 'Note'}
                            onChange={(e) => onUpdateEditorPrefs({ defaultFileName: e.target.value })}
                            placeholder="e.g. Note"
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455">
                            Default Notebook Name
                        </label>
                        <input
                            type="text"
                            value={editorPrefs.defaultFolderName || 'Notebook'}
                            onChange={(e) => onUpdateEditorPrefs({ defaultFolderName: e.target.value })}
                            placeholder="e.g. Notebook"
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455">
                            Default File Type
                        </label>
                        <select
                            value={editorPrefs.defaultFileType || 'md'}
                            onChange={(e) => onUpdateEditorPrefs({ defaultFileType: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-medium rounded-lg border border-black/5 dark:border-white/10 text-xs focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="md">Markdown (.md)</option>
                            <option value="txt">Plain Text (.txt)</option>
                            <option value="sql">SQL (.sql)</option>
                            <option value="js">JavaScript (.js)</option>
                            <option value="jsx">React (.jsx)</option>
                            <option value="json">JSON (.json)</option>
                            <option value="html">HTML (.html)</option>
                            <option value="css">CSS (.css)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Workspace Settings Section */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-black/5 dark:border-white/5 pb-2">
                    Workspace Configuration
                </h3>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 dark:text-slate-455">
                            Active Workspace Path
                        </label>
                        <div className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-250 rounded-lg border border-black/5 dark:border-white/10 font-mono text-[10px] break-all select-all">
                            {activeWorkspace || "Loading active workspace..."}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            onClick={handleChangeWorkspace}
                            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 font-bold rounded-lg border border-black/5 dark:border-white/10 text-[10px] cursor-pointer transition-colors"
                        >
                            Change Default Workspace
                        </button>
                        <button
                            onClick={handleOpenWorkspace}
                            className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 font-bold rounded-lg border border-black/5 dark:border-white/10 text-[10px] cursor-pointer transition-colors"
                        >
                            Open Another Workspace
                        </button>
                    </div>
                </div>
            </div>

            {/* Maintenance Section */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-black/5 dark:border-white/5 pb-2">
                    Maintenance & Mobility
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="group relative">
                        <button onClick={onExport}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold rounded-lg border border-black/5 dark:border-white/10 text-[10px] cursor-pointer transition-colors">
                            <FontAwesomeIcon icon={faFileExport} className="mr-1 opacity-70"/> Export Backup
                        </button>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white dark:bg-slate-950 dark:text-slate-200 text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10 dark:border-white/5">
                            Export JSON Backup
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="block w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold rounded-lg border border-black/5 dark:border-white/10 text-[10px] text-center cursor-pointer transition-colors">
                            <FontAwesomeIcon icon={faFileImport} className="mr-1 opacity-70"/> Import Backup
                            <input type="file" accept=".json" onChange={onImport} className="hidden"/>
                        </label>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white dark:bg-slate-950 dark:text-slate-200 text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10 dark:border-white/5">
                            Import JSON Backup
                        </div>
                    </div>
                </div>

                <div className="group relative w-full">
                    <button onClick={() => confirm("Reset database cache state?") && onResetDatabase()}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg font-bold border border-rose-100 dark:border-rose-950 text-[10px] cursor-pointer transition-colors">
                        <FontAwesomeIcon icon={faTrash} className="mr-1"/> Reset Database Storage
                    </button>
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white dark:bg-slate-950 dark:text-slate-200 text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10 dark:border-white/5">
                        Wipe Database & Reboot
                    </div>
                </div>
            </div>
        </div>);
}
