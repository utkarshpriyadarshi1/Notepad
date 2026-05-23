import {useState} from 'react';
import TabNavigation from './settings/TabNavigation';
import PreferencesTab from './settings/PreferencesTab';
import DataHubTab from './settings/DataHubTab';

export default function SettingsPanel({
                                          isOpen,
                                          onClose,
                                          appName,
                                          noteTitle,
                                          onUpdateTitle,
                                          alwaysOnTop,
                                          onToggleAlwaysOnTop,
                                          onResetDatabase,
                                          tasks,
                                          onToggleTask,
                                          onExport,
                                          onImport,
                                          serviceStatus,
                                          onServiceAction,
                                          onDeleteTaskGlobal,
                                          onRenameTaskGlobal,
                                          onExportSingleTask
                                      }) {
    const [activeTab, setActiveTab] = useState("config");

    if (!isOpen) return null;

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-in fade-in duration-150">
        <div
            className="w-[96%] h-[94%] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden text-slate-800">

            {/* 1. Sub-Header Navigation Tabs Row */}
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} taskCount={tasks.length}
                           onClose={onClose}/>

            {/* 2. Primary Layout Workspace Routing Panel Router */}
            {activeTab === "config" ? (<PreferencesTab
                noteTitle={noteTitle} onUpdateTitle={onUpdateTitle} alwaysOnTop={alwaysOnTop}
                onToggleAlwaysOnTop={onToggleAlwaysOnTop}
                onExport={onExport} onImport={onImport} onResetDatabase={onResetDatabase}
                serviceStatus={serviceStatus} onServiceAction={onServiceAction}
            />) : (<DataHubTab
                tasks={tasks} onToggleTask={onToggleTask} onDeleteTask={onDeleteTaskGlobal}
                onRenameTask={onRenameTaskGlobal} onExportTask={onExportSingleTask}
            />)}

            {/* 3. Bottom Footer */}
            <div
                className="p-1.5 bg-slate-50 border-t border-black/5 text-center text-[8px] font-bold text-slate-400 flex-shrink-0 uppercase tracking-widest select-none">
                {appName} Core Relational Manager Panel Connected
            </div>
        </div>
    </div>);
}
