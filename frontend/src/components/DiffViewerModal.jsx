import { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faXmark, 
    faColumns, 
    faEye, 
    faChevronDown
} from '@fortawesome/free-solid-svg-icons';

// Zero-dependency Longest Common Subsequence line diff engine
function diffLines(text1, text2) {
    const lines1 = (text1 || '').split('\n');
    const lines2 = (text2 || '').split('\n');
    
    const n = lines1.length;
    const m = lines2.length;
    
    // DP Table creation
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (lines1[i - 1] === lines2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // Backtracking to resolve diff
    const diff = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
            diff.unshift({ type: 'unchanged', text: lines1[i - 1], line1: i, line2: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: 'added', text: lines2[j - 1], line1: null, line2: j });
            j--;
        } else {
            diff.unshift({ type: 'removed', text: lines1[i - 1], line1: i, line2: null });
            i--;
        }
    }
    return diff;
}

// Side-by-side scroll-synchronized layout aligner
function alignDiff(diffItems) {
    const aligned = [];
    let idx = 0;
    while (idx < diffItems.length) {
        const item = diffItems[idx];
        if (item.type === 'unchanged') {
            aligned.push({ left: item, right: item });
            idx++;
        } else if (item.type === 'removed') {
            const nextItem = diffItems[idx + 1];
            if (nextItem && nextItem.type === 'added') {
                aligned.push({ left: item, right: nextItem });
                idx += 2;
            } else {
                aligned.push({ left: item, right: null });
                idx++;
            }
        } else if (item.type === 'added') {
            aligned.push({ left: null, right: item });
            idx++;
        }
    }
    return aligned;
}

