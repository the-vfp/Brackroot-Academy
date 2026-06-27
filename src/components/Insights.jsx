import { useState, useMemo } from 'react';
import { useStore } from '../store.jsx';
import { localDateString, addDaysToDate } from '../db.js';
import { getCategoryIcon } from '../data/categories.js';
import { CHARACTER_DEFS } from '../data/characters.js';
import InsightsCalendar, { PixelCalendarIcon } from './InsightsCalendar.jsx';

// Meal type → left-hand emoji (the most meaningful glyph the data carries; meals
// store no custom emoji). Mirrors MealEntry's MEAL_TYPES.
const MEAL_TYPE_EMOJI = {
  breakfast: '\u{1F373}', lunch: '\u{1F96A}', dinner: '\u{1F35D}', snack: '\u{1F36A}',
};
const MEAL_TYPE_LABEL = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};
// Source shown as a glyph so it reads instantly (per design handoff).
const MEAL_SOURCE_GLYPH = {
  home_cooked: '\u{1F3E0}', dining_out: '\u{1F374}', delivery: '\u{1F6F5}', prepped: '\u{1F95F}',
};

function fmtPlaque(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' });
  const mo = d.toLocaleDateString('en-US', { month: 'short' });
  return `${wd} · ${mo} ${d.getDate()}`;
}

