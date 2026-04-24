import { useState } from 'react';
import { useStore } from '../store.jsx';
import { CHARACTER_DEFS } from '../data/characters.js';
import {
  WIND_RP_FLOOR,
  MIN_ACTIVE_CATEGORIES_FOR_GAIN
} from '../data/timeBudget.js';

function formatWeekRange(weekStart) {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = `${months[start.getMonth()]} ${start.getDate()}`;
  const endLabel = sameMonth ? `${end.getDate()}` : `${months[end.getMonth()]} ${end.getDate()}`;
  return `${startLabel} \u2013 ${endLabel}`;
}

function formatSignedRp(n) {
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

function ResolutionCard({ resolution, expandedDefault = false }) {
  const [expanded, setExpanded] = useState(expandedDefault);
  const gateMet = resolution.activeCategoryCount >= MIN_ACTIVE_CATEGORIES_FOR_GAIN;

  return (
    <div className="wind-resolution-card">
      <button
        className="wind-resolution-header"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="wind-resolution-week">
          {formatWeekRange(resolution.weekStart)}
        </div>
        <div className={`wind-resolution-delta ${resolution.windRpDelta >= 0 ? 'gain' : 'loss'}`}>
          {formatSignedRp(resolution.windRpDelta)} RP
        </div>
        <div className="wind-resolution-chevron">{expanded ? '\u2303' : '\u2304'}</div>
      </button>

      {expanded && (
        <div className="wind-resolution-body">
          <div className="wind-resolution-summary">
            {resolution.hits} hit{resolution.hits !== 1 ? 's' : ''}
            {' \u00B7 '}
            {resolution.misses} miss{resolution.misses !== 1 ? 'es' : ''}
            {' \u00B7 '}
            {resolution.activeCategoryCount} active
          </div>

          {!gateMet && (
            <div className="wind-resolution-gate">
              Fewer than {MIN_ACTIVE_CATEGORIES_FOR_GAIN} categories — hits didn\u2019t count this week.
            </div>
          )}

          <div className="wind-resolution-cats">
            {resolution.categoryResults.map(r => (
              <div key={r.categoryId} className={`wind-cat-row ${r.hit ? 'hit' : 'miss'}`}>
                <span className="wind-cat-icon">{r.icon}</span>
                <span className="wind-cat-name">{r.name}</span>
                <span className="wind-cat-detail">
                  {r.kind === 'cap'
                    ? `${r.actual}h of ${r.target}h`
                    : `${r.actual}h over 7 nights`}
                </span>
                <span className={`wind-cat-verdict ${r.hit ? 'hit' : 'miss'}`}>
                  {r.hit ? '\u2713' : '\u2715'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JournalWind() {
  const { appState, weeklyResolutions, getActiveTimeCategories } = useStore();

  const def = CHARACTER_DEFS.wind;
  const windRp = appState?.windRp ?? 0;
  const activeCount = getActiveTimeCategories().length;
  const gateMet = activeCount >= MIN_ACTIVE_CATEGORIES_FOR_GAIN;

  const sorted = [...weeklyResolutions].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const latest = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="tab-view active">
      <div className="wind-card">
        <div className="wind-card-head">
          <div className="wind-portrait">{def.portrait}</div>
          <div>
            <div className="wind-name">{def.name}</div>
            <div className="wind-arc">{def.arcLabel}</div>
          </div>
        </div>

        <div className="wind-rp-row">
          <div className="wind-rp-value">{formatSignedRp(windRp)}</div>
          <div className="wind-rp-label">
            Wind RP
            <div className="wind-rp-floor">Floor {formatSignedRp(WIND_RP_FLOOR)}</div>
          </div>
        </div>

        <div className={`wind-cat-gate ${gateMet ? 'met' : 'unmet'}`}>
          This week: {activeCount} active categor{activeCount === 1 ? 'y' : 'ies'}
          {!gateMet && (
            <span className="wind-cat-gate-hint">
              {' '}\u00B7 need {MIN_ACTIVE_CATEGORIES_FOR_GAIN} to earn RP
            </span>
          )}
        </div>
      </div>

      {latest && (
        <>
          <div className="section-title">Last Resolved</div>
          <ResolutionCard resolution={latest} expandedDefault />
        </>
      )}

      {rest.length > 0 && (
        <>
          <div className="section-title">History</div>
          {rest.map(r => (
            <ResolutionCard key={r.weekStart} resolution={r} />
          ))}
        </>
      )}

      {sorted.length === 0 && (
        <div className="placeholder-card">
          <div className="placeholder-title">The first week hasn\u2019t resolved yet.</div>
          <p className="placeholder-body">
            On Monday, the week\u2019s caps and floors get tallied, and The Wind
            moves a little closer or a little further. Nothing yet — come
            back then.
          </p>
        </div>
      )}
    </div>
  );
}
