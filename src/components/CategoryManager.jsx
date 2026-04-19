import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

const ICON_OPTIONS = [
  '\u{1F96C}', '\u{1F989}', '\u{1F377}', '\u2615', '\u{1F58B}\uFE0F', '\u{1F6CD}\uFE0F',
  '\u{1F3B2}', '\u{1F4EE}', '\u{1F6E4}\uFE0F', '\u{1F3AD}', '\u{1F33F}', '\u{1F3DB}\uFE0F',
  '\u{1F4B0}', '\u{1F381}', '\u{1F3E0}', '\u{1F4DA}', '\u{1F3A8}', '\u{1F6E1}\uFE0F',
  '\u{1F48E}', '\u{1F3B5}', '\u{1F52C}', '\u{1F4F1}', '\u{1F9F9}', '\u2728'
];

export default function CategoryManager({ onBack }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const showToast = useToast();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);

  function resetForm() {
    setName('');
    setIcon(ICON_OPTIONS[0]);
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(cat) {
    setEditing(cat.id);
    setName(cat.name);
    setIcon(cat.icon);
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

    if (editing) {
      await updateCategory(editing, { name: name.trim(), icon });
      showToast('Category updated');
    } else {
      await addCategory(name.trim(), icon);
      showToast('Category added!');
    }
    resetForm();
  }

  async function handleDelete(id, catName) {
    if (confirm(`Remove "${catName}"? All expenses filed under it will also be removed.`)) {
      await deleteCategory(id);
      showToast('Category removed');
      if (editing === id) resetForm();
    }
  }

  const showForm = showAdd || editing !== null;

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Manage Categories</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {'\u2190'} Back
        </button>
      </div>

      <div className="habit-list">
        {categories.map(cat => (
          <div key={cat.id} className="habit-item habit-manage-row">
            <div className="habit-icon">{cat.icon}</div>
            <div className="habit-details">
              <div className="habit-name">{cat.name}</div>
            </div>
            <button
              className="btn-secondary"
              style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
              onClick={() => startEdit(cat)}
            >
              Edit
            </button>
            <button
              className="btn-secondary btn-danger"
              style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
              onClick={() => handleDelete(cat.id, cat.name)}
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="form-card" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Pets"
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
          + Add New Category
        </button>
      )}
    </div>
  );
}
