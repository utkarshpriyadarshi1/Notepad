// src/components/TaskList.jsx
import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare, faSquareCheck } from '@fortawesome/free-solid-svg-icons';

// Memoize the list view to decouple check loops from header title changes
const TaskList = memo(function TaskList({ tasks, onToggleTask }) {
    if (tasks.length === 0) {
        return <p className="text-center text-xs opacity-40 py-8 italic select-none">No entries logged.</p>;
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-drag scrollbar-none">
            {tasks.map(t => (
                <div
                    key={t.id}
                    onClick={() => onToggleTask(t.id, t.done)}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/40 p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent"
                >
                    <FontAwesomeIcon
                        icon={t.done ? faSquareCheck : faSquare}
                        className={t.done ? 'text-slate-600 transition-colors' : 'text-slate-400 transition-colors'}
                    />
                    <span className={`font-medium break-all select-text ${t.done ? 'line-through opacity-40' : ''}`}>
                        {t.text}
                    </span>
                </div>
            ))}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom evaluation: Only re-render if the tasks array length or state contents change
    return JSON.stringify(prevProps.tasks) === JSON.stringify(nextProps.tasks);
});

export default TaskList;
