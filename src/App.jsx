import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { ToastProvider } from './components/Toast.jsx';
import FallingLeaves from './components/FallingLeaves.jsx';
import Navigation from './components/Navigation.jsx';
import Hearth from './components/Hearth.jsx';
import Campus from './components/Campus/Campus.jsx';
import Journal from './components/Journal.jsx';
import LedgerView from './components/LedgerView.jsx';
import TendView from './components/TendView.jsx';
import Settings from './components/Settings.jsx';
import StardustStar from './components/StardustStar.jsx';
import './App.css';

const VALID_TABS = ['hearth', 'campus', 'journal', 'ledger', 'tend'];

// Map the real hour to a world theme + chip label. Day is the default palette;
// dusk warms it; night inverts to deep indigo.
function clockState(d) {
  const h = d.getHours();
  const theme = h >= 6 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night';
  const time = `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { theme, label: theme.toUpperCase(), time };
}

function AppContent() {
  const { appState } = useStore();
  const [activeTab, setActiveTab] = useState('hearth');
  const [ledgerInitial, setLedgerInitial] = useState('spend');
  const [tendInitial, setTendInitial] = useState('habits');
  const [showSettings, setShowSettings] = useState(false);
  const [clock, setClock] = useState(() => clockState(new Date()));

  // Drive the day/dusk/night palette off the real clock; refresh each minute.
  useEffect(() => {
    function tick() {
      const c = clockState(new Date());
      setClock(c);
      document.documentElement.setAttribute('data-theme', c.theme);
    }
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Support ?tab= deep links. "log"/"spend"/"eat"/"time" route to the Ledger tab
  // with the right sub-page; "habits"/"tasks" route to Tend with the right sub-page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'log' || tab === 'spend') { setActiveTab('ledger'); setLedgerInitial('spend'); }
    else if (tab === 'eat') { setActiveTab('ledger'); setLedgerInitial('eat'); }
    else if (tab === 'time') { setActiveTab('ledger'); setLedgerInitial('time'); }
    else if (tab === 'habits') { setActiveTab('tend'); setTendInitial('habits'); }
    else if (tab === 'tasks') { setActiveTab('tend'); setTendInitial('tasks'); }
    else if (VALID_TABS.includes(tab)) setActiveTab(tab);
  }, []);

  return (
    <>
      <FallingLeaves />
      <div className="app">
        <header className="header">
          <div className="time-chip">
            <StardustStar size={11} fill="var(--bk-time-accent)" />
            {clock.label} {'·'} {clock.time}
          </div>
          <div className="header-right">
            <div className="stardust-display">
              <StardustStar size={16} fill="var(--bk-stardust-shimmer)" />
              <span>{(appState?.stardust || 0).toLocaleString()}</span>
            </div>
            <button
              className="header-settings-btn"
              onClick={() => setShowSettings(s => !s)}
              aria-label={showSettings ? 'Close Settings' : 'Settings'}
            >
              {'⚙️'}
            </button>
          </div>
        </header>

        <div className="main">
          {showSettings ? (
            <Settings />
          ) : (
            <>
              {activeTab === 'hearth' && <Hearth onNavigate={setActiveTab} />}
              {activeTab === 'campus' && <Campus />}
              {activeTab === 'journal' && <Journal />}
              {activeTab === 'ledger' && <LedgerView initialSubPage={ledgerInitial} />}
              {activeTab === 'tend' && <TendView initialSubPage={tendInitial} />}
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
