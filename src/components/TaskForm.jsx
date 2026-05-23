import React, { useState } from 'react';

export default function TaskForm({ onAddTask }) {
    const [taskInput, setTaskInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskInput.trim()) return;
        onAddTask(taskInput);
        setTaskInput('');
    };

    return (
        <form onSubmit={handleSubmit} className="no-drag flex gap-1.5 mb-3">
            <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add task objective..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-black/10 bg-white/60 backdrop-blur-sm focus:outline-none focus:bg-white text-slate-800 font-medium"
            />
            <button type="submit" className="px-3 py-1 bg-black/80 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors">+</button>
        </form>
    );
}
