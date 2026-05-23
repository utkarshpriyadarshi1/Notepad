import React from 'react';

export default function Header({ title, noteColor, ipcRenderer }) {
    const headerBgColor = noteColor.split(' ').find(cls => cls.startsWith('header-'))?.replace('header-', 'bg-') || 'bg-amber-300';

    return (
        <div className={`drag-region w-full h-10 flex items-center justify-between px-3 cursor-move border-b border-black/5 ${headerBgColor}`}>
            <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">{title}</span>
            </div>

            <div className="no-drag flex items-center gap-2">
                <button
                    onClick={() => ipcRenderer ? ipcRenderer.send('create-note') : alert("Electron only.")}
                    className="text-xs font-bold hover:scale-110 transition-transform px-1"
                    title="Spawn New Note"
                >
                    ➕
                </button>
                <button onClick={() => window.close()} className="text-xs font-bold hover:scale-110 transition-transform px-1">✕</button>
            </div>
        </div>
    );
}
