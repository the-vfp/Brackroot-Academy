import { useState } from 'react';
import JournalCharacters from './JournalCharacters.jsx';
import JournalWind from './JournalWind.jsx';
import Insights from './Insights.jsx';

const SUB_PAGES = [
  { id: 'characters', label: 'Characters' },
  { id: 'wind',       label: 'The Wind' },
  { id: 'insights',   label: 'Insights' },
];

export default function Journal() {
  const [subPage, setSubPage] = useState('characters');

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
      {subPage === 'characters' && <JournalCharacters />}
      {subPage === 'wind' && <JournalWind />}
      {subPage === 'insights' && <Insights />}
    </>
  );
}
