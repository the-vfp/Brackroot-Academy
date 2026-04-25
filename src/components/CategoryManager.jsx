import { useState } from "react";
import { useStore } from "../store.jsx";
import { useToast } from "./Toast.jsx";
import { useLongPress } from "../hooks/useLongPress.js";

const DEFAULT_ICON = "\u{1F4E6}";

function CategoryRow({ cat, onLongPress }) {
  const handlers = useLongPress(onLongPress);
  const inactive = cat.active === false;
  return (
    <div
      className="habit-item"
      role="button"
      tabIndex={0}
      style={{ opacity: inactive ? 0.5 : 1 }}
      {...handlers}
    >
      <div className="habit-icon">{cat.icon}</div>
      <div className="habit-details">
        <div className="habit-name">
          {cat.name}
          {inactive && <span className="habit-meta"> {"\u00B7"} archived</span>}
        </div>
      </div>
    </div>
  );
}

export default function CategoryManager({ onBack }) {
  const {
    categories,
    addCategory, updateCategory,
    archiveCategory, unarchiveCategory, deleteCategory
  } = useStore();
  const showToast = useToast();

  // Spend categories live in the same `categories` table as time categories,
  // distinguished by `kind`. v8 backfilled existing rows to kind: 'spend',
  // so anything without an explicit kind also counts as spend.
  const spendCats = categories.filter(c => !c.kind || c.kind === "spend");

  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);

  function resetForm() {
    setName("");
    setIcon(DEFAULT_ICON);
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(cat) {
    setEditing(cat.id);
    setName(cat.name);
    setIcon(cat.icon || DEFAULT_ICON);
    setShowAdd(false);
  }

  function startAdd() {
    resetForm();
    setShowAdd(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast("Give your category a name.");
      return;
    }
    const safeIcon = (icon || DEFAULT_ICON).trim() || DEFAULT_ICON;

    if (editing) {
      await updateCategory(editing, { name: name.trim(), icon: safeIcon });
      showToast("Category updated");
    } else {
      await addCategory(name.trim(), safeIcon);
      showToast("Category added!");
    }
    resetForm();
  }

  async function handleArchiveToggle(cat) {
    if (cat.active === false) {
      await unarchiveCategory(cat.id);
      showToast("Category restored");
    } else {
      await archiveCategory(cat.id);
      showToast("Category archived");
    }
    if (editing === cat.id) resetForm();
  }

  async function handleDelete(cat) {
    const confirmed = confirm(
      `Delete "${cat.name}" permanently? Every expense filed under it will also be removed. Use Archive to hide it from new entries while keeping history.`
    );
    if (confirmed) {
      await deleteCategory(cat.id);
      showToast("Category removed");
      if (editing === cat.id) resetForm();
    }
  }

  // Active first, then archived.
  const sorted = [...spendCats].sort((a, b) => {
    const aA = a.active === false ? 1 : 0;
    const bA = b.active === false ? 1 : 0;
    if (aA !== bA) return aA - bA;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Manage Spend Categories</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {"\u2190"} Back
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Long-press a category to edit, archive, or remove it.
      </p>

      <div className="habit-list">
        {sorted.map(cat => {
          if (editing === cat.id) {
            const inactive = cat.active === false;
            return (
              <div key={cat.id} className="habit-item habit-edit-item" onClick={(e) => e.stopPropagation()}>
                <div className="habit-add-row">
                  <input
                    type="text"
                    className="form-input habit-add-emoji"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder={DEFAULT_ICON}
                    maxLength={8}
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Category emoji"
                  />
                  <input
                    type="text"
                    className="form-input habit-edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") resetForm();
                    }}
                  />
                </div>
                <div className="habit-edit-actions">
                  <button className="btn-primary" onClick={handleSave}>Save</button>
                  <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancel</button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleArchiveToggle(cat)}
                    style={{ margin: 0 }}
                    title={inactive ? "Restore" : "Archive"}
                  >
                    {inactive ? "\u21BA Restore" : "\u{1F5C3}\uFE0F Archive"}
                  </button>
                  <button
                    className="btn-secondary btn-danger"
                    onClick={() => handleDelete(cat)}
                    style={{ margin: 0 }}
                  >
                    {"\u{1F5D1}"}
                  </button>
                </div>
              </div>
            );
          }
          return (
            <CategoryRow key={cat.id} cat={cat} onLongPress={() => startEdit(cat)} />
          );
        })}
      </div>

      {showAdd ? (
        <div className="form-card" style={{ marginTop: 12 }}>
          <div className="habit-add-row">
            <input
              type="text"
              className="form-input habit-add-emoji"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={DEFAULT_ICON}
              maxLength={8}
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Category emoji"
            />
            <input
              type="text"
              className="form-input habit-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pets"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") resetForm();
              }}
            />
          </div>
          <div className="habit-edit-actions" style={{ marginTop: 10 }}>
            <button className="btn-primary" onClick={handleSave}>{"\u2726"} Add Category</button>
            <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancel</button>
          </div>
        </div>
      ) : (
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
