import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

const ICON_OPTIONS = [
  '\u{1F4A7}', '\u{1F6B6}', '\u{1F4D3}', '\u{1F4D6}', '\u{1F319}', '\u{1F48A}',
  '\u{1F373}', '\u{1F9F9}', '\u2728', '\u{1F324}', '\u{1F3CB}', '\u{1F3A8}',
  '\u{1F3B5}', '\u{1F4DD}', '\u{1F331}', '\u{1F9D8}', '\u2615', '\u{1F4F5}',
  '\u{1F6CC}', '\u{1F49A}', '\u{1F3AF}', '\u{1F9E9}', '\u{1F4DA}', '\u{1F30A}'
];

export default function HabitManager({ onBack }) {
  const { habits, categories, addHabit, updateHabit, deleteHabit } = useStore();
  const showToast = useToast();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [buildingTree, setBuildingTree] = useState('health');
  const [habitType, setHabitType] = useState('daily');

  function resetForm() {
    setName('');
    setIcon(ICON_OPTIONS[0]);
    setBuildingTree('health');
    setHabitType('daily');
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(habit) {
    setEditing(habit.id);
    setName(habit.name);
    setIcon(habit.icon);
    setBuildingTree(habit.buildingTree);
    setHabitType(habit.type || 'daily');
    setShowAdd(false);
  }

  function startAdd() {
    resetForm();
    setShowAdd(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast('Give your habit a name.');
      return;
    }

    if (editing) {
      await updateHabit(editing, { name: name.trim(), icon, buildingTree, type: habitType });
      showToast('Habit updated');
    } else {
      await addHabit(name.trim(), icon, buildingTree, habitType);
      showToast('Habit added!');
    }
    resetForm();
  }

  async function handleDelete(id, habitName) {
    if (confirm(`Remove "${habitName}"? Its streak history will also be deleted.`)) {
      await deleteHabit(id);
      showToast('Habit removed');
      if (editing === id) resetForm();
    }
  }

  const showForm = showAdd || editing !== null;

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Manage Habits</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {'\u2190'} Back
        </button>
      </div>

      {/* Existing habits list */}
      <div className="habit-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-item habit-manage-row">
            <div className="habit-icon">{habit.icon}</div>
            <div className="habit-details">
              <div className="habit-name">{habit.name}</div>
              <div className="habit-streak" style={{ opacity: 0.6 }}>
                {habit.type === 'repeatable' ? '+ Repeatable' : '\u2713 Daily'} \u00B7 {categories.find(c => c.id === habit.buildingTree)?.name || habit.buildingTree}
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
              onClick={() => startEdit(habit)}
            >
              Edit
            </button>
            <button
              className="btn-secondary btn-danger"
              style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
              onClick={() => handleDelete(habit.id, habit.name)}
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="form-card" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Habit Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Meditate"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="icon-picker">
              {ICON_OPTIONS.map(ic => (
                <button
                  key={ic}
                  className={`icon-option ${icon === ic ? 'selected' : ''}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="habit-type-picker">
              <button
                className={`habit-type-option ${habitType === 'daily' ? 'selected' : ''}`}
                onClick={() => setHabitType('daily')}
              >
                <span>{'\u2713'}</span> Daily
                <span className="habit-type-desc">Once per day</span>
              </button>
              <button
                className={`habit-type-option ${habitType === 'repeatable' ? 'selected' : ''}`}
                onClick={() => setHabitType('repeatable')}
              >
                <span>+</span> Repeatable
                <span className="habit-type-desc">Multiple per day</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Building Tree</label>
            <select
              className="form-select"
              value={buildingTree}
              onChange={(e) => setBuildingTree(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
              {editing ? 'Save Changes' : '\u2726 Add Habit'}
            </button>
            <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          className="btn-primary"
          onClick={startAdd}
          style={{ marginTop: 12 }}
        >
          + Add New Habit
        </button>
      )}
    </div>
  );
}
