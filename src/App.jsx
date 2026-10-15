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
  const { appState, answerNudge } = useStore();
  const [activeTab, setActiveTab] = useState('hearth');
  const [ledgerInitial, setLedgerInitial] = useState('spend');
  const [tendInitial, setTendInitial] = useState('habits');
  const [campusInitial, setCampusInitial] = useState('map');
  const [showSettings, setShowSettings] = useState(false);
  // A task/habit to flash + scroll to when landing on Tend (from a nudge).
  const [highlight, setHighlight] = useState(null); // { task?: id, habit?: id, at: ts }

  // Navigate to a tab, optionally landing on a specific sub-page (used by the
  // Hearth's shortcuts, e.g. the active-challenge card → Campus / Challenges).
  // `extra` can name a task/habit id to highlight once there.
  function navigate(tab, sub, extra) {
    setShowSettings(false);
    setActiveTab(tab);
    if (extra && (extra.task || extra.habit)) setHighlight({ ...extra, at: Date.now() });
    if (!sub) return;
    if (tab === 'campus') setCampusInitial(sub);
    else if (tab === 'ledger') setLedgerInitial(sub);
    else if (tab === 'tend') setTendInitial(sub);
  }
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
    else if (tab === 'challenges') { setActiveTab('campus'); setCampusInitial('challenges'); }
    else if (VALID_TABS.includes(tab)) setActiveTab(tab);

    // Arrived from a nudge notification: highlight its task/habit and record
    // that the notification was opened (the nudge itself stays open until
    // answered on the Hearth).
    const task = params.get('task');
    const habit = params.get('habit');
    if (task || habit) setHighlight({ task: task ? Number(task) : undefined, habit: habit ? Number(habit) : undefined, at: Date.now() });
    const nudge = params.get('nudge');
    if (nudge) {
      answerNudge(nudge, 'opened');
      // Don't re-record on a reload.
      const clean = new URL(window.location.href);
      clean.searchParams.delete('nudge');
      window.history.replaceState(null, '', clean.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              {activeTab === 'hearth' && <Hearth onNavigate={navigate} />}
              {activeTab === 'campus' && <Campus initialSubPage={campusInitial} />}
              {activeTab === 'journal' && <Journal />}
              {activeTab === 'ledger' && <LedgerView initialSubPage={ledgerInitial} />}
              {activeTab === 'tend' && <TendView initialSubPage={tendInitial} highlight={highlight} />}
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
