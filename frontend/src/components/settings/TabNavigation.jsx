import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSliders, faXmark, faWindowRestore} from '@fortawesome/free-solid-svg-icons';

export default function TabNavigation({activeTab, setActiveTab, widgetCount, onClose, t}) {
    return (<div
            className="px-3 py-1.5 bg-slate-50 border-b border-black/5 flex items-center justify-between flex-shrink-0 select-none">
            <div className="flex gap-1">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'config' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faSliders}/> {t('preferences')}
                </button>
                <button
                    onClick={() => setActiveTab("widgets")}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'widgets' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-black/5'}`}
                >
                    <FontAwesomeIcon icon={faWindowRestore}/> {t('widgets')} ({widgetCount})
                </button>
            </div>
            <button onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                <FontAwesomeIcon icon={faXmark} className="text-sm"/>
            </button>
        </div>);
}
