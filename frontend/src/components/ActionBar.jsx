import {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheckDouble, faFileLines, faGear, faListCheck, faPalette} from '@fortawesome/free-solid-svg-icons';

export default function ActionBar({
                                       onChangeTheme, onClearDone, hasTasks, viewMode, onToggleView, onOpenSettings
                                   }) {
    const [showPalette, setShowPalette] = useState(false);
    const colors = ['glass', 'yellow', 'pink', 'blue', 'green'];
    const bgClasses = {
        glass: 'bg-gradient-to-br from-white/80 via-slate-100/50 to-white/30 border border-slate-300',
        yellow: 'bg-amber-400', pink: 'bg-rose-400', blue: 'bg-sky-400', green: 'bg-emerald-400'
    };

    return (<div style={{WebkitAppRegion: 'no-drag'}}
                 className="relative mt-auto pt-2 border-t border-black/5 flex items-center justify-between px-1 text-slate-700 select-none">
        <div className="flex items-center gap-2.5">

            {/* Mode Switcher Document/Checklist Button */}
            <div className="group relative flex items-center">
                <button
                    type="button" onClick={onToggleView}
                    className="p-1.5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors text-[13px] cursor-pointer text-slate-900 font-bold"
                >
                    <FontAwesomeIcon icon={viewMode === 'tasks' ? faFileLines : faListCheck}/>
                </button>
                <div className="absolute bottom-full mb-1.5 left-0 translate-x-0 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                    {viewMode === 'tasks' ? "Switch to Editor" : "Switch to Checklist"}
                </div>
            </div>

            {/* Color Palette Picker Popover */}
            <div className="relative" onMouseEnter={() => setShowPalette(true)}
                 onMouseLeave={() => setShowPalette(false)}>
                <div className="group relative flex items-center">
                    <button type="button" className="p-1.5 rounded-full hover:bg-black/5 text-[13px] cursor-pointer">
                        <FontAwesomeIcon icon={faPalette} className="opacity-75"/>
                    </button>
                    {!showPalette && (
                        <div className="absolute bottom-full mb-1.5 left-0 translate-x-0 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Change Color
                        </div>
                    )}
                </div>
                {showPalette && (
                    <div className="absolute bottom-full left-0 pb-1.5 z-50">
                        <div className="bg-white/95 backdrop-blur-md shadow-xl border border-black/10 rounded-full px-2 py-1.5 flex gap-1.5">
                            {colors.map(c => (<button key={c} type="button" onClick={() => onChangeTheme(c)}
                                                      className={`w-4 h-4 rounded-full ${bgClasses[c]} border border-black/10 cursor-pointer`}></button>))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Action Trigger Buttons */}
        <div className="flex items-center gap-2.5">
            {viewMode === 'tasks' && hasTasks && (
                <div className="group relative flex items-center">
                    <button onClick={onClearDone}
                                                                  className="px-2 py-1 bg-black/5 hover:bg-black/10 rounded-md text-[10px] font-bold cursor-pointer flex items-center gap-1 opacity-85">
                        <FontAwesomeIcon icon={faCheckDouble}/> Clear Completed
                    </button>
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        Clear Completed Tasks
                    </div>
                </div>
            )}

            <div className="group relative flex items-center">
                <button
                    type="button" onClick={onOpenSettings}
                    className="p-1.5 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors text-[13px] cursor-pointer text-slate-600 hover:text-slate-900"
                >
                    <FontAwesomeIcon icon={faGear}/>
                </button>
                <div className="absolute bottom-full mb-1.5 right-0 translate-x-0 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                    Preferences
                </div>
            </div>
        </div>
    </div>);
}
