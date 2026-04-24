import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import GroupedLedger from './GroupedLedger.jsx';

export default function TimeLedger() {
  const { timeLogs, timeCategories, deleteTimeLog } = useStore();
  const showToast = useToast();
  const [confirmId, setConfirmId] = useState(null);

  const catById = Object.fromEntries(timeCategories.map(c => [c.id, c]));

  return (
    <GroupedLedger
      items={timeLogs}
      getDate={l => l.date}
      getKey={l => l.id ?? l.timestamp}
      emptyMessage="No hours logged yet..."
      title="Time Log"
      renderItem={l => {
        const cat = catById[l.categoryId];
        return (
          <div className="history-item">
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
      }}
    />
  );
}
