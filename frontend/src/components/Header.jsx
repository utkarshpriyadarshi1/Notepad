import {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faPlus, faXmark, faThumbtack, faGripVertical} from '@fortawesome/free-solid-svg-icons';

export default function Header({title, noteColor, ipcRenderer, onUpdateTitle, alwaysOnTop, onToggleAlwaysOnTop}) {
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
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        Drag Note
                    </div>
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
                        <div className="group relative flex items-center">
                            <button onClick={handleSave}
                                    className="text-[10px] text-slate-700 hover:text-black p-1 cursor-pointer">
                                <FontAwesomeIcon icon={faCheck}/>
                            </button>
                            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                                Save Title
                            </div>
                        </div>
                    </div>) : (<div className="group relative flex items-center min-w-0">
                        <span
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold uppercase tracking-wider opacity-75 hover:opacity-100 hover:bg-black/5 px-1.5 py-0.5 rounded cursor-pointer transition-all truncate block select-none"
                        >
                            {title}
                        </span>
                        <div className="absolute top-full mt-1.5 left-0 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                            Rename Note
                        </div>
                    </div>)}
            </div>

            {/* Native Control Buttons */}
            <div style={{WebkitAppRegion: 'no-drag'}} className="flex items-center gap-3 flex-shrink-0">
                <div className="group relative flex items-center">
                    <button
                        onClick={onToggleAlwaysOnTop}
                        className={`text-xs transition-all p-1 cursor-pointer ${
                            alwaysOnTop ? 'opacity-100 text-slate-900 scale-110' : 'opacity-50 hover:opacity-85 text-slate-755'
                        }`}
                    >
                        <FontAwesomeIcon icon={faThumbtack} className={alwaysOnTop ? "rotate-45" : ""} />
                    </button>
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        {alwaysOnTop ? "Unpin Note" : "Pin Note"}
                    </div>
                </div>

                <div className="group relative flex items-center">
                    <button
                        onClick={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                        className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faPlus}/>
                    </button>
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        New Note
                    </div>
                </div>

                <div className="group relative flex items-center">
                    <button
                        onClick={() => window.close()}
                        className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark}/>
                    </button>
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                        Close Note
                    </div>
                </div>
            </div>
        </div>);
}
