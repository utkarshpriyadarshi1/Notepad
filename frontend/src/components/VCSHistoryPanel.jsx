import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faPlus, faTimes, faUndo } from '@fortawesome/free-solid-svg-icons';

export default function VCSHistoryPanel({ 
    noteUuid, 
    activeTitle, 
    activeContent, 
    getVcsCommits, 
    addVcsCommit, 
    restoreVcsCommit, 
    onClose 
}) {
    const [commitMessage, setCommitMessage] = useState('');
    const [history, setHistory] = useState([]);

    const fetchHistory = () => {
        if (noteUuid) {
            const list = getVcsCommits(noteUuid);
            setHistory(list);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [noteUuid, getVcsCommits]);

    const handleCreateSnapshot = (e) => {
        e.preventDefault();
        const msg = commitMessage.trim() || `Snapshot Saved`;
        addVcsCommit(noteUuid, activeTitle, activeContent, msg);
        setCommitMessage('');
        // Trigger local state reload
        setTimeout(() => {
            fetchHistory();
        }, 150);
    };

    const handleRestore = (commitId) => {
        if (confirm("Are you sure you want to restore this revision? Your current editor state will be backed up automatically before restoring.")) {
            // First backup current active state
            addVcsCommit(noteUuid, activeTitle, activeContent, `Backup before restoring revision`);
            // Restore snapshot
            restoreVcsCommit(noteUuid, commitId);
            // Trigger local state reload
            setTimeout(() => {
                fetchHistory();
            }, 150);
        }
    };

    const formatTime = (timeStr) => {
        try {
            // SQLite time has format: YYYY-MM-DD HH:MM:SS
            // Replace space with T and append Z to parse as UTC
            const cleanStr = timeStr.replace(' ', 'T') + 'Z';
            const date = new Date(cleanStr);
            if (isNaN(date.getTime())) return timeStr;
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timeStr;
        }
    };

    return (
        <div className="w-[30%] min-w-[260px] max-w-[340px] border-l border-black/5 dark:border-white/5 pl-4 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 bg-slate-50/50 dark:bg-slate-950/20 select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faHistory} className="text-indigo-600 dark:text-indigo-500 text-xs animate-spin-slow" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Version History
                    </span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                </button>
            </div>

            {/* Commit Form */}
            <form onSubmit={handleCreateSnapshot} className="flex flex-col gap-2 mb-4 bg-white/70 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 p-2.5 rounded-xl shadow-sm flex-shrink-0">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Save New Snapshot
                </span>
                <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Describe changes (e.g. Added login logic)..."
                    className="w-full text-[9px] px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100"
                    maxLength={50}
                />
                <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-lg font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                    <FontAwesomeIcon icon={faPlus} /> Snapshot Revision
                </button>
            </form>

            {/* Revision List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-none min-h-0 pb-4">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 block mb-1">
                    Commit History (Max 30)
                </span>
                {history.map((commit) => (
                    <div 
                        key={commit.id} 
                        className="p-2.5 bg-white dark:bg-slate-900/30 border border-black/5 dark:border-white/5 rounded-xl shadow-sm flex flex-col gap-1 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors"
                    >
                        <div className="flex items-center justify-between text-[8px] font-bold">
                            <span className="text-slate-400 dark:text-slate-500 font-mono text-[7px]">
                                {commit.id.substring(7, 18)}
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400">
                                {formatTime(commit.createdAt)}
                            </span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-800 dark:text-slate-200 text-left select-text break-words pr-2">
                            {commit.message}
                        </div>
                        <div className="text-[8px] text-slate-450 dark:text-slate-500 text-left italic truncate">
                            File: {commit.titleSnapshot || 'Untitled'}
                        </div>
                        <div className="flex justify-end pt-1 border-t border-black/5 dark:border-white/5 mt-1 flex-shrink-0">
                            <button
                                onClick={() => handleRestore(commit.id)}
                                className="px-2 py-0.8 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 rounded text-[8px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Restore this version"
                            >
                                <FontAwesomeIcon icon={faUndo} className="text-[7px]" />
                                Restore
                            </button>
                        </div>
                    </div>
                ))}
                {history.length === 0 && (
                    <p className="text-center text-[9px] text-slate-400 dark:text-slate-500 italic pt-6 select-none">
                        No snapshots saved yet.
                    </p>
                )}
            </div>
        </div>
    );
}
