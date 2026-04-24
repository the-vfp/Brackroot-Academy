import { useState } from 'react';
import { useStore, DIFFICULTY_LEVELS, stardustForDifficulty } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';
import { useLongPress } from '../hooks/useLongPress.js';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

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
          <span className="difficulty-value">{stardustForDifficulty(d)} {'\u2728'}</span>
        </button>
      ))}
    </div>
  );
}

function TaskRow({ task, completed, overdue, onTap, onLongPress, onDelete, confirmingDelete }) {
  const handlers = useLongPress(onLongPress, onTap);
  const dueLabel = formatDueDate(task.dueDate);
  const recLabel = formatRecurrence(task.recurrence);
  const schedule = recLabel ? `\u{1F501} ${recLabel}` : (dueLabel ? `\u{1F4C5} ${dueLabel}` : null);
  return (
    <div
      className={`task-item ${completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}
      role="button"
      tabIndex={0}
      {...handlers}
    >
      {completed
        ? <span className="task-check done">{'\u2713'}</span>
        : <span className="task-check" />
      }
      <div className="task-details">
        <div className="task-text">{task.text}</div>
        <div className="task-meta">
          {completed
            ? `+${stardustForDifficulty(task.difficulty)} \u2728 earned`
            : `${stardustForDifficulty(task.difficulty)} \u2728`
          }
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
  const { tasks, addTask, completeTask, uncheckTask, deleteTask, updateTask } = useStore();
  const showToast = useToast();
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [schedule, setSchedule] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('medium');
  const [editSchedule, setEditSchedule] = useState(null);

  const today = localDateString();
  const todayDow = new Date(today + 'T12:00:00').getDay();

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
        todayTasks.push(t);
      } else {
        upcomingTasks.push({ ...t, _sortDate: nextRecurrenceDate(t.recurrence, todayDow, today) });
      }
      continue;
    }
    if (!t.dueDate) {
      todayTasks.push(t);
    } else if (t.dueDate < today) {
      overdueTasks.push(t);
    } else if (t.dueDate === today) {
      todayTasks.push(t);
    } else {
      upcomingTasks.push({ ...t, _sortDate: t.dueDate });
    }
  }
  upcomingTasks.sort((a, b) => (a._sortDate || '').localeCompare(b._sortDate || ''));
  const completedTasks = tasks.filter(t => t.completed);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    // Reject empty weekly pattern
    const sched = (schedule?.recurrence && !schedule.recurrence.days?.length) ? null : schedule;
    await addTask(text.trim(), difficulty, sched);
    setText('');
    setSchedule(null);
    showToast('Task added!');
  }

  async function handleToggle(task) {
    if (editing === task.id) return;
    if (task.completed) {
      const result = await uncheckTask(task.id);
      if (result) showToast(`-${result.stardust} \u2728`);
    } else {
      const result = await completeTask(task.id);
      if (result) showToast(`+${result.stardust} \u2728`);
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
  }

  async function saveEdit(e, task) {
    if (e) e.stopPropagation();
    const trimmed = editText.trim();
    if (!trimmed) {
      showToast('Task can\u2019t be empty.');
      return;
    }
    // Reject empty weekly pattern (weekly with no days = no recurrence)
    const sched = (editSchedule?.recurrence && !editSchedule.recurrence.days?.length) ? null : editSchedule;
    await updateTask(task.id, {
      text: trimmed,
      difficulty: editDifficulty,
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
                  autoFocus
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
        <SchedulePicker value={schedule} onChange={setSchedule} />
        <button type="submit" className="btn-primary task-add-btn" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {renderBucket('Overdue', overdueTasks, { overdue: true })}
      {renderBucket('Today', todayTasks)}
      {renderBucket('Upcoming', upcomingTasks)}

      {overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="history-empty">
          No tasks yet. Add one above!
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
