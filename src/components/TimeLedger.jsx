import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function TimeLedger() {
  const { timeLogs, timeCategories, deleteTimeLog } = useStore();
  const showToast = useToast();
  const [confirmId, setConfirmId] = useState(null);

  const catById = Object.fromEntries(timeCategories.map(c => [c.id, c]));

  if (timeLogs.length === 0) {
    return (
      <>
        <div className="section-title">Time Log</div>
        <div className="history-empty">No hours logged yet...</div>
      </>
    );
  }

  return (
    <>
      <div className="section-title">Time Log</div>
      {timeLogs.slice(0, 100).map(l => {
        const cat = catById[l.categoryId];
        return (
          <div key={l.id ?? l.timestamp} className="history-item">
            <div className="history-icon">{cat?.icon ?? '\u231B'}</div>
            <div className="history-details">
              <div className="history-cat">
                {cat?.name ?? 'Removed category'}
                {cat?.kind && (
                  <>
                    {' \u00B7 '}
                    {cat.kind === 'cap' ? 'cap' : 'floor'}
                  </>
                )}
              </div>
              {l.note && <div className="history-note">{l.note}</div>}
            </div>
            <div className="history-meta">
              <div className="history-stardust">{l.hours}h</div>
              <div className="history-date">{formatDate(l.date)}</div>
            </div>
            {confirmId === l.id ? (
              <div className="delete-confirm">
                <button className="delete-confirm-btn" onClick={async () => {
                  await deleteTimeLog(l.id);
                  setConfirmId(null);
                  showToast(`${l.hours}h removed`);
                }}>Delete</button>
                <button className="delete-cancel-btn" onClick={() => setConfirmId(null)}>Cancel</button>
              </div>
            ) : (
              <button className="delete-btn" onClick={() => setConfirmId(l.id)}>{'\u00D7'}</button>
            )}
          </div>
        );
      })}
    </>
  );
}
