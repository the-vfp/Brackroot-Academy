import { useState, useEffect, useRef } from 'react';
import { localDateString } from '../db.js';

const BATCH_SIZE = 50;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatGroupDate(dateStr) {
  const today = localDateString();
  if (dateStr === today) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateStr === localDateString(y)) return 'Yesterday';

  const d = new Date(dateStr + 'T12:00:00');
  const thisYear = new Date().getFullYear();
  const yearPart = d.getFullYear() !== thisYear ? `, ${d.getFullYear()}` : '';
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${yearPart}`;
}

// Infinite-scroll, date-grouped list. `items` must already be sorted
// newest-first; we group adjacent items with the same date under a single
// header. The sentinel at the bottom uses an IntersectionObserver to expand
// `visibleCount` by BATCH_SIZE whenever it scrolls into view.
export default function GroupedLedger({
  items,
  getDate,
  getKey,
  renderItem,
  emptyMessage,
  title
}) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef(null);

  // Reset count if the underlying list shrinks (e.g. a delete) to avoid
  // leaving visibleCount past the end of the array.
  useEffect(() => {
    if (visibleCount > items.length && items.length > 0) {
      setVisibleCount(Math.max(BATCH_SIZE, items.length));
    }
  }, [items.length, visibleCount]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (visibleCount >= items.length) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => Math.min(c + BATCH_SIZE, items.length));
        }
      },
      { rootMargin: '160px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, items.length]);

  if (items.length === 0) {
    return (
      <>
        {title && <div className="section-title">{title}</div>}
        <div className="history-empty">{emptyMessage}</div>
      </>
    );
  }

  const visible = items.slice(0, visibleCount);
  const groups = [];
  let current = null;
  for (const item of visible) {
    const date = getDate(item);
    if (!current || current.date !== date) {
      current = { date, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return (
    <>
      {title && <div className="section-title">{title}</div>}
      {groups.map(group => (
        <div key={group.date} className="ledger-group">
          <div className="ledger-group-date">{formatGroupDate(group.date)}</div>
          {group.items.map(item => (
            <div key={getKey(item)}>{renderItem(item)}</div>
          ))}
        </div>
      ))}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="ledger-sentinel">
          Loading more\u2026
        </div>
      )}
    </>
  );
}
