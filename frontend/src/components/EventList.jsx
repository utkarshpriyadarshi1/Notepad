import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faClock } from '@fortawesome/free-solid-svg-icons';

const EventList = memo(function EventList({ events, onDeleteEvent }) {
    if (events.length === 0) {
        return <p className="text-center text-xs opacity-40 py-6 italic select-none">No events logged.</p>;
    }

    const formatTime = (timeStr) => {
        try {
            if (!timeStr) return "";
            // Replace space with T to parse correctly, appending Z if UTC
            let normalized = timeStr.replace(' ', 'T');
            if (!normalized.includes('Z') && !normalized.includes('+') && !normalized.includes('-')) {
                normalized += 'Z';
            }
            const date = new Date(normalized); 
            if (isNaN(date.getTime())) {
                const directDate = new Date(timeStr);
                return isNaN(directDate.getTime()) ? timeStr : directDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeStr || "";
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 no-drag scrollbar-none">
            {events.map(ev => (
                <div
                    key={ev.id}
                    className="group flex items-center justify-between bg-white/20 hover:bg-white/40 p-2 rounded-lg transition-colors text-xs border border-transparent"
                >
                    <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-semibold text-slate-800 break-all select-text text-left">
                            {ev.text}
                        </span>
                        <span className="text-[8px] text-slate-400 mt-0.5 font-bold flex items-center gap-1 select-none text-left">
                            <FontAwesomeIcon icon={faClock} className="text-[7px]" />
                            {formatTime(ev.time)}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(ev.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-455 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer text-[10px] flex-shrink-0"
                        title="Delete Event"
                    >
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                </div>
            ))}
        </div>
    );
}, (prevProps, nextProps) => JSON.stringify(prevProps.events) === JSON.stringify(nextProps.events));

export default EventList;
