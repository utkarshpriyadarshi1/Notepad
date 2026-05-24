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

    return (<div className="flex-1 flex flex-col overflow-y-auto text-xs select-none p-4 space-y-4 scrollbar-none bg-slate-50/30">

            {/* Background Engine Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    Background Engine Service
                </h3>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <label className="font-bold text-slate-800 text-[11px]">Engine Status</label>
                        <span className="text-[9px] text-slate-400">Task sync background monitor</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusClasses}`}>
                        {serviceStatus}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="group relative flex-1">
                        <button onClick={() => onServiceAction('start')} disabled={serviceStatus === 'RUNNING'}
                                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center gap-1 text-[10px] cursor-pointer">
                            <FontAwesomeIcon icon={faPlay} className="text-emerald-500"/> Start
                        </button>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Start Engine
                        </div>
                    </div>

                    <div className="group relative flex-1">
                        <button onClick={() => onServiceAction('stop')} disabled={serviceStatus === 'STOPPED'}
                                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center gap-1 text-[10px] cursor-pointer">
                            <FontAwesomeIcon icon={faStop} className="text-rose-500"/> Stop
                        </button>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Stop Engine
                        </div>
                    </div>

                    <div className="group relative flex-1">
                        <button onClick={() => onServiceAction('restart')}
                                className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-black/10 rounded-lg font-semibold flex items-center justify-center gap-1 text-[10px] cursor-pointer">
                            <FontAwesomeIcon icon={faRotateRight} className="text-sky-500"/> Restart
                        </button>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Restart Engine
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Section */}
            <div className="bg-white rounded-xl border border-black/5 p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-black/5 pb-2">
                    Maintenance & Mobility
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="group relative">
                        <button onClick={onExport}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 text-[10px] cursor-pointer">
                            <FontAwesomeIcon icon={faFileExport} className="mr-1 opacity-70"/> Export Backup
                        </button>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Export JSON Backup
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="block w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-black/5 text-[10px] text-center cursor-pointer">
                            <FontAwesomeIcon icon={faFileImport} className="mr-1 opacity-70"/> Import Backup
                            <input type="file" accept=".json" onChange={onImport} className="hidden"/>
                        </label>
                        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Import JSON Backup
                        </div>
                    </div>
                </div>

                <div className="group relative w-full">
                    <button onClick={() => confirm("Reset database cache state?") && onResetDatabase()}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold border border-rose-100 text-[10px] cursor-pointer">
                        <FontAwesomeIcon icon={faTrash} className="mr-1"/> Reset Database Storage
                    </button>
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        Wipe Database & Reboot
                    </div>
                </div>
            </div>
        </div>);
}
