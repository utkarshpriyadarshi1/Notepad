import {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';

export default function TaskForm({onAddTask, t}) {
    const [taskInput, setTaskInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskInput.trim()) return;
        onAddTask(taskInput);
        setTaskInput('');
    };

    return (<form onSubmit={handleSubmit} className="no-drag flex gap-2 mb-3">
            <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder={t('typeObjective')}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-black/10 bg-white/60 backdrop-blur-sm focus:outline-none focus:bg-white text-slate-800 font-medium placeholder:text-slate-400"
            />
            <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-sm flex items-center justify-center"
            >
                <FontAwesomeIcon icon={faPlus} />
            </button>
        </form>);
}
