import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faStop,
    faRotateRight,
    faFileExport,
    faFileImport,
    faTrash,
    faHdd,
    faLanguage,
    faGear,
    faTools
} from '@fortawesome/free-solid-svg-icons';

export default function PreferencesTab({
                                           onExport,
                                           onImport,
                                           onResetDatabase,
                                           serviceStatus,
                                           onServiceAction,
                                           t,
                                           lang,
                                           setLang
                                       }) {
    const [cacheStats, setCacheStats] = useState({ webCache: 0, logFile: 0, dbFile: 0 });

    const fetchCacheStats = async () => {
        const electron = window.require ? window.require('electron') : null;
        if (electron && electron.ipcRenderer) {
            const stats = await electron.ipcRenderer.invoke('get-cache-stats');
            if (stats) setCacheStats(stats);
        }
    };

    useEffect(() => {
        fetchCacheStats();
    }, []);

    const handleClearCache = async (type) => {
        const electron = window.require ? window.require('electron') : null;
        if (electron && electron.ipcRenderer) {
            await electron.ipcRenderer.invoke('clear-app-cache', { [type]: true });
            fetchCacheStats();
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const statusClasses = {
        "RUNNING": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        "STOPPED": "text-rose-500 bg-rose-500/10 border-rose-500/20",
        "PROCESSING...": "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }[serviceStatus] || "text-slate-400 bg-slate-100 border-slate-200";

    return (
        <div className="flex-1 flex flex-col overflow-y-auto text-xs select-none p-4 space-y-4 scrollbar-none bg-slate-50/30">

            {/* Language Selection Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm animate-in fade-in duration-100">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <FontAwesomeIcon icon={faLanguage} className="text-indigo-500" /> {t('languageLabel')}
                </h3>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Select interface language</span>
                    </div>
                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="text-xs border border-black/10 px-2 py-1 rounded-md focus:outline-none bg-white font-semibold text-slate-800"
                    >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                </div>
            </div>

            {/* Background Engine Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <FontAwesomeIcon icon={faGear} className="text-slate-500" /> {t('backgroundEngine')}
                </h3>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <label className="font-bold text-slate-800 text-[11px]">{t('engineStatus')}</label>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusClasses}`}>
                        {serviceStatus}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <button 
                        onClick={() => onServiceAction('start')} 
                        disabled={serviceStatus === 'RUNNING'}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faPlay} className="text-emerald-500" />
                    </button>

                    <button 
                        onClick={() => onServiceAction('stop')} 
                        disabled={serviceStatus === 'STOPPED'}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faStop} className="text-rose-500" />
                    </button>

                    <button 
                        onClick={() => onServiceAction('restart')}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faRotateRight} className="text-sky-500" />
                    </button>
                </div>
            </div>

            {/* Cache Management Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <FontAwesomeIcon icon={faHdd} className="text-teal-500" /> {t('cacheStats')}
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{t('webCache')}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">{formatBytes(cacheStats.webCache)}</span>
                            <button
                                onClick={() => handleClearCache('webCache')}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-transparent hover:border-rose-100 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{t('logFile')}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">{formatBytes(cacheStats.logFile)}</span>
                            <button
                                onClick={() => handleClearCache('logFile')}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded border border-transparent hover:border-rose-100 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{t('dbFile')}</span>
                        <span className="font-mono text-[10px] text-slate-500 pr-1">{formatBytes(cacheStats.dbFile)}</span>
                    </div>
                </div>
            </div>

            {/* Maintenance Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    <FontAwesomeIcon icon={faTools} className="text-amber-500" /> {t('maintenance')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={onExport}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 flex items-center justify-center cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faFileExport} />
                    </button>

                    <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 flex items-center justify-center cursor-pointer text-center">
                        <FontAwesomeIcon icon={faFileImport} />
                        <input type="file" accept=".json" onChange={onImport} className="hidden" />
                    </label>
                </div>

                <button 
                    onClick={() => confirm(t('resetDb') + "?") && onResetDatabase()}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold border border-rose-100 flex items-center justify-center cursor-pointer"
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>
        </div>
    );
}