export default function DiffViewerModal({ isOpen, onClose, currentNote, allNotes, db, isDarkMode }) {
    const [noteAUuid, setNoteAUuid] = useState(currentNote?.uuid || '');
    const [noteBUuid, setNoteBUuid] = useState('');
    const [diffMode, setDiffMode] = useState('split'); // 'split' or 'unified'

    const noteA = useMemo(() => allNotes.find(n => n.uuid === noteAUuid), [allNotes, noteAUuid]);
    const noteB = useMemo(() => allNotes.find(n => n.uuid === noteBUuid), [allNotes, noteBUuid]);

    // Query content for note A
    const contentA = useMemo(() => {
        if (!db || !noteAUuid) return '';
        if (currentNote && noteAUuid === currentNote.uuid) {
            // Wait, if it's the current note, we should use the active text, but query is a clean fallback.
            // Actually, querying SQLite is the most consistent behavior.
        }
        try {
            const res = db.exec("SELECT note_markdown_content FROM sticky_notes WHERE note_uuid = ?", [noteAUuid]);
            if (res && res.length > 0 && res[0].values) {
                return res[0].values[0][0] || '';
            }
        } catch (e) {
            console.error("Failed to query content for Diff A:", e);
        }
        return '';
    }, [db, noteAUuid, currentNote]);

    // Query content for note B
    const contentB = useMemo(() => {
        if (!db || !noteBUuid) return '';
        try {
            const res = db.exec("SELECT note_markdown_content FROM sticky_notes WHERE note_uuid = ?", [noteBUuid]);
            if (res && res.length > 0 && res[0].values) {
                return res[0].values[0][0] || '';
            }
        } catch (e) {
            console.error("Failed to query content for Diff B:", e);
        }
        return '';
    }, [db, noteBUuid]);

    const diffResults = useMemo(() => {
        if (!noteAUuid || !noteBUuid) return [];
        return diffLines(contentA, contentB);
    }, [contentA, contentB, noteAUuid, noteBUuid]);

    const alignedResults = useMemo(() => {
        return alignDiff(diffResults);
    }, [diffResults]);

    if (!isOpen) return null;

    return (
        <div style={{ WebkitAppRegion: 'no-drag' }}
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3.5 z-55 animate-in fade-in duration-150">
            <div className="w-[95%] h-[92%] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden text-slate-800 dark:text-slate-200">
                
                {/* Header */}
                <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 flex items-center justify-between flex-shrink-0 select-none bg-slate-50 dark:bg-slate-950">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Document Compare Diff Tool
                    </span>
                    <button onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 cursor-pointer transition-colors">
                        <FontAwesomeIcon icon={faXmark} className="text-sm"/>
                    </button>
                </div>

                {/* Configuration Controls */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 select-none">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        {/* Selector A */}
                        <div className="flex items-center gap-1.5 min-w-[200px] flex-1 max-w-sm">
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">File A:</span>
                            <div className="relative flex-1">
                                <select
                                    value={noteAUuid}
                                    onChange={(e) => setNoteAUuid(e.target.value)}
                                    className="w-full pl-2.5 pr-8 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-black/10 dark:border-white/10 text-[10px] focus:outline-none appearance-none cursor-pointer transition-colors"
                                >
                                    <option value="">-- Select File A --</option>
                                    {allNotes.map(n => (
                                        <option key={n.uuid} value={n.uuid}>{n.title}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Selector B */}
                        <div className="flex items-center gap-1.5 min-w-[200px] flex-1 max-w-sm">
                            <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">File B:</span>
                            <div className="relative flex-1">
                                <select
                                    value={noteBUuid}
                                    onChange={(e) => setNoteBUuid(e.target.value)}
                                    className="w-full pl-2.5 pr-8 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-black/10 dark:border-white/10 text-[10px] focus:outline-none appearance-none cursor-pointer transition-colors"
                                >
                                    <option value="">-- Select File B --</option>
                                    {allNotes.filter(n => n.uuid !== noteAUuid).map(n => (
                                        <option key={n.uuid} value={n.uuid}>{n.title}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Diff Layout Toggle */}
                    <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-black/5 dark:border-white/5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setDiffMode('split')}
                            className={`px-2 py-1 rounded-md text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                diffMode === 'split' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FontAwesomeIcon icon={faColumns} className="text-[7px]" /> Side-by-Side
                        </button>
                        <button
                            type="button"
                            onClick={() => setDiffMode('unified')}
                            className={`px-2 py-1 rounded-md text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                diffMode === 'unified' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FontAwesomeIcon icon={faEye} className="text-[7px]" /> Unified
                        </button>
                    </div>
                </div>

                {/* Diff Viewer Area */}
                <div className="flex-1 overflow-y-auto scrollbar-none bg-slate-50/50 dark:bg-slate-950/20 p-3 min-h-0">
                    {!noteAUuid || !noteBUuid ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-60">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                Select two documents above to display their line differences.
                            </span>
                        </div>
                    ) : diffResults.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center text-emerald-500">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                                Both files are identical! No differences found.
                            </span>
                        </div>
                    ) : diffMode === 'split' ? (
                        /* Split Mode rendering matched line rows */
                        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col select-text min-w-[600px]">
                            
                            {/* Column Titles */}
                            <div className="flex border-b border-black/10 dark:border-white/10 text-[9px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950 select-none">
                                <div className="w-1/2 px-3 py-1.5 border-r border-black/10 dark:border-white/10 truncate">
                                    File A: {noteA?.title}
                                </div>
                                <div className="w-1/2 px-3 py-1.5 truncate">
                                    File B: {noteB?.title}
                                </div>
                            </div>

                            {/* Aligned Line Rows */}
                            <div className="flex flex-col overflow-y-auto">
                                {alignedResults.map((pair, index) => {
                                    const left = pair.left;
                                    const right = pair.right;
                                    
                                    let leftBg = 'bg-transparent text-slate-700 dark:text-slate-300';
                                    let leftPrefix = ' ';
                                    if (left && left.type === 'removed') {
                                        leftBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
                                        leftPrefix = '-';
                                    }
                                    
                                    let rightBg = 'bg-transparent text-slate-700 dark:text-slate-300';
                                    let rightPrefix = ' ';
                                    if (right && right.type === 'added') {
                                        rightBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                                        rightPrefix = '+';
                                    }

                                    return (
                                        <div key={index} className="flex border-b border-black/5 dark:border-white/5 font-mono text-[10px] leading-relaxed group">
                                            {/* Left Panel (File A) */}
                                            <div className={`w-1/2 border-r border-black/5 dark:border-white/5 flex min-w-0 items-start ${leftBg}`}>
                                                <div className="w-8 text-right pr-2 text-slate-400 dark:text-slate-500 select-none border-r border-black/5 dark:border-white/5 shrink-0 py-0.5 bg-black/[0.02] dark:bg-white/[0.01]">
                                                    {left ? left.line1 : ''}
                                                </div>
                                                <div className="w-4 text-center text-rose-550 dark:text-rose-400 select-none shrink-0 font-extrabold py-0.5">
                                                    {leftPrefix}
                                                </div>
                                                <pre className="pl-1 pr-2 py-0.5 select-text whitespace-pre-wrap break-all font-mono leading-relaxed flex-1">
                                                    {left ? left.text : ''}
                                                </pre>
                                            </div>
                                            {/* Right Panel (File B) */}
                                            <div className={`w-1/2 flex min-w-0 items-start ${rightBg}`}>
                                                <div className="w-8 text-right pr-2 text-slate-400 dark:text-slate-500 select-none border-r border-black/5 dark:border-white/5 shrink-0 py-0.5 bg-black/[0.02] dark:bg-white/[0.01]">
                                                    {right ? right.line2 : ''}
                                                </div>
                                                <div className="w-4 text-center text-emerald-550 dark:text-emerald-400 select-none shrink-0 font-extrabold py-0.5">
                                                    {rightPrefix}
                                                </div>
                                                <pre className="pl-1 pr-2 py-0.5 select-text whitespace-pre-wrap break-all font-mono leading-relaxed flex-1">
                                                    {right ? right.text : ''}
                                                </pre>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Unified Mode rendering vertical chronological stack */
                        <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex flex-col select-text font-mono text-[10px] leading-relaxed">
                            <div className="flex flex-col overflow-y-auto">
                                {diffResults.map((item, index) => {
                                    let itemBg = 'bg-transparent text-slate-700 dark:text-slate-300';
                                    let prefix = ' ';
                                    let lineIndicator = '';

                                    if (item.type === 'added') {
                                        itemBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                                        prefix = '+';
                                        lineIndicator = `  ${item.line2}`;
                                    } else if (item.type === 'removed') {
                                        itemBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-455';
                                        prefix = '-';
                                        lineIndicator = `${item.line1}  `;
                                    } else {
                                        lineIndicator = `${item.line1} ${item.line2}`;
                                    }

                                    return (
                                        <div key={index} className={`flex border-b border-black/5 dark:border-white/5 items-start ${itemBg}`}>
                                            <div className="w-12 text-center text-slate-400 dark:text-slate-550 select-none border-r border-black/5 dark:border-white/5 shrink-0 py-0.5 bg-black/[0.02] dark:bg-white/[0.01] tracking-wide font-mono text-[9px]">
                                                {lineIndicator}
                                            </div>
                                            <div className={`w-4 text-center select-none shrink-0 font-extrabold py-0.5 ${
                                                item.type === 'added' ? 'text-emerald-555' : item.type === 'removed' ? 'text-rose-555' : 'text-slate-400'
                                            }`}>
                                                {prefix}
                                            </div>
                                            <pre className="pl-1 pr-2 py-0.5 select-text whitespace-pre-wrap break-all font-mono leading-relaxed flex-1">
                                                {item.text}
                                            </pre>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer status bar summary */}
                {noteAUuid && noteBUuid && (
                    <div className="p-2 border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between select-none flex-shrink-0">
                        <div>COMPARING {noteA?.title} AGAINST {noteB?.title}</div>
                        <div className="flex gap-3">
                            <span className="text-rose-500">{diffResults.filter(i => i.type === 'removed').length} DELETIONS</span>
                            <span className="text-emerald-500">{diffResults.filter(i => i.type === 'added').length} ADDITIONS</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
