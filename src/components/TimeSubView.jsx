import { useState } from 'react';
import TimeEntry from './TimeEntry.jsx';
import TimeLedger from './TimeLedger.jsx';

export default function TimeSubView() {
  const [view, setView] = useState('entry');

  return (
    <div className="tab-view active">
      <div className="spend-toggle">
        <button
          className={`spend-toggle-btn ${view === 'entry' ? 'active' : ''}`}
          onClick={() => setView('entry')}
        >
          {'\u231B'} Entry
        </button>
        <button
          className={`spend-toggle-btn ${view === 'ledger' ? 'active' : ''}`}
          onClick={() => setView('ledger')}
        >
          {'\u{1F4DC}'} Ledger
        </button>
      </div>
      {view === 'entry' ? <TimeEntry /> : <TimeLedger />}
    </div>
  );
}