function daysAgo(day, today) {
  const a = new Date(day + 'T12:00:00');
  const b = new Date(today + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

// A ruled section header — two rules flanking a micro label.
function SectionRule({ label }) {
  return (
    <div className="almanac-section">
      <span className="almanac-rule" />
      <span className="almanac-section-label">{label}</span>
      <span className="almanac-rule" />
    </div>
  );
}

// A ledger line: emoji · name · dotted leader · right-hand value.
function LedgerRow({ emoji, name, value, valueStrong, clamp }) {
  return (
    <div className="almanac-row">
      <span className="almanac-row-emoji">{emoji}</span>
      <span className={`almanac-row-name${clamp ? ' clamp' : ''}`}>{name}</span>
      <span className="almanac-leader" />
      <span className={valueStrong ? 'almanac-row-amt' : 'almanac-row-val'}>{value}</span>
    </div>
  );
}

export default function Insights() {
  const {
    appState, habits, habitLogs, tasks, meals, expenses,
    timeLogs, timeCategories, interactions, categories, tags,
    getHabitDay,
  } = useStore();

  const today = getHabitDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isToday = selectedDay >= today;

  // Lookups built once from the live tables (include custom + archived rows so
  // history stays truthful).
  const habitById = useMemo(() => new Map(habits.map(h => [h.id, h])), [habits]);
  const timeCatById = useMemo(() => new Map(timeCategories.map(c => [c.id, c])), [timeCategories]);
  const catById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const tagById = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);

  // Days that have any logged entry, for the calendar's gold dots.
  const loggedDays = useMemo(() => {
    const s = new Set();
    habitLogs.forEach(l => l.date && s.add(l.date));
    meals.forEach(m => m.date && s.add(m.date));
    expenses.forEach(e => e.date && s.add(e.date));
    timeLogs.forEach(t => t.date && s.add(t.date));
    interactions.forEach(i => i.date && s.add(i.date));
    tasks.forEach(t => { if (t.completed && t.completedAt) s.add(localDateString(new Date(t.completedAt))); });
    return s;
  }, [habitLogs, meals, expenses, timeLogs, interactions, tasks]);

  // Everything that happened on the selected day (pure derivation, no writes).
  const day = useMemo(() => {
    const d = selectedDay;

    // Habits — group logs by habit; repeatable w/ count>1 → ×N, else "kept".
    const logsByHabit = new Map();
    habitLogs.filter(l => l.date === d).forEach(l => {
      logsByHabit.set(l.habitId, (logsByHabit.get(l.habitId) || 0) + 1);
    });
    const habitRows = [...logsByHabit.entries()]
      .map(([id, count]) => {
        const h = habitById.get(id);
        if (!h) return null;
        const tally = h.type === 'repeatable' && count > 1 ? `×${count}` : 'kept';
        return { id, emoji: h.icon, name: h.name, tally, sortOrder: h.sortOrder ?? 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Tasks completed that day (date derived from completedAt).
    const taskRows = tasks
      .filter(t => t.completed && t.completedAt && localDateString(new Date(t.completedAt)) === d)
      .sort((a, b) => a.completedAt - b.completedAt)
      .map(t => ({ id: t.id, text: t.text, tag: t.tagId ? tagById.get(t.tagId) : null }));

    const mealRows = meals
      .filter(m => m.date === d)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(m => ({
        id: m.id,
        emoji: MEAL_TYPE_EMOJI[m.mealType] || '\u{1F37D}️',
        desc: m.description,
        type: MEAL_TYPE_LABEL[m.mealType] || m.mealType,
        srcGlyph: MEAL_SOURCE_GLYPH[m.source] || '',
      }));

    const spendRows = expenses
      .filter(e => e.date === d)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(e => {
        const cat = catById.get(e.category);
        return {
          id: e.id,
          emoji: cat?.icon || getCategoryIcon(e.category),
          note: e.note || cat?.name || 'Spending',
          amt: e.amount,
        };
      });
    const spendTotal = spendRows.reduce((s, r) => s + (r.amt || 0), 0);

    // Time — sum hours per category.
    const hoursByCat = new Map();
    timeLogs.filter(t => t.date === d).forEach(t => {
      hoursByCat.set(t.categoryId, (hoursByCat.get(t.categoryId) || 0) + (t.hours || 0));
    });
    const timeRows = [...hoursByCat.entries()]
      .map(([id, hours]) => {
        const c = timeCatById.get(id);
        if (!c) return null;
        return { id, emoji: c.icon, name: c.name, hours, sortOrder: c.sortOrder ?? 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const totalHours = timeRows.reduce((s, r) => s + r.hours, 0);

    // Visits — unique characters interacted with that day.
    const visitIds = [...new Set(interactions.filter(i => i.date === d).map(i => i.characterId))];
    const visitRows = visitIds
      .map(id => {
        const def = CHARACTER_DEFS[id];
        if (!def) return null;
        return { id, emoji: def.portrait, name: def.name.split(' ')[0] };
      })
      .filter(Boolean);

    return { habitRows, taskRows, mealRows, spendRows, spendTotal, timeRows, totalHours, visitRows };
  }, [selectedDay, habitLogs, tasks, meals, expenses, timeLogs, interactions, habitById, timeCatById, catById, tagById]);

  const sectionCount =
    (day.habitRows.length ? 1 : 0) + (day.taskRows.length ? 1 : 0) +
    (day.mealRows.length ? 1 : 0) + (day.spendRows.length ? 1 : 0) +
    (day.timeRows.length ? 1 : 0) + (day.visitRows.length ? 1 : 0);
  const isEmpty = sectionCount === 0;
  const isSparse = sectionCount > 0 && sectionCount <= 2;

  // Factual tally line — omit empty segments; never a score.
  const tallyParts = [];
  const n = (count, one, many) => `${count} ${count === 1 ? one : many}`;
  if (day.habitRows.length) tallyParts.push(n(day.habitRows.length, 'habit', 'habits'));
  if (day.taskRows.length) tallyParts.push(n(day.taskRows.length, 'task', 'tasks'));
  if (day.mealRows.length) tallyParts.push(n(day.mealRows.length, 'meal', 'meals'));
  if (day.spendTotal > 0) tallyParts.push(`$${day.spendTotal.toFixed(2)} spent`);
  if (day.totalHours > 0) tallyParts.push(`${day.totalHours}h logged`);
  if (day.visitRows.length) tallyParts.push(n(day.visitRows.length, 'visit', 'visits'));
  let tally = tallyParts.join(' · ');
  if (isSparse) tally += ' — a slow day';

  function step(delta) {
    const next = addDaysToDate(selectedDay, delta);
    if (next > today) return;
    setSelectedDay(next);
  }
  function pick(date) {
    setSelectedDay(date > today ? today : date);
    setCalendarOpen(false);
  }

  const ago = daysAgo(selectedDay, today);

  return (
    <div className="tab-view active almanac-wrap">
      <div className="almanac-panel" key={selectedDay}>
        {/* Masthead */}
        <div className="almanac-masthead">
          <div className="almanac-eyebrow">The day's record</div>
          <div className="almanac-daterow">
            <button className="almanac-key" onClick={() => step(-1)} aria-label="Previous day">{'‹'}</button>
            <button className="almanac-plaque" onClick={() => setCalendarOpen(true)} aria-label="Open calendar">
              <PixelCalendarIcon size={15} />
              <span className="almanac-plaque-date">{fmtPlaque(selectedDay)}</span>
            </button>
            <button
              className="almanac-key"
              onClick={() => step(1)}
              disabled={isToday}
              aria-label="Next day"
            >{'›'}</button>
          </div>
          <div className="almanac-hint">
            {isToday
              ? <><span className="almanac-today">Today</span> {'·'} arrows step a day {'·'} tap to open the calendar</>
              : <>{ago === 1 ? '1 day ago' : `${ago} days ago`} {'·'} arrows step a day {'·'} tap to open the calendar</>}
          </div>
        </div>

        {isEmpty ? (
          <div className="almanac-empty">
            <div className="almanac-empty-glyph">{'\u{1F342}'}</div>
            <div className="almanac-empty-prose">Nothing was written down this day. A quiet one {'—'} and that's alright.</div>
            <div className="almanac-empty-micro">The page rests empty</div>
            {!isToday && (
              <button className="almanac-return-key" onClick={() => setSelectedDay(today)}>
                {'↩'} Return to today
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="almanac-tally">{tally}</div>

            {day.habitRows.length > 0 && (
              <>
                <SectionRule label="Habits" />
                {day.habitRows.map(h => (
                  <LedgerRow key={h.id} emoji={h.emoji} name={h.name} value={h.tally} />
                ))}
              </>
            )}

            {day.taskRows.length > 0 && (
              <>
                <SectionRule label="Tasks" />
                {day.taskRows.map(t => (
                  <div className="almanac-row" key={t.id}>
                    <span className="almanac-task-check">{'✓'}</span>
                    <span className="almanac-row-name clamp">{t.text}</span>
                    {t.tag && <span className="almanac-tag-chip">{t.tag.name}</span>}
                  </div>
                ))}
              </>
            )}

            {day.mealRows.length > 0 && (
              <>
                <SectionRule label="Meals" />
                {day.mealRows.map(m => (
                  <LedgerRow key={m.id} emoji={m.emoji} name={m.desc} clamp value={`${m.type} · ${m.srcGlyph}`} />
                ))}
              </>
            )}

            {day.spendRows.length > 0 && (
              <>
                <SectionRule label="Spending" />
                {day.spendRows.map(s => (
                  <LedgerRow key={s.id} emoji={s.emoji} name={s.note} value={`$${s.amt.toFixed(2)}`} valueStrong />
                ))}
                <div className="almanac-total">
                  <span className="almanac-total-label">Total</span>
                  <span className="almanac-total-leader" />
                  <span className="almanac-total-val">${day.spendTotal.toFixed(2)}</span>
                </div>
              </>
            )}

            {day.timeRows.length > 0 && (
              <>
                <SectionRule label="Time" />
                {day.timeRows.map(t => (
                  <LedgerRow key={t.id} emoji={t.emoji} name={t.name} value={`${t.hours}h`} valueStrong />
                ))}
              </>
            )}

            {day.visitRows.length > 0 && (
              <>
                <SectionRule label="Visits" />
                <div className="almanac-visits">
                  {day.visitRows.map(v => (
                    <span className="almanac-visit" key={v.id}>
                      <span className="almanac-visit-emoji">{v.emoji}</span>{v.name}
                    </span>
                  ))}
                </div>
              </>
            )}

            {isSparse && <div className="almanac-closer">Nothing else was logged.</div>}
          </>
        )}
      </div>

      {calendarOpen && (
        <InsightsCalendar
          selectedDay={selectedDay}
          today={today}
          loggedDays={loggedDays}
          onPick={pick}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
