import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { ToastProvider } from './components/Toast.jsx';
import FallingLeaves from './components/FallingLeaves.jsx';
import Navigation from './components/Navigation.jsx';
import Campus from './components/Campus/Campus.jsx';
import Journal from './components/Journal.jsx';
import LedgerView from './components/LedgerView.jsx';
import TendView from './components/TendView.jsx';
import Settings from './components/Settings.jsx';
import './App.css';

const VALID_TABS = ['campus', 'journal', 'ledger', 'tend'];

function AppContent() {
  const { appState } = useStore();
  const [activeTab, setActiveTab] = useState('tend');
  const [ledgerInitial, setLedgerInitial] = useState('spend');
  const [showSettings, setShowSettings] = useState(false);

  // Support ?tab= deep links. "log"/"spend"/"eat" all resolve to the Ledger tab
  // with the appropriate sub-page pre-selected.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'log' || tab === 'spend') { setActiveTab('ledger'); setLedgerInitial('spend'); }
    else if (tab === 'eat') { setActiveTab('ledger'); setLedgerInitial('eat'); }
    else if (tab === 'habits' || tab === 'tasks') setActiveTab('tend');
    else if (VALID_TABS.includes(tab)) setActiveTab(tab);
  }, []);

  return (
    <>
      <FallingLeaves />
      <div className="app">
        <header className="header">
          <button
            className="header-settings-btn"
            onClick={() => setShowSettings(s => !s)}
            aria-label={showSettings ? 'Close Settings' : 'Settings'}
          >
            {'\u2699\uFE0F'}
          </button>
          <h1>{'\u{1F3F0}'} Brackroot Academy</h1>
          <div className="stardust-display">
            <span className="sparkle">{'\u2728'}</span>
            <span>{(appState?.stardust || 0).toLocaleString()}</span> Stardust
          </div>
        </header>

        <div className="main">
          {showSettings ? (
            <Settings />
          ) : (
            <>
              {activeTab === 'campus' && <Campus />}
              {activeTab === 'journal' && <Journal />}
              {activeTab === 'ledger' && <LedgerView initialSubPage={ledgerInitial} />}
              {activeTab === 'tend' && <TendView />}
            </>
          )}
        </div>

        {!showSettings && (
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </StoreProvider>
  );
}
