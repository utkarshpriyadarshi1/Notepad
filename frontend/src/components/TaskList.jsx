import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare, faSquareCheck, faTrashCan } from '@fortawesome/free-solid-svg-icons';

// Memoize the list view to decouple check loops from header title changes
const TaskList = memo(function TaskList({ tasks, onToggleTask, onDeleteTask, t }) {
    if (tasks.length === 0) {
        return <p className="text-center text-xs opacity-40 py-8 italic select-none">{t('noEntries')}</p>;
    }

    return (
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-drag scrollbar-none">
            {tasks.map(tItem => (
                <div
                    key={tItem.id}
                    className="group flex items-center justify-between bg-white/20 hover:bg-white/40 p-2 rounded-lg transition-colors text-xs border border-transparent"
                >
                    <div
                        onClick={() => onToggleTask(tItem.id, tItem.done)}
                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    >
                        <FontAwesomeIcon
                            icon={tItem.done ? faSquareCheck : faSquare}
                            className={tItem.done ? 'text-slate-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'}
                        />
                        <span className={`font-medium break-all select-text ${tItem.done ? 'line-through opacity-40' : ''}`}>
                            {tItem.text}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(tItem.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer text-[10px]"
                        >
                            <FontAwesomeIcon icon={faTrashCan} />
                        </button>
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
