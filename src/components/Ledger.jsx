import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import GroupedLedger from './GroupedLedger.jsx';

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

  function renderRow(e) {
    return (
      <div className="history-item">
        <div className="history-icon">{getCatIcon(e.category)}</div>
        <div className="history-details">
          <div className="history-cat">{getCatName(e.category)}</div>
          <div className="history-note">{e.note}</div>
        </div>
        <div className="history-meta">
          <div className="history-amount">${e.amount.toFixed(2)}</div>
          <div className="history-stardust">+{e.stardustEarned ?? 0} {'\u2728'}</div>
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
    );
  }

  return (
    <GroupedLedger
      items={expenses}
      getDate={e => e.date}
      getKey={e => e.id ?? e.timestamp}
      renderItem={renderRow}
      emptyMessage="The Ledger awaits its first entry..."
      title="The Ledger"
    />
  );
}
