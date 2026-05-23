import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDatabase, faSliders, faXmark} from '@fortawesome/free-solid-svg-icons';

export default function TabNavigation({activeTab, setActiveTab, taskCount, onClose}) {
    return (<div
            className="px-3.5 py-1.5 bg-slate-50 border-b border-black/5 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex gap-1.5">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'config' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faSliders}/> Preferences
                </button>
                <button
                    onClick={() => setActiveTab("hub")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'hub' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faDatabase}/> Central Data Hub ({taskCount})
                </button>
            </div>
            <button onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                <FontAwesomeIcon icon={faXmark} className="text-sm"/>
            </button>
        </div>);
}
