import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { useToast } from '../Toast.jsx';
import { CHALLENGES } from '../../data/challenges.js';
import { CHARACTER_DEFS } from '../../data/characters.js';

export default function Challenges() {
  const {
    activeChallengeRun,
    getChallengeStatus,
    getActiveChallengeProgress,
    canArmChallenge,
    armChallenge,
    abandonChallenge,
    claimChallenge,
  } = useStore();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClaim() {
    setBusy(true);
    try {
      const r = await claimChallenge();
      if (!r.ok) { showToast(r.reason); return; }
      if (r.opened) {
        showToast(`✨ Lv ${r.opened.level} opened — a letter is waiting on the Hearth`);
      } else {
        showToast(`✓ ${r.challenge?.title || 'Challenge'} complete`);
      }
    } finally {
      setBusy(false);
    }
  }

  const groups = { active: [], available: [], locked: [], completed: [] };
  for (const def of CHALLENGES) groups[getChallengeStatus(def.id)].push(def);

  const activeProgress = getActiveChallengeProgress();

  async function run(fn) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  function charName(def) {
    if (!def.characterId) return 'Group';
    return CHARACTER_DEFS[def.characterId]?.name || def.characterId;
  }

  function head(def, trailing) {
    return (
      <div className="challenge-card-head">
        <span className="challenge-card-title">{def.title}</span>
        <span className="challenge-card-char">{trailing}</span>
      </div>
    );
  }

  return (
    <>
      <div className="section-title">Challenges</div>
      <p className="challenge-note">
        Complete a challenge to open a held relationship level {'—'} its heart event plays.
        Challenges cost nothing and grant no Stardust; the scene is the reward. One active at a time.
      </p>

      {groups.active.map(def => {
        const p = activeProgress;
        const pct = p ? Math.min(100, Math.round((p.current / p.target) * 100)) : 0;
        return (
          <div key={def.id} className="challenge-card active">
            {head(def, `${charName(def)} · Lv ${def.gatesLevel}`)}
            <div className="challenge-card-blurb">{def.blurb}</div>
            <div className="challenge-progress">
              <div className="challenge-progress-track">
                <div className="challenge-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="challenge-progress-label">
                {p ? `${p.current}/${p.target} ${p.unit}` : ''}
              </span>
            </div>
            <div className="challenge-card-actions">
              <button
                className="challenge-btn primary"
                disabled={busy || !p?.met}
                onClick={handleClaim}
              >
                {p?.met ? 'Claim' : 'In progress'}
              </button>
              <button
                className="challenge-btn ghost"
                disabled={busy}
                onClick={() => run(abandonChallenge)}
              >
                Abandon
              </button>
            </div>
            {def.provisional && <div className="challenge-provisional">Provisional {'—'} engine demo</div>}
          </div>
        );
      })}

      {groups.available.length > 0 && <div className="event-group-label">Available</div>}
      {groups.available.map(def => (
        <div key={def.id} className="challenge-card available">
          {head(def, `${charName(def)} · Lv ${def.gatesLevel}`)}
          <div className="challenge-card-blurb">{def.blurb}</div>
          <div className="challenge-card-actions">
            <button
              className="challenge-btn primary"
              disabled={busy || !!activeChallengeRun}
              onClick={() => run(() => armChallenge(def.id))}
            >
              {activeChallengeRun ? 'Finish active first' : 'Arm'}
            </button>
          </div>
          {def.provisional && <div className="challenge-provisional">Provisional {'—'} engine demo</div>}
        </div>
      ))}

      {groups.locked.length > 0 && <div className="event-group-label">Locked</div>}
      {groups.locked.map(def => (
        <div key={def.id} className="challenge-card locked">
          {head(def, `${charName(def)} · Lv ${def.gatesLevel}`)}
          <div className="challenge-card-blurb">{def.blurb}</div>
          <div className="challenge-card-reason">{canArmChallenge(def.id).reason}</div>
        </div>
      ))}

      {groups.completed.length > 0 && <div className="event-group-label">Completed</div>}
      {groups.completed.map(def => (
        <div key={def.id} className="challenge-card completed">
          {head(def, `✓ Done`)}
          <div className="challenge-card-blurb">{def.blurb}</div>
        </div>
      ))}

      {CHALLENGES.length === 0 && <div className="history-empty">No challenges yet.</div>}
    </>
  );
}
