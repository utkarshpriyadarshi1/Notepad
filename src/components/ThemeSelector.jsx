import React from 'react';

export default function ThemeSelector({ onChangeTheme }) {
    const colors = ['yellow', 'pink', 'blue', 'green'];
    const bgClasses = { yellow: 'bg-amber-400', pink: 'bg-rose-400', blue: 'bg-sky-400', green: 'bg-emerald-400' };

    return (
        <div className="no-drag flex gap-1.5 mb-3 justify-center">
            {colors.map(color => (
                <button
                    key={color}
                    onClick={() => onChangeTheme(color)}
                    className={`w-4 h-4 rounded-full ${bgClasses[color]} border border-black/10 focus:ring-1 focus:ring-black`}
                ></button>
            ))}
        </div>
    );
}
