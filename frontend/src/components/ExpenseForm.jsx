import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default function ExpenseForm({ onAddExpense }) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Food");

    const categories = ["Food", "Travel", "Work", "Personal", "Other"];

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (numAmount > 0 && description.trim()) {
            onAddExpense(numAmount, category, description.trim());
            setAmount("");
            setDescription("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 mb-2.5 flex-shrink-0 no-drag select-none bg-black/5 p-2 rounded-lg border border-black/5">
            <div className="flex gap-1.5">
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amt ($)..."
                    className="w-[70px] text-[10px] px-2 py-1 bg-white border border-black/10 rounded focus:outline-none focus:border-slate-800 font-medium"
                    required
                />
                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-[85px] text-[10px] px-1 py-1 bg-white border border-black/10 rounded focus:outline-none focus:border-slate-800 font-medium"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (e.g. Lunch)..."
                    className="flex-1 text-[10px] px-2 py-1 bg-white border border-black/10 rounded focus:outline-none focus:border-slate-800 font-medium"
                    required
                />
                <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors flex items-center justify-center cursor-pointer"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                </button>
            </div>
        </form>
    );
}
