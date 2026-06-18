import { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faTag } from '@fortawesome/free-solid-svg-icons';

const ExpenseList = memo(function ExpenseList({ expenses, onDeleteExpense }) {
    if (expenses.length === 0) {
        return <p className="text-center text-xs opacity-40 py-6 italic select-none">No expenses logged.</p>;
    }

    const catColors = {
        Food: "bg-amber-100 text-amber-700 border-amber-200/50",
        Travel: "bg-sky-100 text-sky-700 border-sky-200/50",
        Work: "bg-indigo-100 text-indigo-700 border-indigo-200/50",
        Personal: "bg-purple-100 text-purple-700 border-purple-200/50",
        Other: "bg-slate-100 text-slate-700 border-slate-200/50"
    };

    const totalSum = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden no-drag">
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-none">
                {expenses.map(exp => (
                    <div
                        key={exp.id}
                        className="group flex items-center justify-between bg-white/20 hover:bg-white/40 p-2 rounded-lg transition-colors text-xs border border-transparent"
                    >
                        <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                                <span className={`px-1 py-0.2 rounded text-[7px] font-extrabold uppercase border ${catColors[exp.category] || catColors.Other}`}>
                                    {exp.category}
                                </span>
                                <span className="font-semibold text-slate-800 truncate select-text text-left">
                                    {exp.description}
                                </span>
                            </div>
                            <span className="text-[8px] text-slate-400 mt-0.5 select-none font-medium text-left">
                                Date: {exp.date}
                            </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="font-mono font-bold text-slate-850 select-all pr-1">
                                ${exp.amount.toFixed(2)}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteExpense(exp.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer text-[10px]"
                                title="Delete Expense"
                            >
                                <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total Summary Footer */}
            <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between select-none flex-shrink-0 bg-slate-50/50 p-1.5 rounded-lg border border-black/5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <FontAwesomeIcon icon={faTag} className="text-[8px]" /> Total Logged
                </span>
                <span className="font-mono text-xs font-extrabold text-slate-800 px-2 py-0.5">
                    ${totalSum.toFixed(2)}
                </span>
            </div>
        </div>
    );
}, (prevProps, nextProps) => JSON.stringify(prevProps.expenses) === JSON.stringify(nextProps.expenses));

export default ExpenseList;
