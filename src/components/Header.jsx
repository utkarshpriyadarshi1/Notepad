import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Header({ title, noteColor, ipcRenderer }) {
    // Dynamically extract the header background color match from the layout class string
    const headerBgColor = noteColor.split(' ').find(cls => cls.startsWith('header-'))?.replace('header-', 'bg-') || 'bg-amber-300';

    return (
        /* The 'cursor-move' utility changes your mouse pointer to a move icon */
        <div
            style={{ WebkitAppRegion: 'drag' }}
            className={`w-full h-10 flex items-center justify-between px-3 cursor-move border-b border-black/10 select-none ${headerBgColor}`}
        >
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">{title}</span>
            </div>

            {/* CRITICAL: Buttons must have 'WebkitAppRegion: no-drag' inline so they remain clickable */}
            <div style={{ WebkitAppRegion: 'no-drag' }} className="flex items-center gap-2">
                <button
                    onClick={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                    className="text-xs font-bold hover:scale-110 transition-transform px-1 cursor-pointer"
                    title="Spawn New Note"
                >
                    <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                    onClick={() => window.close()}
                    className="text-xs font-bold hover:scale-110 transition-transform px-1 cursor-pointer"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
        </div>
    );
}
