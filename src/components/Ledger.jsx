import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function Ledger() {
  const { expenses, categories, deleteExpense } = useStore();
  const showToast = useToast();
  const [confirmId, setConfirmId] = useState(null);

  function getCatName(id) {
    return categories.find(c => c.id === id)?.name ?? id;
  }

  function getCatIcon(id) {
    return categories.find(c => c.id === id)?.icon ?? '\u{1F4E6}';
  }

  return (
    <>
      <div className="section-title">The Ledger</div>

      {expenses.length === 0 ? (
        <div className="history-empty">The Ledger awaits its first entry...</div>
      ) : (
        expenses.slice(0, 50).map(e => (
          <div key={e.id ?? e.timestamp} className="history-item">
            <div className="history-icon">{getCatIcon(e.category)}</div>
            <div className="history-details">
              <div className="history-cat">{getCatName(e.category)}</div>
              <div className="history-note">{e.note}</div>
            </div>
            <div className="history-meta">
              <div className="history-amount">${e.amount.toFixed(2)}</div>
              <div className="history-stardust">+{e.stardustEarned ?? 0} {'\u2728'}</div>
              <div className="history-date">{formatDate(e.date)}</div>
            </div>
            {confirmId === e.id ? (
              <div className="delete-confirm">
                <button className="delete-confirm-btn" onClick={async () => {
                  await deleteExpense(e.id);
                  setConfirmId(null);
                  showToast(`-${e.stardustEarned ?? 0} \u2728 entry removed`);
                }}>Delete</button>
                <button className="delete-cancel-btn" onClick={() => setConfirmId(null)}>Cancel</button>
              </div>
            ) : (
              <button className="delete-btn" onClick={() => setConfirmId(e.id)}>{'\u00D7'}</button>
            )}
          </div>
        ))
      )}
    </>
  );
}
