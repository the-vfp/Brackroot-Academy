import { useState, useEffect } from 'react';
import { useStore } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';
import { HOUR_INCREMENT } from '../data/timeBudget.js';

// 0.5 .. 12.0, which is enough granularity for any single logging session.
// Longer activities get multiple entries \u2014 there's no harm in that.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * HOUR_INCREMENT);

function CapBar({ actual, target, name, icon }) {
  const over = actual > target;
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const overflowPct = target > 0 && over ? Math.min(100, ((actual - target) / target) * 100) : 0;
  return (
    <div className={`time-bar-row ${over ? 'reserve' : ''}`}>
      <div className="time-bar-header">
        <span className="time-bar-icon">{icon}</span>
        <span className="time-bar-name">{name}</span>
        <span className="time-bar-amount">
          {actual}h <span className="time-bar-amount-sep">/</span> {target}h
        </span>
      </div>
      <div className="time-bar-track">
        <div
          className={`time-bar-fill ${over ? 'reserve' : ''}`}
          style={{ width: `${over ? 100 : pct}%` }}
        />
        {over && (
          <div className="time-bar-overflow" style={{ width: `${overflowPct}%` }} />
        )}
      </div>
    </div>
  );
}

function FloorRow({ name, icon, target, threshold, nightly }) {
  // nightly: number[7], each value is hours logged that night.
  const hits = nightly.filter(h => h >= target).length;
  const met = hits >= threshold;
  return (
    <div className={`time-bar-row floor ${met ? 'met' : ''}`}>
      <div className="time-bar-header">
        <span className="time-bar-icon">{icon}</span>
        <span className="time-bar-name">{name}</span>
        <span className="time-bar-amount">
          {hits}/{threshold} nights
          <span className="time-bar-amount-sep"> \u00B7 </span>
          {target}h floor
        </span>
      </div>
      <div className="time-pips">
        {nightly.map((h, i) => (
          <div
            key={i}
            className={`time-pip ${h >= target ? 'hit' : (h > 0 ? 'partial' : 'empty')}`}
            title={`${h}h`}
          />
        ))}
      </div>
    </div>
  );
}

export default function TimeEntry() {
  const {
    appState,
    getActiveTimeCategories,
    getTimeTotalsInRange,
    getNightlyTotalsForWeek,
    getWeekEnd,
    logTime
  } = useStore();
  const showToast = useToast();

  const activeCats = getActiveTimeCategories();
  const weekStart = appState?.weekStart;
  const weekEnd = weekStart ? getWeekEnd(weekStart) : null;
  const weekTotals = weekStart ? getTimeTotalsInRange(weekStart, weekEnd) : {};

  const caps = activeCats.filter(c => c.kind === 'cap');
  const floors = activeCats.filter(c => c.kind === 'floor');

  const firstCatId = activeCats[0]?.id ?? '';
  const [categoryId, setCategoryId] = useState(firstCatId);
  const [hours, setHours] = useState(1);
  const [date, setDate] = useState(localDateString());
  const [note, setNote] = useState('');

  // Keep the selected category valid if the active list changes.
  useEffect(() => {
    if (activeCats.length > 0 && !activeCats.find(c => c.id === categoryId)) {
      setCategoryId(activeCats[0].id);
    }
  }, [activeCats, categoryId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!categoryId) {
      showToast('Add a time category first (Settings \u2192 Time Categories).');
      return;
    }
    const result = await logTime(categoryId, hours, date, note.trim() || null);
    if (result) {
      setNote('');
      setDate(localDateString());
      showToast(`\u231B ${result.hours}h logged`);
    }
  }

  return (
    <div className="tab-view active">
      {activeCats.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-title">No time categories yet.</div>
          <p className="placeholder-body">
            Add a category in Settings \u2192 Manage Time Categories to start
            tracking where your hours go.
          </p>
        </div>
      ) : (
        <>
          {caps.length > 0 && (
            <>
              <div className="section-title">This Week {'\u2014'} Caps</div>
              {caps.map(c => (
                <CapBar
                  key={c.id}
                  actual={Math.round((weekTotals[c.id] || 0) * 2) / 2}
                  target={c.targetHours}
                  name={c.name}
                  icon={c.icon}
                />
              ))}
            </>
          )}

          {floors.length > 0 && (
            <>
              <div className="section-title">This Week {'\u2014'} Floors</div>
              {floors.map(c => (
                <FloorRow
                  key={c.id}
                  name={c.name}
                  icon={c.icon}
                  target={c.targetHours}
                  threshold={c.floorThreshold || 5}
                  nightly={weekStart ? getNightlyTotalsForWeek(c.id, weekStart) : [0,0,0,0,0,0,0]}
                />
              ))}
            </>
          )}

          <div className="section-title">Log Hours</div>
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                {activeCats.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hours</label>
              <select
                className="form-select"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                {HOUR_OPTIONS.map(h => (
                  <option key={h} value={h}>{h}h</option>
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
              <label className="form-label">Note (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Stardew Valley"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary">
              {'\u231B'} Log Hours
            </button>
          </form>
        </>
      )}
    </div>
  );
}
