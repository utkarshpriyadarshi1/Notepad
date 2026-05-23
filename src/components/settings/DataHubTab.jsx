import {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faCloudArrowDown,
    faListCheck,
    faPen,
    faSquare,
    faSquareCheck,
    faTrashCan
} from '@fortawesome/free-solid-svg-icons';

export default function DataHubTab({tasks, onToggleTask, onDeleteTask, onRenameTask, onExportTask}) {
    const [editingId, setEditingId] = useState(null);
    const [inputVal, setInputVal] = useState("");

    const startRename = (task) => {
        setEditingId(task.id);
        setInputVal(task.text);
    };

    const commitRename = (id) => {
        if (inputVal.trim()) onRenameTask(id, inputVal.trim());
        setEditingId(null);
    };

    return (<div className="flex-1 p-4 flex flex-col overflow-hidden min-h-0 bg-slate-50/40">
        <div className="flex items-center justify-between mb-2.5 flex-shrink-0 select-none">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">Master Data Management System</span>
                <span className="text-[10px] text-slate-400">Perform operational query transformations directly across records</span>
            </div>
            <span
                className="bg-slate-100 border border-black/5 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-600 uppercase tracking-tight">Pool Cluster: Operational</span>
        </div>

        <div
            className="flex-1 border border-black/10 bg-white rounded-xl overflow-y-auto shadow-inner p-1 scrollbar-none">
            {tasks.length === 0 ? (<div
                className="h-full flex flex-col items-center justify-center py-12 opacity-40 italic gap-2 select-none">
                <FontAwesomeIcon icon={faListCheck} className="text-xl"/>
                <p className="text-[11px]">No active datasets mapped inside the active SQLite data matrix.</p>
            </div>) : (<div className="space-y-1.5">
                {tasks.map(task => (<div key={task.id}
                                         className="w-full border border-black/5 hover:border-black/10 rounded-lg p-2.5 bg-white flex items-center justify-between gap-3 shadow-sm hover:shadow transition-all group duration-150">
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                        <button onClick={() => onToggleTask(task.id, task.done)}
                                className="cursor-pointer text-xs text-slate-300 hover:text-slate-500 flex-shrink-0">
                            <FontAwesomeIcon icon={task.done ? faSquareCheck : faSquare}
                                             className={task.done ? "text-slate-500" : ""}/>
                        </button>

                        {editingId === task.id ? (<input
                            type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                            onBlur={() => commitRename(task.id)}
                            onKeyDown={(e) => e.key === 'Enter' && commitRename(task.id)}
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-medium focus:outline-none"
                        />) : (<span
                            className={`text-xs font-semibold truncate select-text ${task.done ? 'line-through text-slate-400 opacity-60' : 'text-slate-700'}`}>{task.text}</span>)}
                    </div>

                    <div
                        className="flex items-center gap-1.5 flex-shrink-0 opacity-80 group-hover:opacity-100 select-none">
                        {editingId === task.id ? (<button onClick={() => commitRename(task.id)}
                                                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer text-[11px]">
                            <FontAwesomeIcon icon={faCheck} className="w-3 text-center"/></button>) : (
                            <button onClick={() => startRename(task)}
                                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer text-[11px]"
                                    title="Rename"><FontAwesomeIcon icon={faPen}
                                                                    className="w-3 text-center"/></button>)}
                        <button onClick={() => onExportTask(task)}
                                className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded cursor-pointer text-[11px]"
                                title="Isolate Export"><FontAwesomeIcon icon={faCloudArrowDown}
                                                                        className="w-3 text-center"/>
                        </button>
                        <button
                            onClick={() => confirm("Delete this task record entry?") && onDeleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer text-[11px]"
                            title="Purge Row"><FontAwesomeIcon icon={faTrashCan}
                                                               className="w-3 text-center"/></button>
                    </div>
                </div>))}
            </div>)}
        </div>
    </div>);
}
