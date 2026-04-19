import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import CategoryManager from './CategoryManager.jsx';

export default function Settings({ onBack }) {
  const {
    handleExport, handleImport, handleReset,
    currentUser, syncStatus, signIn, signOut, pullFromFirestore
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
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{'\u2699\uFE0F'} Settings</span>
        <button className="btn-secondary" onClick={onBack} style={{ margin: 0, fontSize: 11 }}>
          {'\u2190'} Back
        </button>
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

      <div className="data-actions">
        <div className="section-title">{'\u2601\uFE0F'} Cloud Sync</div>
        <p style={{ fontSize: '12px', color: 'var(--text-warm)', margin: '0 0 8px' }}>
          {currentUser
            ? `Signed in as ${currentUser.displayName || currentUser.email}`
            : 'Sign in to sync across devices'}
        </p>
        {syncStatus === 'syncing' && (
          <p style={{ fontSize: '11px', color: 'var(--accent-gold)', margin: '0 0 8px' }}>Syncing...</p>
        )}
        {syncStatus === 'error' && (
          <p style={{ fontSize: '11px', color: 'var(--accent-ruby)', margin: '0 0 8px' }}>Sync error \u2014 data saved locally</p>
        )}
        {currentUser ? (
          <>
            <button className="btn-secondary" onClick={pullFromFirestore}>
              {'\u21BB'} Sync Now
            </button>
            <button className="btn-secondary" onClick={signOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="btn-secondary" onClick={signIn}>
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
