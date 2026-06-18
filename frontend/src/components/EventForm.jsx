import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function EventForm({ onAddEvent }) {
    const [text, setText] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onAddEvent(text.trim());
            setText("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-1.5 mb-2.5 flex-shrink-0 no-drag select-none">
            <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Log event (e.g. Completed report)..."
                maxLength={80}
                className="flex-1 text-[10px] px-2.5 py-1.5 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-slate-800 font-medium"
            />
            <button
                type="submit"
                className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center cursor-pointer"
            >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
            </button>
        </form>
    );
}
