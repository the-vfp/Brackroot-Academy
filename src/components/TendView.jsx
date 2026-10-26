import { useState, useEffect } from 'react';
import HabitChecklist from './HabitChecklist.jsx';
import TaskView from './TaskView.jsx';

const SUB_PAGES = [
  { id: 'habits', label: 'Habits' },
  { id: 'tasks',  label: 'Tasks' },
];

// `highlight` ({ task?, habit?, at }) comes from a nudge deep link / the
// Hearth's "Go →": it picks the sub-page and flashes the row once there.
export default function TendView({ initialSubPage = 'habits', highlight = null }) {
  const [subPage, setSubPage] = useState(initialSubPage);

  useEffect(() => {
    if (!highlight) return;
    if (highlight.task) setSubPage('tasks');
    else if (highlight.habit) setSubPage('habits');
  }, [highlight]);

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
      {subPage === 'habits' && <HabitChecklist highlightId={highlight?.habit} highlightKey={highlight?.at} />}
      {subPage === 'tasks' && <TaskView highlightId={highlight?.task} highlightKey={highlight?.at} />}
    </>
  );
}
