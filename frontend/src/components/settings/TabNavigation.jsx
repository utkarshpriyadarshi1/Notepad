import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSliders, faXmark, faWindowRestore} from '@fortawesome/free-solid-svg-icons';

export default function TabNavigation({activeTab, setActiveTab, widgetCount, onClose, t}) {
    return (<div
            className="px-3 py-1.5 bg-slate-50 border-b border-black/5 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex gap-1">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${activeTab === 'config' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faSliders} className="text-[11px]"/>
                </button>
                <button
                    onClick={() => setActiveTab("widgets")}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'widgets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faWindowRestore} className="text-[11px]"/>
                    <span className="text-[9px] font-bold">({widgetCount})</span>
                </button>
            </div>
            <button onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                <FontAwesomeIcon icon={faXmark} className="text-sm"/>
            </button>
        </div>);
}
