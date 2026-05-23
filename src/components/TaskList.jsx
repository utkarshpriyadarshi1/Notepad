import React from 'react';

export default function TaskList({tasks, onToggleTask}) {
    if (tasks.length === 0) {
        return <p className="text-center text-xs opacity-40 py-8 italic">No entries logged.</p>;
    }

    return (<div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-drag scrollbar-none">
            {tasks.map(t => (<div
                    key={t.id}
                    onClick={() => onToggleTask(t.id, t.done)}
                    className="flex items-center gap-2 bg-white/30 hover:bg-white/50 p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent hover:border-black/5"
                >
                    <input type="checkbox" checked={t.done} readOnly
                           className="rounded accent-slate-800 pointer-events-none"/>
                    <span className={`font-medium break-all ${t.done ? 'line-through opacity-40' : ''}`}>{t.text}</span>
                </div>))}
        </div>);
}
