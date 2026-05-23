import {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faPlus, faXmark} from '@fortawesome/free-solid-svg-icons';

export default function Header({title, noteColor, ipcRenderer, onUpdateTitle}) {
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

    const headerBgColor = noteColor.split(' ').find(cls => cls.startsWith('header-'))?.replace('header-', 'bg-') || 'bg-amber-300';

    return (<div
            style={{WebkitAppRegion: isEditing ? 'no-drag' : 'drag'}} // Disable dragging during active typing
            className={`w-full h-10 flex items-center justify-between px-3 cursor-move border-b border-black/10 select-none transition-colors duration-200 ${headerBgColor}`}
        >
            <div style={{WebkitAppRegion: 'no-drag'}} className="flex-1 flex items-center min-w-0 pr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2 flex-shrink-0"></div>

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
                    </div>) : (<span
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold uppercase tracking-wider opacity-75 hover:opacity-100 hover:bg-black/5 px-1.5 py-0.5 rounded cursor-pointer transition-all truncate block select-none"
                        title="Click to rename note"
                    >
                        {title}
                    </span>)}
            </div>

            {/* Native Control Buttons */}
            <div style={{WebkitAppRegion: 'no-drag'}} className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                    className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    title="Spawn New Note"
                >
                    <FontAwesomeIcon icon={faPlus}/>
                </button>
                <button
                    onClick={() => window.close()}
                    className="text-xs opacity-75 hover:opacity-100 transition-opacity p-1 cursor-pointer"
                >
                    <FontAwesomeIcon icon={faXmark}/>
                </button>
            </div>
        </div>);
}
