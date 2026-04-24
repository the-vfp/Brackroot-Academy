import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import CategoryManager from './CategoryManager.jsx';

function formatHour(h) {
  if (h === 0) return 'Midnight';
  if (h === 12) return 'Noon';
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

export default function Settings() {
  const {
    appState, setDayRolloverHour,
    handleExport, handleImport, handleReset
  } = useStore();
  const showToast = useToast();
  const fileInputRef = useRef(null);
  const [showCategories, setShowCategories] = useState(false);

  if (showCategories) {
    return <CategoryManager onBack={() => setShowCategories(false)} />;
  }

  async function onImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await handleImport(file);
      showToast('\u{1F4E5} Data imported');
    } catch (err) {
      showToast('Failed to import: ' + err.message);
    }
    e.target.value = '';
  }

  async function onExport() {
    await handleExport();
    showToast('\u{1F4E4} Data exported');
  }

  function onReset() {
    if (confirm('Reset everything? All logs, Stardust, and progress will be lost.')) {
      if (confirm('Are you really sure? This cannot be undone.')) {
        handleReset();
        showToast('\u{1F5D1} All data cleared');
      }
    }
  }

  return (
    <div className="tab-view active">
      <div className="section-title">{'\u2699\uFE0F'} Settings</div>

      <div className="data-actions">
        <div className="section-title">Day & Rollover</div>
        <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.5 }}>
          When the day flips over. Anything before this hour still counts as
          yesterday {'\u2014'} useful if your nights run late.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ink-2)' }}>
          <span>Day starts at</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 10px' }}
            value={appState?.dayRolloverHour ?? 0}
            onChange={(e) => setDayRolloverHour(Number(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="data-actions">
        <div className="section-title">Categories</div>
        <button className="btn-secondary" onClick={() => setShowCategories(true)}>
          {'\u2699\uFE0F'} Manage Categories
        </button>
      </div>

      <div className="data-actions">
        <div className="section-title">Vault Management</div>
        <button className="btn-secondary" onClick={onExport}>
          {'\u{1F4E4}'} Export JSON
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          {'\u{1F4E5}'} Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={onImport}
        />
        <button className="btn-secondary btn-danger" onClick={onReset}>
          {'\u{1F5D1}'} Reset All
        </button>
      </div>

    </div>
  );
}
