import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSliders, faXmark, faWindowRestore} from '@fortawesome/free-solid-svg-icons';

export default function TabNavigation({activeTab, setActiveTab, widgetCount, onClose}) {
    return (<div
            className="px-3 py-1.5 bg-slate-50 border-b border-black/5 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex gap-1">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'config' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faSliders}/> Config
                </button>
                <button
                    onClick={() => setActiveTab("widgets")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'widgets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faWindowRestore}/> Notes ({widgetCount})
                </button>
            </div>
            <div className="group relative flex items-center">
                <button onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                    <FontAwesomeIcon icon={faXmark} className="text-sm"/>
                </button>
                <div className="absolute top-full mt-1.5 right-0 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                    Close Settings
                </div>
            </div>
        </div>);
}
