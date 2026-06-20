import { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTerminal, 
    faRotate, 
    faTrash, 
    faCopy, 
    faSearch, 
    faArrowDown,
    faXmark
} from '@fortawesome/free-solid-svg-icons';

export default function LogsTab({ ipcRenderer }) {
    const [rawLogs, setRawLogs] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [moduleTypeFilter, setModuleTypeFilter] = useState('ALL'); // 'ALL', 'FRONTEND', 'BACKEND'
    const consoleEndRef = useRef(null);

    const fetchLogs = async () => {
        if (!ipcRenderer) return;
        setLoading(true);
        try {
            const data = await ipcRenderer.invoke('read-log-file');
            setRawLogs(data || '');
        } catch (err) {
            console.error("Failed to read log file:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Parse logs into structured entries
    const parsedEntries = useMemo(() => {
        if (!rawLogs) return [];
        const lines = rawLogs.split('\n');
        const entries = [];
        let currentEntry = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            // Match timestamp, level, module, message
            const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/);
            if (match) {
                if (currentEntry) {
                    entries.push(currentEntry);
                }
                currentEntry = {
                    timestamp: match[1],
                    level: match[2].toUpperCase(),
                    module: match[3],
                    message: match[4],
                    stack: ''
                };
            } else {
                if (currentEntry) {
                    currentEntry.stack += line + '\n';
                }
            }
        }
        if (currentEntry) {
            entries.push(currentEntry);
        }
        return entries;
    }, [rawLogs]);

    // Apply filtering
    const filteredEntries = useMemo(() => {
        return parsedEntries.filter(entry => {
            // Level Filter
            if (levelFilter !== 'ALL' && entry.level !== levelFilter) {
                return false;
            }

            // Module Type Filter
            const isFrontend = entry.module === 'React_Frontend_UI' || entry.module === 'React_Sync_Engine';
            if (moduleTypeFilter === 'FRONTEND' && !isFrontend) {
                return false;
            }
            if (moduleTypeFilter === 'BACKEND' && isFrontend) {
                return false;
            }

            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchMsg = entry.message.toLowerCase().includes(q);
                const matchModule = entry.module.toLowerCase().includes(q);
                const matchStack = entry.stack.toLowerCase().includes(q);
                if (!matchMsg && !matchModule && !matchStack) {
                    return false;
                }
            }

            return true;
        });
    }, [parsedEntries, levelFilter, moduleTypeFilter, searchQuery]);

    const scrollToBottom = () => {
        if (consoleEndRef.current) {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [filteredEntries]);

    const handleCopy = () => {
        if (!rawLogs) return;
        navigator.clipboard.writeText(rawLogs);
        alert("Raw log file contents copied to clipboard.");
    };

    const handleClearLogs = async () => {
        if (!ipcRenderer) return;
        if (!confirm("Are you sure you want to clear the logs file?")) return;
        try {
            const cleared = await ipcRenderer.invoke('clear-app-cache', { logFile: true });
            if (cleared) {
                setRawLogs('');
                alert("Log file cleared.");
            }
        } catch (err) {
            console.error("Failed to clear log file:", err);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden text-xs select-none p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
            {/* Log Controls Header */}
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-black/5 dark:border-white/5 p-3 flex flex-wrap gap-2.5 items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Log Level Select */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Level:</span>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-250 font-bold border border-black/5 dark:border-white/10 rounded text-[9px] focus:outline-none"
                        >
                            <option value="ALL">All Levels</option>
                            <option value="INFO">INFO</option>
                            <option value="ERROR">ERROR</option>
                            <option value="CRITICAL">CRITICAL</option>
                        </select>
                    </div>

                    {/* Module Filter Group */}
                    <div className="flex border border-black/10 dark:border-white/10 rounded overflow-hidden">
                        {['ALL', 'FRONTEND', 'BACKEND'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setModuleTypeFilter(mode)}
                                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                                    moduleTypeFilter === mode 
                                        ? 'bg-indigo-650 text-white dark:bg-white dark:text-slate-900' 
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {mode === 'ALL' ? 'All' : mode === 'FRONTEND' ? 'UI Only' : 'Core Engine'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log Search Input */}
                <div className="relative w-44">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-slate-400">
                        <FontAwesomeIcon icon={faSearch} className="text-[8px]" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-5.5 pr-5.5 py-1 text-[9.5px] bg-slate-100 dark:bg-slate-850 border border-black/5 dark:border-white/10 rounded text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-[7.5px]" />
                        </button>
                    )}
                </div>

                {/* Utility Actions */}
                <div className="flex gap-1.5">
                    <button
                        onClick={handleCopy}
                        disabled={!rawLogs}
                        className="px-2 py-1 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-655 dark:text-slate-350 border border-black/10 dark:border-white/10 rounded text-[9px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Copy to Clipboard"
                    >
                        <FontAwesomeIcon icon={faCopy} /> Copy
                    </button>
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="px-2 py-1 bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-655 dark:text-slate-350 border border-black/10 dark:border-white/10 rounded text-[9px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1"
                        title="Reload logs"
                    >
                        <FontAwesomeIcon icon={faRotate} className={loading ? 'animate-spin' : ''} /> Reload
                    </button>
                    <button
                        onClick={handleClearLogs}
                        disabled={!rawLogs}
                        className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[9px] font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        title="Clear logs file"
                    >
                        <FontAwesomeIcon icon={faTrash} /> Clear Logs
                    </button>
                </div>
            </div>

            {/* Scrollable Terminal Console */}
            <div className="flex-1 bg-slate-950 border border-black/40 rounded-xl p-3 overflow-y-auto scrollbar-none font-mono text-[9.5px] leading-relaxed text-slate-300 relative min-h-0 flex flex-col shadow-inner select-text">
                <div className="space-y-2 flex-1">
                    {filteredEntries.map((entry, idx) => {
                        const isCritical = entry.level === 'CRITICAL' || entry.level === 'FATAL';
                        const isError = entry.level === 'ERROR';

                        let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                        if (isCritical) badgeColor = 'bg-rose-900/85 text-rose-100 border-rose-800 animate-pulse';
                        else if (isError) badgeColor = 'bg-amber-600/20 text-amber-500 border-amber-500/30';
                        else if (entry.level === 'INFO') badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40';

                        const formattedTime = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';

                        return (
                            <div key={idx} className="border-b border-white/[0.03] pb-1.5 last:border-b-0">
                                <div className="flex items-start flex-wrap gap-1.5">
                                    {/* Level Badge */}
                                    <span className={`px-1.5 py-0.2 rounded border text-[7.5px] font-extrabold tracking-wide uppercase select-none ${badgeColor}`}>
                                        {entry.level}
                                    </span>
                                    
                                    {/* Timestamp */}
                                    <span className="text-slate-500 select-none text-[8.5px] mt-0.5">{formattedTime}</span>

                                    {/* Module */}
                                    <span className="text-indigo-400/90 font-extrabold text-[8.5px] mt-0.5">[{entry.module}]</span>

                                    {/* Message */}
                                    <span className={`flex-1 break-all ${isCritical ? 'text-rose-400 font-semibold' : isError ? 'text-amber-400/90' : 'text-slate-300'}`}>
                                        {entry.message}
                                    </span>
                                </div>

                                {/* Stack Trace */}
                                {entry.stack && (
                                    <pre className="mt-1.5 p-2 bg-slate-900/60 dark:bg-black/40 border border-white/[0.04] rounded-lg text-slate-400 overflow-x-auto text-[8.5px] font-mono whitespace-pre leading-normal break-all">
                                        {entry.stack}
                                    </pre>
                                )}
                            </div>
                        );
                    })}

                    {filteredEntries.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 italic p-8 text-center select-none">
                            <FontAwesomeIcon icon={faTerminal} className="text-xl opacity-35 mb-2" />
                            No log events captured.
                        </div>
                    )}
                    <div ref={consoleEndRef} />
                </div>

                {/* Floating scroll to bottom anchor helper */}
                {filteredEntries.length > 0 && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-3 right-3 p-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer select-none opacity-80 hover:opacity-100"
                        title="Scroll to bottom"
                    >
                        <FontAwesomeIcon icon={faArrowDown} className="text-[9px]" />
                    </button>
                )}
            </div>
        </div>
    );
}
