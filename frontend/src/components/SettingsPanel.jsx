import {useState, useEffect} from 'react';
import TabNavigation from './settings/TabNavigation';
import PreferencesTab from './settings/PreferencesTab';
import DiagnosticsTab from './settings/DiagnosticsTab';
import LogsTab from './settings/LogsTab';
import DataHubTab from './settings/DataHubTab';

export default function SettingsPanel({
                                           isOpen,
                                           onClose,
                                           appName,
                                           onResetDatabase,
                                           onExport,
                                           onImport,
                                           serviceStatus,
                                           onServiceAction,
                                           
                                           // Folders & DB Props
                                           db,
                                           onTriggerRefresh,

                                           // i18n
                                           t,
                                           lang,
                                           setLang,

                                           // Preferences
                                           editorPrefs,
                                           onUpdateEditorPrefs,
                                           
                                           ipcRenderer,

                                           // Global Task CRUD
                                           onToggleTask,
                                           onDeleteTask,
                                           onRenameTask,
                                           onExportTask
                                       }) {
    const [activeTab, setActiveTab] = useState("config");
    const [allTasks, setAllTasks] = useState([]);

    useEffect(() => {
        if (db && isOpen && activeTab === 'datahub') {
            try {
                const res = db.exec("SELECT item_uuid, item_text_payload, is_marked_completed FROM task_items");
                if (res && res.length > 0 && res[0].values) {
                    setAllTasks(res[0].values.map(row => ({
                        id: row[0],
                        text: row[1],
                        done: row[2] === 1
                    })));
                } else {
                    setAllTasks([]);
                }
            } catch (err) {
                console.error("Failed to query all tasks for DataHub:", err);
            }
        }
    }, [db, isOpen, activeTab, onTriggerRefresh]);

    if (!isOpen) return null;

    const renderActiveTab = () => {
        switch (activeTab) {
            case "config":
                return (
                    <PreferencesTab
                        onExport={onExport}
                        onImport={onImport}
                        onResetDatabase={onResetDatabase}
                        serviceStatus={serviceStatus}
                        onServiceAction={onServiceAction}
                        t={t}
                        lang={lang}
                        setLang={setLang}
                        editorPrefs={editorPrefs}
                        onUpdateEditorPrefs={onUpdateEditorPrefs}
                    />
                );
            case "diagnostics":
                return (
                    <DiagnosticsTab
                        onResetDatabase={onResetDatabase}
                        ipcRenderer={ipcRenderer}
                    />
                );
            case "logs":
                return (
                    <LogsTab
                        ipcRenderer={ipcRenderer}
                    />
                );
            case "datahub":
                return (
                    <DataHubTab
                        tasks={allTasks}
                        onToggleTask={onToggleTask}
                        onDeleteTask={onDeleteTask}
                        onRenameTask={onRenameTask}
                        onExportTask={onExportTask}
                    />
                );
            default:
                return null;
        }
    };

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-in fade-in duration-150">
        <div
            className="w-[96%] h-[94%] bg-white rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden text-slate-800 dark:bg-slate-900/90 dark:text-slate-100">

            {/* 1. Sub-Header Navigation Tabs Row */}
            <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={onClose}
            />

            {/* 2. Primary Layout Workspace Routing Panel Router */}
            {renderActiveTab()}

            {/* 3. Bottom Footer */}
            <div
                className="p-1.5 bg-slate-50 dark:bg-slate-950 border-t border-black/5 dark:border-white/5 text-center text-[8px] font-bold text-slate-400 dark:text-slate-550 flex-shrink-0 uppercase tracking-widest select-none">
                {appName} Core Relational Manager Panel Connected
            </div>
        </div>
    </div>);
}
