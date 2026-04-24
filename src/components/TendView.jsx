import { useState } from 'react';
import HabitChecklist from './HabitChecklist.jsx';
import TaskView from './TaskView.jsx';

const SUB_PAGES = [
  { id: 'habits', label: 'Habits' },
  { id: 'tasks',  label: 'Tasks' },
];

export default function TendView() {
  const [subPage, setSubPage] = useState('habits');

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
      {subPage === 'habits' && <HabitChecklist />}
      {subPage === 'tasks' && <TaskView />}
    </>
  );
}
