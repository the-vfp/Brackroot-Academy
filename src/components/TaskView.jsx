import { useState } from 'react';
import { useStore, DIFFICULTY_LEVELS, stardustForDifficulty, stardustForTask } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';
import { useLongPress } from '../hooks/useLongPress.js';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 };

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Returns the date (YYYY-MM-DD) of the next occurrence of a weekly recurrence
// strictly after today's day-of-week. Used to slot recurring tasks into the
// Upcoming bucket on non-applicable days (so a Mon/Wed/Fri task created on a
// Thursday still surfaces — at next-Friday's date).
function nextRecurrenceDate(rec, todayDow, todayDateStr) {
  if (!rec?.days?.length) return null;
  const sortedDays = [...rec.days].sort((a, b) => a - b);
  let offset = null;
  for (const d of sortedDays) {
    if (d > todayDow) { offset = d - todayDow; break; }
  }
  if (offset === null) offset = (7 - todayDow) + sortedDays[0];
  const base = new Date(todayDateStr + 'T12:00:00');
  base.setDate(base.getDate() + offset);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = localDateString();
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatRecurrence(rec) {
  if (!rec || rec.type !== 'weekly' || !rec.days?.length) return null;
  if (rec.days.length === 7) return 'Daily';
  if (rec.days.length === 5 && [1,2,3,4,5].every(d => rec.days.includes(d))) return 'Weekdays';
  if (rec.days.length === 2 && [0,6].every(d => rec.days.includes(d))) return 'Weekends';
  return rec.days.sort((a, b) => a - b).map(d => DOW_FULL[d].slice(0, 2)).join(' ');
}

function SchedulePicker({ value, onChange }) {
  // value: { dueDate?: string, recurrence?: object } | null
  const dueDate = value?.dueDate || '';
  const recurrence = value?.recurrence || null;
  const mode = recurrence ? 'weekly' : (dueDate ? 'date' : 'anytime');

  function setMode(newMode) {
    if (newMode === 'anytime') onChange(null);
    else if (newMode === 'date') onChange({ dueDate: localDateString(), recurrence: null });
    else if (newMode === 'weekly') onChange({ dueDate: null, recurrence: { type: 'weekly', days: [] } });
  }

  function toggleDay(d) {
    const days = recurrence?.days || [];
    const next = days.includes(d) ? days.filter(x => x !== d) : [...days, d];
    onChange({ dueDate: null, recurrence: { type: 'weekly', days: next } });
  }

  return (
    <div className="schedule-picker">
      <div className="schedule-mode">
        <button type="button" className={`schedule-mode-btn ${mode === 'anytime' ? 'selected' : ''}`} onClick={() => setMode('anytime')}>
          Anytime
        </button>
        <button type="button" className={`schedule-mode-btn ${mode === 'date' ? 'selected' : ''}`} onClick={() => setMode('date')}>
          {'\u{1F4C5}'} On date
        </button>
        <button type="button" className={`schedule-mode-btn ${mode === 'weekly' ? 'selected' : ''}`} onClick={() => setMode('weekly')}>
          {'\u{1F501}'} Weekly
        </button>
      </div>

      {mode === 'date' && (
        <input
          type="date"
          className="form-input schedule-date-input"
          value={dueDate || localDateString()}
          onChange={(e) => onChange({ dueDate: e.target.value, recurrence: null })}
        />
      )}

      {mode === 'weekly' && (
        <div className="schedule-dow">
          {DOW_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              className={`schedule-dow-btn ${recurrence?.days?.includes(idx) ? 'selected' : ''}`}
              onClick={() => toggleDay(idx)}
              aria-label={DOW_FULL[idx]}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DifficultyPicker({ value, onChange, className = '' }) {
  return (
    <div className={`difficulty-picker ${className}`}>
      {DIFFICULTY_LEVELS.map(d => (
        <button
          key={d}
          type="button"
          className={`difficulty-option ${value === d ? 'selected' : ''}`}
          onClick={() => onChange(d)}
        >
          <span className="difficulty-label">{DIFFICULTY_LABELS[d]}</span>
          <span className="difficulty-value">{stardustForDifficulty(d)} {'✨'}</span>
        </button>
      ))}
    </div>
  );
}

// Single-select tag chips for the add/edit forms: "None" plus every tag.
function TagPicker({ tags, value, onChange, className = '' }) {
  if (!tags.length) return null;
  return (
    <div className={`tag-picker ${className}`}>
      <button
        type="button"
        className={`tag-option ${!value ? 'selected' : ''}`}
        onClick={() => onChange(null)}
      >
        None
      </button>
      {tags.map(tag => (
        <button
          key={tag.id}
          type="button"
          className={`tag-option ${value === tag.id ? 'selected' : ''}`}
          onClick={() => onChange(tag.id)}
        >
          {tag.icon && <span className="tag-option-icon">{tag.icon}</span>}
          {tag.name}
        </button>
      ))}
    </div>
  );
}

function TaskRow({ task, tag, completed, overdue, onTap, onLongPress, onDelete, confirmingDelete }) {
  const handlers = useLongPress(onLongPress, onTap);
  const dueLabel = formatDueDate(task.dueDate);
  const recLabel = formatRecurrence(task.recurrence);
  const schedule = recLabel ? `\u{1F501} ${recLabel}` : (dueLabel ? `\u{1F4C5} ${dueLabel}` : null);

  const earn = stardustForTask(task, tag);
  const rewards = earn > 0;
  // Reward-on tasks show their Stardust; reward-off tasks show the difficulty
  // tier as a plain energy label (it still drives sorting, just doesn't pay).
  const rewardMeta = rewards
    ? (completed ? `+${earn} ✨ earned` : `${earn} ✨`)
    : DIFFICULTY_LABELS[task.difficulty] || 'Medium';

  return (
    <div
      className={`task-item ${completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}
      role="button"
      tabIndex={0}
      {...handlers}
    >
      {completed
        ? <span className="task-check done">{'✓'}</span>
        : <span className="task-check" />
      }
      <div className="task-details">
        <div className="task-text">{task.text}</div>
        <div className="task-meta">
          <span className={rewards ? '' : 'task-meta-muted'}>{rewardMeta}</span>
          {tag && (
            <span className="task-tag-chip">
              {tag.icon && `${tag.icon} `}{tag.name}
            </span>
          )}
          {schedule && (
            <span className="task-schedule-chip">{schedule}</span>
          )}
        </div>
      </div>
      <button
        className={`task-delete-btn ${confirmingDelete ? 'confirm' : ''}`}
        onClick={onDelete}
      >
        {confirmingDelete ? 'Sure?' : '\u{1F5D1}'}
      </button>
    </div>
  );
}

export default function TaskView() {
  const { tasks, tags, addTask, completeTask, uncheckTask, deleteTask, updateTask } = useStore();
  const showToast = useToast();
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [schedule, setSchedule] = useState(null);
  const [tagId, setTagId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('medium');
  const [editSchedule, setEditSchedule] = useState(null);
  const [editTagId, setEditTagId] = useState(null);

  // Filter: 'untagged' (default — your real life), a tag id, or 'all'.
  const [filter, setFilter] = useState('untagged');
  // Sort: 'added' (newest first), 'alpha', or 'difficulty' (with a direction).
  const [sort, setSort] = useState('added');
  const [difficultyAsc, setDifficultyAsc] = useState(true); // Easy → Hard by default

  const hasTags = tags.length > 0;
  const tagById = Object.fromEntries(tags.map(t => [t.id, t]));

  const today = localDateString();
  const todayDow = new Date(today + 'T12:00:00').getDay();

  // A selected tag the user later deletes would leave the filter pointing at a
  // gone id (showing nothing); fall back to the default view in that case.
  const activeFilter = (filter !== 'untagged' && filter !== 'all' && !tagById[filter])
    ? 'untagged'
    : filter;

  // Does a task pass the current tag filter? Overdue bypasses this entirely
  // (see below) — the filter only governs Today / Upcoming / Completed.
  function passesFilter(t) {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'untagged') return !t.tagId;
    return t.tagId === activeFilter;
  }

  // Apply the chosen sort. Used for the Today bucket (the shoppable "menu").
  // Overdue and Upcoming keep their date ordering — they're time-defined.
  function sortTasks(list) {
    const arr = [...list];
    if (sort === 'alpha') {
      arr.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sort === 'difficulty') {
      arr.sort((a, b) => {
        const ra = DIFFICULTY_RANK[a.difficulty] ?? 1;
        const rb = DIFFICULTY_RANK[b.difficulty] ?? 1;
        if (ra !== rb) return difficultyAsc ? ra - rb : rb - ra;
        return a.text.localeCompare(b.text);
      });
    }
    return arr; // 'added' → leave in incoming (newest-first) order
  }

  // Bucket active tasks into Overdue / Today / Upcoming.
  // - Recurring tasks on an applicable DOW → Today
  // - Recurring tasks on a non-applicable DOW → Upcoming, with a virtual
  //   next-occurrence date for sort order (so a Mon/Wed/Fri task created on
  //   Thursday surfaces in Upcoming at Friday's date instead of vanishing)
  const overdueTasks = [];
  const todayTasks = [];
  const upcomingTasks = [];
  for (const t of tasks) {
    if (t.completed) continue;
    if (t.recurrence?.type === 'weekly') {
      if (t.recurrence.days?.includes(todayDow)) {
        if (passesFilter(t)) todayTasks.push(t);
      } else {
        if (passesFilter(t)) upcomingTasks.push({ ...t, _sortDate: nextRecurrenceDate(t.recurrence, todayDow, today) });
      }
      continue;
    }
    if (!t.dueDate) {
      if (passesFilter(t)) todayTasks.push(t);
    } else if (t.dueDate < today) {
      // Overdue is a safety surface — always shown, regardless of the filter.
      overdueTasks.push(t);
    } else if (t.dueDate === today) {
      if (passesFilter(t)) todayTasks.push(t);
    } else {
      if (passesFilter(t)) upcomingTasks.push({ ...t, _sortDate: t.dueDate });
    }
  }
  upcomingTasks.sort((a, b) => (a._sortDate || '').localeCompare(b._sortDate || ''));
  const sortedTodayTasks = sortTasks(todayTasks);
  const completedTasks = tasks.filter(t => t.completed && passesFilter(t));

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    // Reject empty weekly pattern
    const sched = (schedule?.recurrence && !schedule.recurrence.days?.length) ? null : schedule;
    await addTask(text.trim(), difficulty, sched, tagId);
    setText('');
    setSchedule(null);
    // Keep difficulty + tag sticky — dumping several ideas under one project
    // shouldn't make you re-pick the tag every time.
    showToast('Task added!');
  }

  async function handleToggle(task) {
    if (editing === task.id) return;
    if (task.completed) {
      const result = await uncheckTask(task.id);
      if (result) showToast(result.stardust > 0 ? `-${result.stardust} ✨` : 'Unchecked');
    } else {
      const result = await completeTask(task.id);
      if (result) showToast(result.stardust > 0 ? `+${result.stardust} ✨` : 'Done ✓');
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirmDelete === id) {
      await deleteTask(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  function startEdit(e, task) {
    if (e) e.stopPropagation();
    setEditing(task.id);
    setEditText(task.text);
    setEditDifficulty(task.difficulty || 'medium');
    setEditTagId(task.tagId || null);
    setEditSchedule(
      task.recurrence ? { dueDate: null, recurrence: task.recurrence }
      : task.dueDate ? { dueDate: task.dueDate, recurrence: null }
      : null
    );
    setConfirmDelete(null);
  }

  function cancelEdit(e) {
    if (e) e.stopPropagation();
    setEditing(null);
    setEditText('');
    setEditSchedule(null);
    setEditTagId(null);
  }

  async function saveEdit(e, task) {
    if (e) e.stopPropagation();
    const trimmed = editText.trim();
    if (!trimmed) {
      showToast('Task can’t be empty.');
      return;
    }
    // Reject empty weekly pattern (weekly with no days = no recurrence)
    const sched = (editSchedule?.recurrence && !editSchedule.recurrence.days?.length) ? null : editSchedule;
    await updateTask(task.id, {
      text: trimmed,
      difficulty: editDifficulty,
      tagId: editTagId || null,
      dueDate: sched?.recurrence ? null : (sched?.dueDate ?? null),
      recurrence: sched?.recurrence ?? null,
    });
    setEditing(null);
    showToast('Task updated');
  }

  function renderBucket(label, list, { overdue = false } = {}) {
    if (list.length === 0) return null;
    return (
      <>
        <div className="task-bucket-label">
          {label} ({list.length})
        </div>
        <div className="task-list">
          {list.map(task => (
            editing === task.id ? (
              <div key={task.id} className="task-item task-edit-item">
                <input
                  type="text"
                  className="task-input task-edit-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(null, task);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <DifficultyPicker
                  value={editDifficulty}
                  onChange={setEditDifficulty}
                  className="task-edit-difficulty"
                />
                {hasTags && (
                  <TagPicker tags={tags} value={editTagId} onChange={setEditTagId} />
                )}
                <SchedulePicker value={editSchedule} onChange={setEditSchedule} />
                <div className="task-edit-actions">
                  <button className="btn-primary" onClick={(e) => saveEdit(e, task)}>
                    Save
                  </button>
                  <button className="btn-secondary" onClick={cancelEdit} style={{ margin: 0 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <TaskRow
                key={task.id}
                task={task}
                tag={tagById[task.tagId]}
                completed={false}
                overdue={overdue}
                onTap={() => handleToggle(task)}
                onLongPress={() => startEdit(null, task)}
                onDelete={(e) => handleDelete(e, task.id)}
                confirmingDelete={confirmDelete === task.id}
              />
            )
          ))}
        </div>
      </>
    );
  }

  const nothingVisible =
    overdueTasks.length === 0 && sortedTodayTasks.length === 0 &&
    upcomingTasks.length === 0 && completedTasks.length === 0;

  return (
    <div className="tab-view active">
      <div className="section-title">Tasks</div>

      <form className="task-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="task-input"
          placeholder="What needs doing?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <DifficultyPicker
          value={difficulty}
          onChange={setDifficulty}
          className="task-difficulty-picker"
        />
        {hasTags && (
          <TagPicker tags={tags} value={tagId} onChange={setTagId} className="task-add-tags" />
        )}
        <SchedulePicker value={schedule} onChange={setSchedule} />
        <button type="submit" className="btn-primary task-add-btn" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {hasTags && (
        <div className="task-controls">
          <div className="task-filter-row">
            <button
              type="button"
              className={`task-filter-chip ${activeFilter === 'untagged' ? 'selected' : ''}`}
              onClick={() => setFilter('untagged')}
            >
              Untagged
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                className={`task-filter-chip ${activeFilter === tag.id ? 'selected' : ''}`}
                onClick={() => setFilter(tag.id)}
              >
                {tag.icon && `${tag.icon} `}{tag.name}
              </button>
            ))}
            <button
              type="button"
              className={`task-filter-chip ${activeFilter === 'all' ? 'selected' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
          <div className="task-sort-row">
            <span className="task-sort-label">Sort</span>
            <button
              type="button"
              className={`task-sort-chip ${sort === 'added' ? 'selected' : ''}`}
              onClick={() => setSort('added')}
            >
              Added
            </button>
            <button
              type="button"
              className={`task-sort-chip ${sort === 'alpha' ? 'selected' : ''}`}
              onClick={() => setSort('alpha')}
            >
              A{'–'}Z
            </button>
            <button
              type="button"
              className={`task-sort-chip ${sort === 'difficulty' ? 'selected' : ''}`}
              onClick={() => {
                if (sort === 'difficulty') setDifficultyAsc(v => !v);
                else setSort('difficulty');
              }}
            >
              Difficulty {sort === 'difficulty' ? (difficultyAsc ? '↑' : '↓') : ''}
            </button>
          </div>
        </div>
      )}

      {renderBucket('Overdue', overdueTasks, { overdue: true })}
      {renderBucket('Today', sortedTodayTasks)}
      {renderBucket('Upcoming', upcomingTasks)}

      {nothingVisible && (
        <div className="history-empty">
          {tasks.length === 0
            ? 'No tasks yet. Add one above!'
            : 'Nothing here under this filter.'}
        </div>
      )}

      {completedTasks.length > 0 && (
        <>
          <div className="task-completed-header">
            <span className="task-completed-label">
              Completed ({completedTasks.length})
            </span>
          </div>
          <div className="task-list">
            {completedTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                tag={tagById[task.tagId]}
                completed
                onTap={() => handleToggle(task)}
                onLongPress={() => {}}
                onDelete={(e) => handleDelete(e, task.id)}
                confirmingDelete={confirmDelete === task.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
