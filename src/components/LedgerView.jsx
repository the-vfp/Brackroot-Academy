import { useState } from 'react';
import SpendView from './SpendView.jsx';
import EatSubView from './EatSubView.jsx';
import TimeSubView from './TimeSubView.jsx';

const SUB_PAGES = [
  { id: 'spend', label: 'Spend' },
  { id: 'eat',   label: 'Eat' },
  { id: 'time',  label: 'Time' },
];

export default function LedgerView({ initialSubPage = 'spend' }) {
  const [subPage, setSubPage] = useState(initialSubPage);

  return (
    <>
      <div className="subnav">
        {SUB_PAGES.map(p => (
          <button
            key={p.id}
            className={`subnav-btn ${subPage === p.id ? 'active' : ''}`}
            onClick={() => setSubPage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {subPage === 'spend' && <SpendView />}
      {subPage === 'eat' && <EatSubView />}
      {subPage === 'time' && <TimeSubView />}
    </>
  );
}
