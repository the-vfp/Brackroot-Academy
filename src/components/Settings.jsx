import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import CategoryManager from './CategoryManager.jsx';
import TimeCategoryManager from './TimeCategoryManager.jsx';
import TagManager from './TagManager.jsx';

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
    handleExport, handleImport, handleReset,
    nudgesAvailable, nudgesEnabled, nudgeStatus, openNudges,
    enableNudges, disableNudges, setNudgeDailyTime, sendTestNudge,
  } = useStore();
  const showToast = useToast();
  const fileInputRef = useRef(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showTimeCategories, setShowTimeCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [nudgeBusy, setNudgeBusy] = useState(false);

  async function onToggleNudges() {
    setNudgeBusy(true);
    try {
      if (nudgesEnabled) {
        await disableNudges();
        showToast('Nudges off');
      } else {
        await enableNudges();
        showToast('\u{1F514} Nudges on');
      }
    } catch (err) {
      showToast(err.message || 'Could not switch nudges on');
    }
    setNudgeBusy(false);
  }

  async function onTestNudge() {
    setNudgeBusy(true);
    try {
      const res = await sendTestNudge();
      showToast(res.ok ? 'Sent — check your notifications' : `Couldn’t send (${res.reason})`);
    } catch (err) {
      showToast(err.message || 'Could not send a test');
    }
    setNudgeBusy(false);
  }

  const nudgeStatusLabel = !nudgesEnabled ? 'Off'
    : nudgeStatus === 'blocked' ? 'Blocked by the browser'
    : nudgeStatus === 'error' ? 'Can’t reach the server'
    : nudgeStatus === 'syncing' ? 'Syncing…'
    : `On · ${openNudges.length} waiting`;

  if (showCategories) {
    return <CategoryManager onBack={() => setShowCategories(false)} />;
  }
  if (showTimeCategories) {
    return <TimeCategoryManager onBack={() => setShowTimeCategories(false)} />;
  }
  if (showTags) {
    return <TagManager onBack={() => setShowTags(false)} />;
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
        <div className="section-title">Nudges</div>
        <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: '0 0 8px', lineHeight: 1.5 }}>
          Reminders that come to you as notifications, even with the app closed.
          Each one waits on the Hearth until you answer it, and the answers are
          kept so the pattern can be looked at later.
        </p>
        {!nudgesAvailable ? (
          <p style={{ fontSize: '12px', color: 'var(--ink-3)', margin: 0 }}>
            Not available here {'—'} this browser can{'’'}t do push notifications,
            or this build has no nudge server configured.
          </p>
        ) : (
          <>
            <div className="nudge-status-row">
              <span className={`nudge-status-dot ${nudgesEnabled ? (nudgeStatus === 'ok' || nudgeStatus === 'syncing' ? 'on' : 'warn') : ''}`} />
              <span>{nudgeStatusLabel}</span>
            </div>
            <button className="btn-secondary" onClick={onToggleNudges} disabled={nudgeBusy}>
              {nudgesEnabled ? '\u{1F515} Turn nudges off' : '\u{1F514} Turn nudges on'}
            </button>
            <label className="nudge-time-row">
              <span>Daily log nudge at</span>
              <input
                type="time"
                className="form-input"
                style={{ width: 'auto', padding: '8px 10px' }}
                value={appState?.nudgeDailyTime || '10:00'}
                onChange={(e) => setNudgeDailyTime(e.target.value)}
              />
            </label>
            {nudgesEnabled && (
              <button className="btn-secondary" onClick={onTestNudge} disabled={nudgeBusy}>
                {'\u{1F4E8}'} Send a test nudge
              </button>
            )}
            <p style={{ fontSize: '11px', color: 'var(--ink-3)', margin: '6px 0 0', lineHeight: 1.5 }}>
              Task and habit reminders are set on the task or habit itself
              (long-press one to edit). Nudges can arrive a few minutes late.
            </p>
          </>
        )}
      </div>

      <div className="data-actions">
        <div className="section-title">Categories</div>
        <button className="btn-secondary" onClick={() => setShowCategories(true)}>
          {'\u2699\uFE0F'} Manage Spend Categories
        </button>
        <button className="btn-secondary" onClick={() => setShowTimeCategories(true)}>
          {'\u231B'} Manage Time Categories
        </button>
        <button className="btn-secondary" onClick={() => setShowTags(true)}>
          {'\u{1F3F7}'}{'\uFE0F'} Manage Task Tags
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
