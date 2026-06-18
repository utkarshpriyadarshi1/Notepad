import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCircleQuestion, 
    faXmark, 
    faRocket,
    faFileCode,
    faKeyboard,
    faFlag,
    faDatabase,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';

export default function HelpModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('quickstart');

    if (!isOpen) return null;

    const tabs = [
        { id: 'quickstart', label: 'Quick Start', icon: faRocket },
        { id: 'formats', label: 'Notebook Formats', icon: faFileCode },
        { id: 'shortcuts', label: 'Shortcuts Guide', icon: faKeyboard },
        { id: 'priorities', label: 'Priority Levels', icon: faFlag },
        { id: 'database', label: 'Storage & Backup', icon: faDatabase }
    ];

    return (
        <div 
            style={{ WebkitAppRegion: 'no-drag' }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[200] animate-in fade-in duration-200 no-drag p-4"
        >
            <div className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl w-[620px] h-[480px] max-h-[85vh] flex flex-row shadow-2xl select-text overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                
                {/* Left Navigation Sidebar */}
                <div className="w-[190px] bg-slate-50 dark:bg-slate-950/40 border-r border-black/5 dark:border-white/5 p-4 flex flex-col justify-between flex-shrink-0 select-none">
                    <div className="space-y-6">
                        {/* Title Header */}
                        <div className="flex items-center gap-2 px-1">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                                <FontAwesomeIcon icon={faCircleQuestion} className="text-xs" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                User Guide
                            </span>
                        </div>

                        {/* Navigation List */}
                        <nav className="flex flex-col gap-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                            isActive 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 dark:shadow-indigo-650/20 translate-x-1' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={tab.icon} className={`text-xs shrink-0 ${isActive ? 'text-white' : 'opacity-70'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Sidebar Info */}
                    <div className="px-1 text-[8px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                        v9.0.0 Stable Build
                    </div>
                </div>

                {/* Right Content Panel */}
                <div className="flex-1 p-5 flex flex-col min-h-0 bg-white dark:bg-slate-900">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5 flex-shrink-0 select-none">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>
                        <button 
                            onClick={onClose}
                            className="w-6 h-6 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-xs" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 min-h-0 overflow-y-auto mt-4 scrollbar-none text-slate-600 dark:text-slate-350 text-[11px] leading-relaxed pr-1">
                        
                        {/* Tab 1: Quick Start */}
                        {activeTab === 'quickstart' && (
                            <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <p className="text-slate-500 dark:text-slate-400 mb-3 text-[10px]">
                                    Follow these quick steps to master your workspace setup and note taking flow:
                                </p>
                                
                                <div className="group flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-3 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-200 hover:translate-x-1">
                                    <div className="flex items-center justify-between w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] shrink-0 justify-center">
                                        <span className="w-full text-center">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Add Notebooks</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Create distinct categories or directory folders using the <strong className="text-indigo-500">+ Notebook</strong> button in the left sidebar.</p>
                                    </div>
                                </div>

                                <div className="group flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-3 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-200 hover:translate-x-1">
                                    <div className="flex items-center justify-between w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] shrink-0 justify-center">
                                        <span className="w-full text-center">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Create Pages</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Select a category and click the <strong className="text-indigo-500">+ Note</strong> action in the logs panel to insert a new document.</p>
                                    </div>
                                </div>

                                <div className="group flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-3 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-200 hover:translate-x-1">
                                    <div className="flex items-center justify-between w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] shrink-0 justify-center">
                                        <span className="w-full text-center">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Rename & Edit</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Double-click any note title in the active header to rename it, or choose colors to flag priority tiers.</p>
                                    </div>
                                </div>

                                <div className="group flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-3 rounded-xl border border-black/5 dark:border-white/5 transition-all duration-200 hover:translate-x-1">
                                    <div className="flex items-center justify-between w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] shrink-0 justify-center">
                                        <span className="w-full text-center">4</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Floating Note Cards</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Click the Pop Out icon on any note card to detach it as a separate overlay utility that floats above other apps.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Notebook Formats */}
                        {activeTab === 'formats' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                                    Append specific extensions to note names to unlock customized editing views:
                                </p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-indigo-100/10 dark:from-slate-950/50 dark:to-indigo-950/10 rounded-xl border border-black/5 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                                        <div>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg text-[9px] font-bold font-mono">.md / .txt</span>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">Markdown Editor</h4>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Standard notes editor rendering formatted previews with lists and link tags.</p>
                                    </div>

                                    <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-indigo-100/10 dark:from-slate-950/50 dark:to-indigo-950/10 rounded-xl border border-black/5 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                                        <div>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg text-[9px] font-bold font-mono">.todo / .list</span>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">Checklist Ledger</h4>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Interactive todos layout tracking progress metrics, drag order, and task actions.</p>
                                    </div>

                                    <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-indigo-100/10 dark:from-slate-950/50 dark:to-indigo-950/10 rounded-xl border border-black/5 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                                        <div>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg text-[9px] font-bold font-mono">.log</span>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">Event Logs Timeline</h4>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Chronological stream ideal for journals, diary files, and meeting summaries.</p>
                                    </div>

                                    <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-indigo-100/10 dark:from-slate-950/50 dark:to-indigo-950/10 rounded-xl border border-black/5 dark:border-white/5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
                                        <div>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-lg text-[9px] font-bold font-mono">.xpnc</span>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">Expenses Sheet</h4>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-[10px]">Personal finance ledger grid designed to input costs, tags, and category lists.</p>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-black/5 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400">
                                    💡 <strong>Code Editor Support</strong>: File names matching <code>.html</code>, <code>.css</code>, <code>.js</code>, <code>.jsx</code>, <code>.json</code>, <code>.sql</code>, <code>.yml</code>, <code>.yaml</code> will render as code files with syntax highlights.
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Shortcuts Guide */}
                        {activeTab === 'shortcuts' && (
                            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] mb-2">
                                    Increase your productivity inside Markdown editors using keyboard shortcut tags:
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="font-bold text-slate-700 dark:text-slate-350">Bold Text</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">B</kbd>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="italic text-slate-700 dark:text-slate-350">Italics Preview</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">I</kbd>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="font-bold text-slate-700 dark:text-slate-350">Insert Heading</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">H</kbd>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="font-bold text-slate-700 dark:text-slate-350">Checklist Todo</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">/</kbd>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="font-bold text-slate-700 dark:text-slate-350">Codeblock Panel</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">E</kbd>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:bg-slate-100/50 dark:hover:bg-slate-950/40">
                                        <span className="font-bold text-slate-700 dark:text-slate-350">Hyperlink Tag</span>
                                        <div className="flex gap-1 items-center">
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">Ctrl</kbd>
                                            <span className="text-slate-400 text-[8px]">+</span>
                                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-b-[2.5px] rounded text-[9px] font-bold font-mono text-slate-600 dark:text-slate-300 shadow-xs">K</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Priority Levels */}
                        {activeTab === 'priorities' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] mb-2">
                                    Click the flag icon on any note preview card to set its priority tier:
                                </p>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-xl transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFlag} className="text-rose-500 text-xs w-4 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Red Flag</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 font-extrabold uppercase">Highest</span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-xl transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFlag} className="text-amber-500 text-xs w-4 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Yellow Flag</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 font-extrabold uppercase">Medium-High</span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-xl transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFlag} className="text-slate-400 text-xs w-4 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Gray / Default Flag</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-550 font-extrabold uppercase">Normal</span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-xl transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFlag} className="text-sky-400 text-xs w-4 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Light Blue Flag</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-500 font-extrabold uppercase">Low</span>
                                    </div>

                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-xl transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faFlag} className="text-emerald-400 text-xs w-4 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Green Flag</span>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 font-extrabold uppercase">Lowest</span>
                                    </div>
                                </div>

                                <div className="mt-3 p-2 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/10 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faChevronRight} className="text-indigo-500 text-[8px] shrink-0" />
                                    <span>You can choose <strong>"Sort By Priority"</strong> in the folder sort options dropdown to automatically rank active files by flag urgency levels.</span>
                                </div>
                            </div>
                        )}

                        {/* Tab 5: Storage & Backups */}
                        {activeTab === 'database' && (
                            <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="bg-gradient-to-r from-indigo-500/5 to-transparent dark:from-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/10 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                                        <FontAwesomeIcon icon={faDatabase} className="text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-850 dark:text-slate-100 mb-1 text-[11px]">Local SQLite Storage Architecture</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                            Your personal diaries, markdown records, and expenses are saved completely offline in a local, relational SQLite database (<code>personallog_data.db</code>) within your app's local storage path. No third-party servers receive your private logs.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-[10.5px]">
                                    <h4 className="font-bold text-slate-850 dark:text-slate-100 border-b border-black/5 dark:border-white/5 pb-1">
                                        💡 Data Mobility & Protection Tips
                                    </h4>
                                    
                                    <div className="flex gap-2 items-start pl-1">
                                        <span className="text-indigo-500 text-xs font-bold">•</span>
                                        <p><strong>Auto-Saving:</strong> Every letter or check items toggle executes real-time updates directly to local storage.</p>
                                    </div>

                                    <div className="flex gap-2 items-start pl-1">
                                        <span className="text-indigo-500 text-xs font-bold">•</span>
                                        <p><strong>Database Backups:</strong> Head to <strong>Settings &rarr; Config</strong> to download a consolidated JSON file containing all folders, schedules, logs, and vcs histories.</p>
                                    </div>

                                    <div className="flex gap-2 items-start pl-1">
                                        <span className="text-indigo-500 text-xs font-bold">•</span>
                                        <p><strong>Migration Safeties:</strong> The application automatically migrates table formats when updating app versions, preventing data loss during schema improvements.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
