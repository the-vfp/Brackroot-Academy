import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

// Subset of the spend-category icon picker, plus a few time-themed picks.
const ICON_OPTIONS = [
  '\u{1F3AE}', '\u{1F4F1}', '\u{1F319}', '\u{1F4D6}', '\u{1F4FA}', '\u{1F3B5}',
  '\u{1F5A5}\uFE0F', '\u{1F4DD}', '\u{1F9D8}', '\u{1F3AF}', '\u{1F6B6}', '\u{1F697}',
  '\u{1F6CB}\uFE0F', '\u{1F4A4}', '\u{1F4AC}', '\u{1F468}\u200D\u{1F4BB}',
  '\u{1F3A8}', '\u{1F3B8}', '\u{1F9E9}', '\u2728', '\u231B'
];

export default function TimeCategoryManager({ onBack }) {
  const {
    timeCategories,
    addTimeCategory, updateTimeCategory,
    archiveTimeCategory, unarchiveTimeCategory, deleteTimeCategory
  } = useStore();
  const showToast = useToast();

  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [kind, setKind] = useState('cap');
  const [targetHours, setTargetHours] = useState(10);
  const [floorThreshold, setFloorThreshold] = useState(5);

  function resetForm() {
    setName('');
    setIcon(ICON_OPTIONS[0]);
    setKind('cap');
    setTargetHours(10);
    setFloorThreshold(5);
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(cat) {
    setEditing(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
    setKind(cat.kind);
    setTargetHours(cat.targetHours);
    setFloorThreshold(cat.floorThreshold || 5);
    setShowAdd(false);
  }

  function startAdd() {
    resetForm();
    setShowAdd(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast('Give your category a name.');
      return;
    }
    const tH = Number(targetHours);
    if (!Number.isFinite(tH) || tH <= 0) {
      showToast('Target hours must be greater than zero.');
      return;
    }

    if (editing) {
      await updateTimeCategory(editing, {
        name: name.trim(),
        icon,
        kind,
        targetHours: tH,
        floorThreshold: kind === 'floor' ? Number(floorThreshold) || 5 : null
      });
      showToast('Category updated');
    } else {
      await addTimeCategory({
        name: name.trim(),
        icon,
        kind,
        targetHours: tH,
        floorThreshold: kind === 'floor' ? Number(floorThreshold) || 5 : null
      });
      showToast('Category added!');
    }
    resetForm();
  }

  async function handleArchiveToggle(cat) {
    if (cat.active !== false) {
      await archiveTimeCategory(cat.id);
      showToast('Category archived');
    } else {
      await unarchiveTimeCategory(cat.id);
      showToast('Category restored');
    }
  }

  async function handleDelete(cat) {
    const confirmed = confirm(
      `Remove "${cat.name}" permanently? All logged hours under it will also be removed. Use Archive to stop it from counting without deleting history.`
    );
    if (confirmed) {
      await deleteTimeCategory(cat.id);
      showToast('Category removed');
      if (editing === cat.id) resetForm();
    }
  }

  const showForm = showAdd || editing !== null;

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Manage Time Categories</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {'\u2190'} Back
        </button>
      </div>

      <div className="habit-list">
        {timeCategories.map(cat => {
          const inactive = cat.active === false;
          return (
            <div
              key={cat.id}
              className="habit-item habit-manage-row"
              style={{ opacity: inactive ? 0.5 : 1 }}
            >
              <div className="habit-icon">{cat.icon}</div>
              <div className="habit-details">
                <div className="habit-name">
                  {cat.name}
                  {inactive && ' (archived)'}
                </div>
                <div className="habit-meta">
                  {cat.kind === 'cap'
                    ? `Cap \u00B7 \u2264 ${cat.targetHours}h/week`
                    : `Floor \u00B7 \u2265 ${cat.targetHours}h/night, ${cat.floorThreshold || 5}/7 nights`}
                </div>
              </div>
              <button
                className="btn-secondary"
                style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
                onClick={() => startEdit(cat)}
              >
                Edit
              </button>
              <button
                className="btn-secondary"
                style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleArchiveToggle(cat)}
                title={inactive ? 'Restore' : 'Archive'}
              >
                {inactive ? '\u21BA' : '\u{1F5C3}\uFE0F'}
              </button>
              <button
                className="btn-secondary btn-danger"
                style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
                onClick={() => handleDelete(cat)}
              >
                {'\u2715'}
              </button>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="form-card" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Gaming"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="meal-type-picker">
              <button
                type="button"
                className={`meal-type-option ${kind === 'cap' ? 'selected' : ''}`}
                onClick={() => setKind('cap')}
              >
                <span className="meal-type-label">Cap (stay under)</span>
              </button>
              <button
                type="button"
                className={`meal-type-option ${kind === 'floor' ? 'selected' : ''}`}
                onClick={() => setKind('floor')}
              >
                <span className="meal-type-label">Floor (stay over)</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {kind === 'cap' ? 'Weekly target (hours)' : 'Nightly floor (hours)'}
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="form-input"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
            />
          </div>

          {kind === 'floor' && (
            <div className="form-group">
              <label className="form-label">Nights needed to pass (out of 7)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="7"
                className="form-input"
                value={floorThreshold}
                onChange={(e) => setFloorThreshold(e.target.value)}
              />
            </div>
          )}

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

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
              {editing ? 'Save Changes' : '\u2726 Add Category'}
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
          + Add Time Category
        </button>
      )}
    </div>
  );
}
