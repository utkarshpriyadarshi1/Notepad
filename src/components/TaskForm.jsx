import {useState} from 'react';

export default function TaskForm({onAddTask}) {
    const [taskInput, setTaskInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskInput.trim()) return;
        onAddTask(taskInput);
        setTaskInput('');
    };

    return (<form onSubmit={handleSubmit} className="no-drag flex mb-3">
            {/* The form submit event listens to the Enter key automatically */}
            <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Type objective and press Enter..."
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-black/10 bg-white/60 backdrop-blur-sm focus:outline-none focus:bg-white text-slate-800 font-medium placeholder:text-slate-400"
            />
        </form>);
}
