import {useState} from 'react';
import TabNavigation from './settings/TabNavigation';
import PreferencesTab from './settings/PreferencesTab';

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
                                           onUpdateEditorPrefs
                                       }) {
    const [activeTab, setActiveTab] = useState("config");

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
            default:
                return null;
        }
    };

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 z-50 animate-in fade-in duration-150">
        <div
            className="w-[96%] h-[94%] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden text-slate-800">

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
                className="p-1.5 bg-slate-50 border-t border-black/5 text-center text-[8px] font-bold text-slate-400 flex-shrink-0 uppercase tracking-widest select-none">
                {appName} Core Relational Manager Panel Connected
            </div>
        </div>
    </div>);
}
