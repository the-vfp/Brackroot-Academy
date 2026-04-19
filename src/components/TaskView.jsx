import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';

export default function TaskView() {
  const { tasks, addTask, completeTask, deleteTask, clearCompletedTasks } = useStore();
  const showToast = useToast();
  const [text, setText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    await addTask(text.trim());
    setText('');
    showToast('Task added!');
  }

  async function handleComplete(id) {
    const result = await completeTask(id);
    if (result) {
      showToast(`+${result.stardust} \u2728`);
    }
  }

  async function handleDelete(id) {
    if (confirmDelete === id) {
      await deleteTask(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  async function handleClearCompleted() {
    await clearCompletedTasks();
    showToast('Cleared completed tasks');
  }

  return (
    <div className="tab-view active">
      <div className="section-title">Tasks</div>

      <form className="task-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="task-input"
          placeholder="What needs doing?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary task-add-btn" disabled={!text.trim()}>
          Add
        </button>
      </form>

      {activeTasks.length > 0 && (
        <div className="task-list">
          {activeTasks.map(task => (
            <div key={task.id} className="task-item">
              <button className="task-check" onClick={() => handleComplete(task.id)}>
              </button>
              <div className="task-details">
                <div className="task-text">{task.text}</div>
                <div className="task-meta">10 {'\u2728'}</div>
              </div>
              <button
                className={`task-delete-btn ${confirmDelete === task.id ? 'confirm' : ''}`}
                onClick={() => handleDelete(task.id)}
              >
                {confirmDelete === task.id ? 'Sure?' : '\u{1F5D1}'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="history-empty">
          No tasks yet. Add one above!
        </div>
      )}

      {completedTasks.length > 0 && (
        <>
          <div className="task-completed-header">
            <span className="task-completed-label">
              Completed ({completedTasks.length})
            </span>
            <button className="btn-secondary task-clear-btn" onClick={handleClearCompleted}>
              Clear
            </button>
          </div>
          <div className="task-list">
            {completedTasks.map(task => (
              <div key={task.id} className="task-item completed">
                <div className="task-check done">{'\u2713'}</div>
                <div className="task-details">
                  <div className="task-text">{task.text}</div>
                  <div className="task-meta">+10 {'\u2728'} earned</div>
                </div>
                <button
                  className={`task-delete-btn ${confirmDelete === task.id ? 'confirm' : ''}`}
                  onClick={() => handleDelete(task.id)}
                >
                  {confirmDelete === task.id ? 'Sure?' : '\u{1F5D1}'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
