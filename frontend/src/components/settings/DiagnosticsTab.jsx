import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faDatabase, 
    faFileMedical, 
    faTrash, 
    faRotate, 
    faWarning,
    faChartPie,
    faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

export default function DiagnosticsTab({ onResetDatabase, ipcRenderer }) {
    const [stats, setStats] = useState({ webCache: 0, logFile: 0, dbFile: 0 });
    const [loading, setLoading] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const fetchStats = async () => {
        if (!ipcRenderer) return;
        setLoading(true);
        try {
            const data = await ipcRenderer.invoke('get-cache-stats');
            setStats(data || { webCache: 0, logFile: 0, dbFile: 0 });
        } catch (err) {
            console.error("Failed to fetch diagnostics stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatBytes = (bytes) => {
        if (bytes === 0 || !bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleClearCache = async (type) => {
        if (!ipcRenderer) return;
        try {
            const cleared = await ipcRenderer.invoke('clear-app-cache', {
                webCache: type === 'web',
                logFile: type === 'logs'
            });
            if (cleared) {
                fetchStats();
                alert(`${type === 'web' ? 'Web cache' : 'Log file'} cleared successfully.`);
            }
        } catch (err) {
            console.error("Failed to clear:", err);
            alert("Clear action failed.");
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto text-xs select-none p-4 space-y-4 scrollbar-none bg-slate-50/30 dark:bg-slate-950/20 relative">
            
            {/* Cache Statistics Grid */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-4 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                    <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faChartPie} className="text-indigo-500 dark:text-indigo-400" /> Disk Space & Cache Statistics
                    </span>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="px-2 py-0.8 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-655 dark:text-slate-350 border border-black/10 dark:border-white/10 rounded text-[9px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1"
                        title="Reload Stats"
                    >
                        <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Web Cache Size */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Web Browser Cache</div>
                            <div className="text-sm font-extrabold text-slate-750 dark:text-slate-200 mt-0.5">{formatBytes(stats.webCache)}</div>
                        </div>
                        <button
                            onClick={() => handleClearCache('web')}
                            className="p-1.5 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 dark:text-slate-400 rounded-lg border border-black/5 dark:border-white/10 cursor-pointer transition-colors"
                            title="Clear Browser Cache"
                        >
                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                        </button>
                    </div>

                    {/* Log File Size */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">System Log File</div>
                            <div className="text-sm font-extrabold text-slate-750 dark:text-slate-200 mt-0.5">{formatBytes(stats.logFile)}</div>
                        </div>
                        <button
                            onClick={() => handleClearCache('logs')}
                            className="p-1.5 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 dark:text-slate-400 rounded-lg border border-black/5 dark:border-white/10 cursor-pointer transition-colors"
                            title="Truncate Log File"
                        >
                            <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                        </button>
                    </div>

                    {/* DB File Size */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-lg border border-black/[0.03] dark:border-white/[0.03] flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">SQLite Database</div>
                            <div className="text-sm font-extrabold text-slate-750 dark:text-slate-200 mt-0.5">{formatBytes(stats.dbFile)}</div>
                        </div>
                        <div className="p-1.5 text-slate-400">
                            <FontAwesomeIcon icon={faDatabase} className="text-[10px]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Reset Section */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-4 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-black/5 dark:border-white/5 pb-2">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-rose-500 dark:text-rose-455" /> Hard Maintenance
                </h3>

                <div className="p-3 bg-rose-50 dark:bg-rose-955/10 rounded-lg border border-rose-100 dark:border-rose-950/20 text-rose-800 dark:text-rose-350">
                    <div className="flex gap-2">
                        <FontAwesomeIcon icon={faWarning} className="text-rose-500 dark:text-rose-455 text-sm mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-[10px] font-extrabold uppercase tracking-wide">Danger Zone: App Factory Reset</h4>
                            <p className="text-[10px] mt-1 opacity-90 leading-relaxed">
                                Executing a factory reset will permanently unlink and drop the offline SQLite database file (`notepad_data.db`). **ALL folders, notes, checklists, events logs, expense tracking entries, and VCS commits will be permanently wiped.** This operation cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <button
                        onClick={() => setShowResetConfirm(true)}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-3.5 py-1.8 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <FontAwesomeIcon icon={faWarning} className="text-[9px]" /> Wipe & Reset Application
                    </button>
                </div>
            </div>

            {/* Factory Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-rose-500/20 shadow-2xl p-5 text-slate-800 dark:text-slate-250 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2.5 text-rose-550 border-b border-black/5 dark:border-white/5 pb-2">
                            <FontAwesomeIcon icon={faWarning} className="text-base" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider">Confirm Factory Reset</h3>
                        </div>
                        
                        <p className="text-[11px] mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                            Are you absolutely certain you want to purge all data? This deletes your local files, databases, configurations, and will restart the editor with a blank workspace.
                        </p>

                        <div className="flex items-center gap-2 mt-5 justify-end">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowResetConfirm(false);
                                    onResetDatabase();
                                }}
                                className="px-3.5 py-1.5 bg-rose-550 hover:bg-rose-650 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-sm"
                            >
                                Yes, WIPE ALL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
