import { useState } from 'react';
import MealEntry from './MealEntry.jsx';
import MealLedger from './MealLedger.jsx';

export default function EatSubView() {
  const [view, setView] = useState('log');

  return (
    <div className="tab-view active">
      <div className="spend-toggle">
        <button
          className={`spend-toggle-btn ${view === 'log' ? 'active' : ''}`}
          onClick={() => setView('log')}
        >
          {'\u2726'} Log
        </button>
        <button
          className={`spend-toggle-btn ${view === 'ledger' ? 'active' : ''}`}
          onClick={() => setView('ledger')}
        >
          {'\u{1F4DC}'} Ledger
        </button>
      </div>
      {view === 'log' ? <MealEntry /> : <MealLedger />}
    </div>
  );
}
