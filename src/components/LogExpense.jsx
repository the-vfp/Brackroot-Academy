import { useState } from 'react';
import { useStore } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';

export default function LogExpense() {
  const { categories, logExpense } = useStore();
  const showToast = useToast();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(localDateString());

  const selectedCatId = category || (categories.length > 0 ? categories[0].id : '');

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Enter an amount to record.');
      return;
    }

    const cat = categories.find(c => c.id === selectedCatId);
    const finalNote = note.trim() || cat?.name || selectedCatId;
    const result = await logExpense(parsedAmount, selectedCatId, finalNote, date);

    setAmount('');
    setNote('');
    setDate(localDateString());

    let msg = `+${result.stardust} \u2728 recorded in the Ledger`;
    if (result.fullDayBonus) msg += ' \u2726 Full Day at Brackroot!';
    showToast(msg);
  }

  return (
    <>
      <div className="section-title">Log an Expense</div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount ($CAD)</label>
          <input
            type="number"
            className="form-input"
            placeholder="0.00"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={selectedCatId}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Note</label>
          <textarea
            className="form-textarea"
            placeholder="Uber Eats — Dairy Queen blizzard..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">
          {'\u2726'} Record in the Ledger
        </button>
      </form>
    </>
  );
}
