// src/components/MarkdownEditor.jsx
import { useState, useMemo } from 'react';
import { marked } from 'marked';

export default function MarkdownEditor({ text, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);

    // useMemo prevents 'marked' from parsing the text string on unneeded re-renders
    const compiledHtml = useMemo(() => {
        return marked.parse(text || "*Empty note profile. Click here to initialize.*");
    }, [text, isEditing]); // Only re-compute when exiting edit state or changing targets

    if (isEditing) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden no-drag bg-white/10 p-2.5 rounded-xl border border-black/5 mb-2">
                <textarea
                    value={text}
                    onChange={(e) => onUpdate(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    placeholder="Write markup configurations here..."
                    autoFocus
                    className="w-full h-full text-xs font-medium bg-transparent focus:outline-none resize-none text-slate-800 font-mono"
                />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden no-drag bg-white/20 p-2.5 rounded-xl border border-black/5 mb-2">
            <div
                onClick={() => setIsEditing(true)}
                className="w-full h-full text-xs overflow-y-auto cursor-text text-slate-900 prose prose-sm select-text"
                dangerouslySetInnerHTML={{ __html: compiledHtml }}
            />
        </div>
    );
}
