import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import { ToastProvider } from './components/Toast.jsx';
import FallingLeaves from './components/FallingLeaves.jsx';
import Navigation from './components/Navigation.jsx';
import CampusView from './components/CampusView.jsx';
import SpendView from './components/SpendView.jsx';
import MealTracker from './components/MealTracker.jsx';
import BudgetView from './components/BudgetView.jsx';
import HabitChecklist from './components/HabitChecklist.jsx';
import './App.css';

function AppContent() {
  const { appState } = useStore();
  const [activeTab, setActiveTab] = useState('campus');

  // Support ?tab=log deep link for PWA shortcut
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'log') setActiveTab('spend'); // backwards compat
    else if (['campus', 'spend', 'eat', 'habits', 'budget'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <>
      <FallingLeaves />
      <div className="app">
        <header className="header">
          <h1>{'\u{1F3F0}'} Brackroot Academy</h1>
          <div className="silver-display">
            <span className="coin">{'\u{1FA99}'}</span>
            <span>{(appState?.silver || 0).toLocaleString()}</span> Silver
          </div>
        </header>

        <div className="main">
          {activeTab === 'campus' && <CampusView />}
          {activeTab === 'spend' && <SpendView />}
          {activeTab === 'eat' && <MealTracker />}
          {activeTab === 'habits' && <HabitChecklist />}
          {activeTab === 'budget' && <BudgetView />}
        </div>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
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
