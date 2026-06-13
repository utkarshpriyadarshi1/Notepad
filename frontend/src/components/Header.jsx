import {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faPlus,
    faXmark,
    faThumbtack,
    faGripVertical,
    faSun,
    faMoon,
    faTerminal,
    faQuestionCircle,
    faGear
} from '@fortawesome/free-solid-svg-icons';

export default function Header({
                                   title,
                                   noteColor,
                                   ipcRenderer,
                                   onUpdateTitle,
                                   alwaysOnTop,
                                   onToggleAlwaysOnTop,
                                   onToggleSettings,
                                   onToggleLogs,
                                   onToggleHelp,
                                   isDarkMode,
                                   onToggleDarkMode
                               }) {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(title);

    // Keep the local field synchronized if the title updates from an external DB import
    useEffect(() => {
        setInputValue(title);
    }, [title]);

    const handleSave = () => {
        if (inputValue.trim() && inputValue !== title) {
            onUpdateTitle(inputValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setInputValue(title); // Reset to old title on cancel
            setIsEditing(false);
        }
    };

    const handleDragStart = (e) => {
        if (e.button !== 0) return; // Only left click drags
        
        let startX = e.screenX;
        let startY = e.screenY;

        const handleDragMove = (moveEvent) => {
            const dx = moveEvent.screenX - startX;
            const dy = moveEvent.screenY - startY;
            startX = moveEvent.screenX;
            startY = moveEvent.screenY;

            if (ipcRenderer) {
                ipcRenderer.send('drag-window', dx, dy);
            }
        };

        const handleDragEnd = () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    };

    const headerBgColor = noteColor.split(' ').find(cls => cls.startsWith('header-'))?.replace('header-', 'bg-') || 'bg-amber-300';

    return (<div
            style={{WebkitAppRegion: isEditing ? 'no-drag' : 'drag'}} // Disable dragging during active typing
            className={`w-full h-10 flex items-center justify-between px-3 cursor-move border-b border-black/10 select-none transition-colors duration-200 ${headerBgColor}`}
        >
            <div style={{WebkitAppRegion: 'no-drag'}} className="flex-1 flex items-center min-w-0 pr-2">
                <div
                    onMouseDown={handleDragStart}
                    className="group relative flex items-center mr-2 cursor-grab active:cursor-grabbing text-slate-700/60 hover:text-slate-900 transition-colors p-1 flex-shrink-0"
                >
                    <FontAwesomeIcon icon={faGripVertical} className="text-[11px]" />
                </div>

                {isEditing ? (<div className="flex items-center w-full gap-1.5">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            maxLength={30}
                            className="w-full text-xs font-bold uppercase tracking-wider bg-white/50 border border-black/10 px-2 py-0.5 rounded focus:outline-none focus:bg-white text-slate-800"
                        />
                        <button onClick={handleSave}
                                className="text-[10px] text-slate-700 hover:text-black p-1 cursor-pointer">
                            <FontAwesomeIcon icon={faCheck}/>
                        </button>
                    </div>) : (<div className="group relative flex items-center min-w-0">
                        <span
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold uppercase tracking-wider opacity-75 hover:opacity-100 hover:bg-black/5 px-1.5 py-0.5 rounded cursor-pointer transition-all truncate block select-none"
                        >
                            {title}
                        </span>
                    </div>)}
            </div>

            {/* Native Control Buttons */}
            <div style={{WebkitAppRegion: 'no-drag'}} className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={onToggleAlwaysOnTop}
                    className={`text-xs transition-all p-1 cursor-pointer ${
                        alwaysOnTop ? 'opacity-100 text-slate-900 scale-110' : 'opacity-50 hover:opacity-85 text-slate-700'
                    }`}
                >
                    <FontAwesomeIcon icon={faThumbtack} className={alwaysOnTop ? "rotate-45" : ""} />
                </button>

                <button
                    onClick={onToggleDarkMode}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
                </button>

                <button
                    onClick={onToggleLogs}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={faTerminal} />
                </button>

                <button
                    onClick={onToggleHelp}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={faQuestionCircle} />
                </button>

                <button
                    onClick={onToggleSettings}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={faGear} />
                </button>

                <button
                    onClick={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={faPlus}/>
                </button>

                <button
                    onClick={() => window.close()}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity p-1 cursor-pointer text-slate-700"
                >
                    <FontAwesomeIcon icon={faXmark}/>
                </button>
            </div>
        </div>);
}
