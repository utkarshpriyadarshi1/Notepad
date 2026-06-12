// src/components/TaskList.jsx
import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare, faSquareCheck, faTrashCan } from '@fortawesome/free-solid-svg-icons';

// Memoize the list view to decouple check loops from header title changes
const TaskList = memo(function TaskList({ tasks, onToggleTask, onDeleteTask }) {
    if (tasks.length === 0) {
        return <p className="text-center text-xs opacity-40 py-8 italic select-none">No entries logged.</p>;
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-drag scrollbar-none">
            {tasks.map(t => (
                <div
                    key={t.id}
                    className="group flex items-center justify-between bg-white/20 hover:bg-white/40 p-2 rounded-lg transition-colors text-xs border border-transparent"
                >
                    <div
                        onClick={() => onToggleTask(t.id, t.done)}
                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    >
                        <FontAwesomeIcon
                            icon={t.done ? faSquareCheck : faSquare}
                            className={t.done ? 'text-slate-650 flex-shrink-0' : 'text-slate-450 flex-shrink-0'}
                        />
                        <span className={`font-medium break-all select-text ${t.done ? 'line-through opacity-40' : ''}`}>
                            {t.text}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-shrink-0">
                        <div className="group/tooltip relative flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(t.id);
                                }}
                                className="p-1 text-slate-450 hover:text-rose-650 hover:bg-rose-50 rounded cursor-pointer text-[10px]"
                            >
                                <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[8px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 pointer-events-none z-[100] shadow-md border border-white/10">
                                Delete Task
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom evaluation: Only re-render if the tasks array length or state contents change
    return JSON.stringify(prevProps.tasks) === JSON.stringify(nextProps.tasks);
});

export default TaskList;
