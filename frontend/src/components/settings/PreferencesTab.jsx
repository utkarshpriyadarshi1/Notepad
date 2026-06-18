import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faFileExport,
    faFileImport,
    faTrash
} from '@fortawesome/free-solid-svg-icons';

export default function PreferencesTab({
                                           onExport,
                                           onImport,
                                           onResetDatabase
                                       }) {
    return (<div className="flex-1 flex flex-col overflow-y-auto text-xs select-none p-4 space-y-4 scrollbar-none bg-slate-50/30 dark:bg-slate-950/20">

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
