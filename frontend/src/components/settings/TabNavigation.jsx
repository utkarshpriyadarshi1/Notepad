import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSliders, faXmark, faWindowRestore, faListCheck} from '@fortawesome/free-solid-svg-icons';

export default function TabNavigation({activeTab, setActiveTab, onClose}) {
    return (<div
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-b border-black/5 dark:border-white/5 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex gap-1">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'config' ? 'bg-indigo-600 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <FontAwesomeIcon icon={faSliders}/> Config
                </button>
                <button
                    onClick={() => setActiveTab("datahub")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'datahub' ? 'bg-indigo-600 text-white dark:bg-white dark:text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <FontAwesomeIcon icon={faListCheck}/> Data Hub
                </button>
            </div>
            <div className="group relative flex items-center">
                <button onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 p-1 cursor-pointer transition-colors">
                    <FontAwesomeIcon icon={faXmark} className="text-sm"/>
                </button>
                <div className="absolute top-full mt-1.5 right-0 bg-slate-900/95 text-white dark:bg-slate-950 dark:text-slate-200 text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10 dark:border-white/5">
                    Close Settings
                </div>
            </div>
        </div>);
}
