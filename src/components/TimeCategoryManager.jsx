import { useState } from "react";
import { useStore } from "../store.jsx";
import { useToast } from "./Toast.jsx";
import { useLongPress } from "../hooks/useLongPress.js";

const DEFAULT_ICON = "\u231B";

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
        <div className="habit-meta">
          {cat.kind === "cap"
            ? `Cap \u00B7 \u2264 ${cat.targetHours}h/week`
            : `Floor \u00B7 \u2265 ${cat.targetHours}h/night, ${cat.floorThreshold || 5}/7 nights`}
        </div>
      </div>
    </div>
  );
}

export default function TimeCategoryManager({ onBack }) {
  const {
    timeCategories,
    addTimeCategory, updateTimeCategory,
    archiveTimeCategory, unarchiveTimeCategory, deleteTimeCategory
  } = useStore();
  const showToast = useToast();

  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [kind, setKind] = useState("cap");
  const [targetHours, setTargetHours] = useState(10);
  const [floorThreshold, setFloorThreshold] = useState(5);

  function resetForm() {
    setName("");
    setIcon(DEFAULT_ICON);
    setKind("cap");
    setTargetHours(10);
    setFloorThreshold(5);
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(cat) {
    setEditing(cat.id);
    setName(cat.name);
    setIcon(cat.icon || DEFAULT_ICON);
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
      showToast("Give your category a name.");
      return;
    }
    const tH = Number(targetHours);
    if (!Number.isFinite(tH) || tH <= 0) {
      showToast("Target hours must be greater than zero.");
      return;
    }
    const safeIcon = (icon || DEFAULT_ICON).trim() || DEFAULT_ICON;

    const payload = {
      name: name.trim(),
      icon: safeIcon,
      kind,
      targetHours: tH,
      floorThreshold: kind === "floor" ? Number(floorThreshold) || 5 : null
    };

    if (editing) {
      await updateTimeCategory(editing, payload);
      showToast("Category updated");
    } else {
      await addTimeCategory(payload);
      showToast("Category added!");
    }
    resetForm();
  }

  async function handleArchiveToggle(cat) {
    if (cat.active !== false) {
      await archiveTimeCategory(cat.id);
      showToast("Category archived");
    } else {
      await unarchiveTimeCategory(cat.id);
      showToast("Category restored");
    }
    if (editing === cat.id) resetForm();
  }

  async function handleDelete(cat) {
    const confirmed = confirm(
      `Delete "${cat.name}" permanently? Every hour logged under it will also be removed. Use Archive to stop it from counting toward weekly resolutions while keeping history.`
    );
    if (confirmed) {
      await deleteTimeCategory(cat.id);
      showToast("Category removed");
      if (editing === cat.id) resetForm();
    }
  }

  // Active first, then archived.
  const sorted = [...timeCategories].sort((a, b) => {
    const aA = a.active === false ? 1 : 0;
    const bA = b.active === false ? 1 : 0;
    if (aA !== bA) return aA - bA;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  function renderEditFields(showEditingButtons, cat) {
    const inactive = cat?.active === false;
    return (
      <>
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
            placeholder="e.g., Gaming"
            autoFocus={!showEditingButtons}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") resetForm();
            }}
          />
        </div>

        <div className="habit-type-picker">
          <button
            type="button"
            className={`habit-type-option ${kind === "cap" ? "selected" : ""}`}
            onClick={() => setKind("cap")}
          >
            <span>Cap</span>
            <span className="habit-type-desc">Stay under</span>
          </button>
          <button
            type="button"
            className={`habit-type-option ${kind === "floor" ? "selected" : ""}`}
            onClick={() => setKind("floor")}
          >
            <span>Floor</span>
            <span className="habit-type-desc">Stay over</span>
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">
            {kind === "cap" ? "Weekly target (hours)" : "Nightly floor (hours)"}
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

        {kind === "floor" && (
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

        <div className="habit-edit-actions">
          <button className="btn-primary" onClick={handleSave}>Save</button>
          <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancel</button>
          {showEditingButtons && (
            <>
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
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Manage Time Categories</span>
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
            return (
              <div key={cat.id} className="habit-item habit-edit-item" onClick={(e) => e.stopPropagation()}>
                {renderEditFields(true, cat)}
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
          {renderEditFields(false, null)}
        </div>
      ) : (
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
