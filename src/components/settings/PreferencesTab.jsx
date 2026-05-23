import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faCircleDot,
    faFileExport,
    faFileImport,
    faPlay,
    faRotateRight,
    faStop,
    faTrash
} from '@fortawesome/free-solid-svg-icons';

export default function PreferencesTab({
                                           noteTitle,
                                           onUpdateTitle,
                                           alwaysOnTop,
                                           onToggleAlwaysOnTop,
                                           onExport,
                                           onImport,
                                           onResetDatabase,
                                           serviceStatus,
                                           onServiceAction
                                       }) {
    const statusClasses = {
        "RUNNING": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        "STOPPED": "text-rose-500 bg-rose-500/10 border-rose-500/20",
        "PROCESSING...": "text-amber-500 bg-amber-500/10 border-amber-500/20"
    }[serviceStatus] || "text-slate-400 bg-slate-100 border-slate-200";

    return (<div className="flex-1 flex overflow-hidden text-xs select-none">
            {/* Left Options Block */}
            <div className="w-[55%] p-3.5 overflow-y-auto border-r border-black/5 space-y-3.5 scrollbar-none">
                <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Widget Label
                        Title</label>
                    <input
                        type="text" value={noteTitle} onChange={(e) => onUpdateTitle(e.target.value)} maxLength={30}
                        className="w-full bg-slate-50 border border-black/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white text-slate-800 font-medium"
                    />
                </div>
                <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                    <div className="flex flex-col">
                        <label className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Pin Floating
                            Mode</label>
                        <span className="text-[9px] text-slate-400">Keep note above other windows</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={alwaysOnTop} onChange={onToggleAlwaysOnTop}
                               className="sr-only peer"/>
                        <div
                            className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-800"></div>
                    </label>
                </div>
                <div className="flex flex-col gap-2 border-b border-black/5 pb-3.5">
                    <label className="font-bold text-slate-400 uppercase text-[8px] tracking-wider">Data Mobility
                        Porting</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={onExport}
                                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 text-[10px] cursor-pointer">
                            <FontAwesomeIcon icon={faFileExport} className="mr-1 opacity-70"/> Export
                        </button>
                        <label
                            className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 text-[10px] text-center cursor-pointer"><FontAwesomeIcon
                            icon={faFileImport} className="mr-1 opacity-70"/> Import<input type="file" accept=".json"
                                                                                           onChange={onImport}
                                                                                           className="hidden"/></label>
                    </div>
                </div>
                <button onClick={() => confirm("Reset database cache state?") && onResetDatabase()}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold border border-rose-100 text-[10px] cursor-pointer">
                    <FontAwesomeIcon icon={faTrash} className="mr-1"/> Reset DB Storage
                </button>
            </div>

            {/* Right Status Monitors */}
            <div className="w-[45%] p-3.5 bg-slate-50/50 flex flex-col overflow-hidden">
                <div
                    className={`border p-2.5 rounded-xl flex items-center justify-between font-bold mb-3 ${statusClasses}`}>
                    <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCircleDot}
                                         className={serviceStatus === 'RUNNING' ? 'animate-pulse' : ''}/>
                        <span className="text-[9px] uppercase tracking-wider">Background Engine</span>
                    </div>
                    <span className="text-[10px] tracking-tight">{serviceStatus}</span>
                </div>
                <div className="flex flex-col gap-1.5 mb-4">
                    <button onClick={() => onServiceAction('start')} disabled={serviceStatus === 'RUNNING'}
                            className="w-full py-1.5 bg-white border border-black/10 text-slate-800 disabled:opacity-40 font-semibold rounded-lg shadow-sm flex items-center px-3 gap-2 text-[10px] cursor-pointer">
                        <FontAwesomeIcon icon={faPlay} className="text-emerald-500 w-3"/> Start Service
                    </button>
                    <button onClick={() => onServiceAction('stop')} disabled={serviceStatus === 'STOPPED'}
                            className="w-full py-1.5 bg-white border border-black/10 text-slate-800 disabled:opacity-40 font-semibold rounded-lg shadow-sm flex items-center px-3 gap-2 text-[10px] cursor-pointer">
                        <FontAwesomeIcon icon={faStop} className="text-rose-500 w-3"/> Stop Service
                    </button>
                    <button onClick={() => onServiceAction('restart')}
                            className="w-full py-1.5 bg-white border border-black/10 text-slate-800 font-semibold rounded-lg shadow-sm flex items-center px-3 gap-2 text-[10px] cursor-pointer">
                        <FontAwesomeIcon icon={faRotateRight} className="text-sky-500 w-3"/> Restart Service
                    </button>
                </div>
            </div>
        </div>);
}
