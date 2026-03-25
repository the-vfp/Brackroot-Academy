import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import CategoryManager from './CategoryManager.jsx';

export default function BudgetView() {
  const { appState, categories, getWeekSpentByCategory, getMonthSpentByCategory, setBudget, handleExport, handleImport, handleReset, currentUser, syncStatus, signIn, signOut, pullFromFirestore } = useStore();
  const showToast = useToast();
  const fileInputRef = useRef(null);
  const [showManager, setShowManager] = useState(false);
  const weekSpent = getWeekSpentByCategory();
  const monthSpent = getMonthSpentByCategory();

  if (showManager) {
    return <CategoryManager onBack={() => setShowManager(false)} />;
  }

  const budgetedCategories = categories.filter(c => (appState.budgets?.[c.id]?.amount || 0) > 0);
  const underBudgetCount = budgetedCategories.filter(c => {
    const entry = appState.budgets[c.id];
    const spent = entry.period === 'monthly' ? monthSpent[c.id] : weekSpent[c.id];
    return (spent || 0) <= entry.amount;
  }).length;

  async function onImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await handleImport(file);
      showToast('\u{1F4E5} Data imported successfully');
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
    if (confirm('Reset everything? All expenses, Silver, and buildings will be lost.')) {
      if (confirm('Are you really sure? This cannot be undone.')) {
        handleReset();
        showToast('\u{1F5D1} All data cleared');
      }
    }
  }

  return (
    <div className="tab-view active">
      {budgetedCategories.length > 0 && (
        <div className="term-honours-banner">
          <h3>{'\u2726'} Term Honours: {underBudgetCount}/{budgetedCategories.length}</h3>
          <p>Categories under budget earn 2{'\u00D7'} Silver</p>
        </div>
      )}

      <div className="section-title">Budgets</div>

      {categories.map(cat => {
        const entry = appState.budgets?.[cat.id];
        const budget = entry?.amount || 0;
        const period = entry?.period || 'weekly';
        const spent = period === 'monthly' ? (monthSpent[cat.id] || 0) : (weekSpent[cat.id] || 0);
        const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
        const ratio = budget > 0 ? spent / budget : 0;
        const barClass = ratio > 1 ? 'over' : ratio > 0.8 ? 'near' : 'under';
        const remaining = budget > 0 ? budget - spent : 0;
        const periodLabel = period === 'monthly' ? '/mo' : '/wk';

        return (
          <div key={cat.id} className="budget-item">
            <div className="budget-header">
              <div className="budget-cat-name">{cat.icon} {cat.name}</div>
              <div className="budget-input-wrap">
                <span>$</span>
                <input
                  className="budget-input"
                  type="number"
                  defaultValue={budget || ''}
                  placeholder="—"
                  min="0"
                  step="5"
                  inputMode="decimal"
                  onBlur={(e) => setBudget(cat.id, e.target.value, period)}
                />
                <button
                  className="budget-period-toggle"
                  onClick={() => setBudget(cat.id, budget, period === 'weekly' ? 'monthly' : 'weekly')}
                  title={period === 'weekly' ? 'Switch to monthly' : 'Switch to weekly'}
                >
                  {periodLabel}
                </button>
              </div>
            </div>

            {budget > 0 ? (
              <>
                <div className="budget-progress">
                  <div className={`budget-progress-fill ${barClass}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="budget-stats">
                  <span>${spent.toFixed(0)} spent</span>
                  <span className={remaining >= 0 ? 'under-text' : 'over-text'}>
                    {remaining >= 0 ? `$${remaining.toFixed(0)} left` : `$${Math.abs(remaining).toFixed(0)} over`}
                  </span>
                </div>
              </>
            ) : (
              <div className="budget-stats">
                <span style={{ fontStyle: 'italic' }}>No budget set</span>
                <span></span>
              </div>
            )}
          </div>
        );
      })}

      <button className="btn-secondary habit-manage-btn" onClick={() => setShowManager(true)}>
        {'\u2699\uFE0F'} Manage Categories
      </button>

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
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
          {currentUser
            ? `Signed in as ${currentUser.displayName || currentUser.email}`
            : 'Sign in to sync across devices'}
        </p>
        {syncStatus === 'syncing' && (
          <p style={{ fontSize: '11px', color: 'var(--accent)', margin: '0 0 8px' }}>Syncing...</p>
        )}
        {syncStatus === 'error' && (
          <p style={{ fontSize: '11px', color: '#c44', margin: '0 0 8px' }}>Sync error — data saved locally</p>
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
