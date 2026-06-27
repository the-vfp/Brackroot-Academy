import { useState } from 'react';
import { localDateString } from '../db.js';

// Pixel calendar glyph — 16×16 crispEdges sprite, body in currentColor with one
// gold day-cell. Authored from the design handoff masthead. Reused by the date
// plaque (Insights.jsx) and the calendar header here.
export function PixelCalendarIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ display: 'block', color: 'var(--bk-ink-strong)' }}>
      <g fill="currentColor">
        <rect x="5" y="1" width="1" height="3" />
        <rect x="10" y="1" width="1" height="3" />
        <rect x="3" y="3" width="10" height="1" />
        <rect x="3" y="13" width="10" height="1" />
        <rect x="3" y="3" width="1" height="11" />
        <rect x="12" y="3" width="1" height="11" />
        <rect x="3" y="6" width="10" height="1" />
        <rect x="9" y="8" width="2" height="2" />
        <rect x="5" y="11" width="2" height="2" />
        <rect x="9" y="11" width="2" height="2" />
      </g>
      <rect x="5" y="8" width="2" height="2" fill="#E9B949" />
    </svg>
  );
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Build the cells for a month grid: leading blanks, the month's days, then
// trailing next-month days (faded) to complete the final week.
function buildCells(year, monthIdx) {
  const first = new Date(year, monthIdx, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push({ kind: 'blank', key: `b${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ kind: 'day', day: d, date: localDateString(new Date(year, monthIdx, d)) });
  }
  // Pad to a whole number of weeks with the next month's leading days.
  let adj = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'adjacent', day: adj, key: `a${adj}` });
    adj++;
  }
  return cells;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Month calendar modal — the date picker / far-jump. `selectedDay` and `today`
// are YYYY-MM-DD; `loggedDays` is a Set of YYYY-MM-DD with any logged entry.
export default function InsightsCalendar({ selectedDay, today, loggedDays, onPick, onClose }) {
  // The month currently shown in the picker; starts on the selected day's month.
  const [view, setView] = useState(() => {
    const d = new Date(selectedDay + 'T12:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const cells = buildCells(view.year, view.month);

  function stepMonth(delta) {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="ins-cal-scrim" onClick={onClose}>
      <div className="ins-cal-shell" onClick={e => e.stopPropagation()}>
        <div className="ins-cal-titlebar">
          <span className="ins-cal-title">Turn to a day</span>
          <button className="ins-cal-close" onClick={onClose} aria-label="Close calendar">{'✕'}</button>
        </div>

        <div className="bk-cal">
          <div className="bk-cal-monthnav">
            <button className="bk-cal-monthbtn" onClick={() => stepMonth(-1)} aria-label="Previous month">{'‹'}</button>
            <span className="bk-cal-monthlabel">{MONTH_NAMES[view.month]} {view.year}</span>
            <button className="bk-cal-monthbtn" onClick={() => stepMonth(1)} aria-label="Next month">{'›'}</button>
          </div>

          <div className="bk-cal-wdays">
            {WEEKDAYS.map(w => <span key={w} className="bk-cal-wday">{w}</span>)}
          </div>

          <div className="bk-cal-grid">
            {cells.map((c) => {
              if (c.kind === 'blank') return <div key={c.key} />;
              if (c.kind === 'adjacent') return <div key={c.key} className="bk-cal-cell adjacent">{c.day}</div>;
              const isFuture = c.date > today;
              const isSelected = c.date === selectedDay;
              const isLogged = loggedDays.has(c.date);
              const cls = `bk-cal-cell${isSelected ? ' selected' : ''}${isFuture ? ' future' : ''}`;
              return (
                <div
                  key={c.date}
                  className={cls}
                  role={isFuture ? undefined : 'button'}
                  tabIndex={isFuture ? undefined : 0}
                  onClick={isFuture ? undefined : () => onPick(c.date)}
                >
                  {c.day}
                  {isLogged && !isSelected && <span className="bk-cal-dot" />}
                </div>
              );
            })}
          </div>

          <div className="bk-cal-footer">
            <span className="bk-cal-legend"><span className="bk-cal-dot static" /> Logged that day</span>
            <button className="bk-cal-today-btn" onClick={() => onPick(today)}>{'↩'} Today</button>
          </div>
        </div>
      </div>
    </div>
  );
}
