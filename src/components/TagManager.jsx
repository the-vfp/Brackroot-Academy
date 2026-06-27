import { useState } from "react";
import { useStore } from "../store.jsx";
import { useToast } from "./Toast.jsx";
import { useLongPress } from "../hooks/useLongPress.js";

const DEFAULT_ICON = "\u{1F3F7}️"; // 🏷️

function TagRow({ tag, onLongPress }) {
  const handlers = useLongPress(onLongPress);
  return (
    <div className="habit-item" role="button" tabIndex={0} {...handlers}>
      <div className="habit-icon">{tag.icon || DEFAULT_ICON}</div>
      <div className="habit-details">
        <div className="habit-name">
          {tag.name}
          {tag.reward === false && (
            <span className="habit-meta"> {"·"} no reward</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TagManager({ onBack }) {
  const { tags, addTag, updateTag, deleteTag } = useStore();
  const showToast = useToast();

  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [reward, setReward] = useState(true);

  function resetForm() {
    setName("");
    setIcon(DEFAULT_ICON);
    setReward(true);
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(tag) {
    setEditing(tag.id);
    setName(tag.name);
    setIcon(tag.icon || DEFAULT_ICON);
    setReward(tag.reward !== false);
    setShowAdd(false);
  }

  function startAdd() {
    resetForm();
    setShowAdd(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast("Give your tag a name.");
      return;
    }
    const safeIcon = (icon || DEFAULT_ICON).trim() || DEFAULT_ICON;

    if (editing) {
      await updateTag(editing, { name: name.trim(), icon: safeIcon, reward });
      showToast("Tag updated");
    } else {
      await addTag(name.trim(), safeIcon, reward);
      showToast("Tag added!");
    }
    resetForm();
  }

  async function handleDelete(tag) {
    const confirmed = confirm(
      `Delete "${tag.name}"? Tasks tagged with it will simply become untagged — they won't be removed.`
    );
    if (confirmed) {
      await deleteTag(tag.id);
      showToast("Tag removed");
      if (editing === tag.id) resetForm();
    }
  }

  const sorted = [...tags].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  function RewardToggle({ value, onChange }) {
    return (
      <label className="tag-reward-toggle">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>Earns Stardust {"✨"}</span>
      </label>
    );
  }

  return (
    <div className="tab-view active">
      <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Manage Task Tags</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {"←"} Back
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>
        Project tags for your tasks. Long-press a tag to edit or remove it. Turn
        off <strong>Earns Stardust</strong> for project menus you'd rather reward
        in one block instead of per task.
      </p>

      <div className="habit-list">
        {sorted.map(tag => {
          if (editing === tag.id) {
            return (
              <div key={tag.id} className="habit-item habit-edit-item" onClick={(e) => e.stopPropagation()}>
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
                    aria-label="Tag emoji"
                  />
                  <input
                    type="text"
                    className="form-input habit-edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tag name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") resetForm();
                    }}
                  />
                </div>
                <RewardToggle value={reward} onChange={setReward} />
                <div className="habit-edit-actions">
                  <button className="btn-primary" onClick={handleSave}>Save</button>
                  <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancel</button>
                  <button
                    className="btn-secondary btn-danger"
                    onClick={() => handleDelete(tag)}
                    style={{ margin: 0 }}
                  >
                    {"\u{1F5D1}"}
                  </button>
                </div>
              </div>
            );
          }
          return (
            <TagRow key={tag.id} tag={tag} onLongPress={() => startEdit(tag)} />
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
              aria-label="Tag emoji"
            />
            <input
              type="text"
              className="form-input habit-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Brackroot"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") resetForm();
              }}
            />
          </div>
          <RewardToggle value={reward} onChange={setReward} />
          <div className="habit-edit-actions" style={{ marginTop: 10 }}>
            <button className="btn-primary" onClick={handleSave}>{"✦"} Add Tag</button>
            <button className="btn-secondary" onClick={resetForm} style={{ margin: 0 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={startAdd} style={{ marginTop: 12 }}>
          + Add New Tag
        </button>
      )}

      {sorted.length === 0 && !showAdd && (
        <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 12, lineHeight: 1.5 }}>
          No tags yet. Add one to start sorting tasks into projects.
        </p>
      )}
    </div>
  );
}
