import { useState } from "react";
import { useStore } from "../store.jsx";
import { CHARACTER_DEFS } from "../data/characters.js";
import {
  WIND_RP_FLOOR,
  MIN_ACTIVE_CATEGORIES_FOR_GAIN
} from "../data/timeBudget.js";

// Visual range for the Wind RP bar. Floor stays anchored at WIND_RP_FLOOR;
// the upper bound is generous enough that a strong-week run still has room
// to climb visibly. Going past it just pins the bar at 100%.
const RP_VISUAL_MAX = 20;

function formatWeekRange(weekStart) {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = `${months[start.getMonth()]} ${start.getDate()}`;
  const endLabel = sameMonth ? `${end.getDate()}` : `${months[end.getMonth()]} ${end.getDate()}`;
  return `${startLabel} \u2013 ${endLabel}`;
}

function formatSignedRp(n) {
  if (n === 0) return "0";
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
        <div className={`wind-resolution-delta ${resolution.windRpDelta >= 0 ? "gain" : "loss"}`}>
          {formatSignedRp(resolution.windRpDelta)} RP
        </div>
        <div className="wind-resolution-chevron">{expanded ? "\u2303" : "\u2304"}</div>
      </button>

      {expanded && (
        <div className="wind-resolution-body">
          <div className="wind-resolution-summary">
            {resolution.hits} hit{resolution.hits !== 1 ? "s" : ""}
            {" \u00B7 "}
            {resolution.misses} miss{resolution.misses !== 1 ? "es" : ""}
            {" \u00B7 "}
            {resolution.activeCategoryCount} active
          </div>

          {!gateMet && (
            <div className="wind-resolution-gate">
              Fewer than {MIN_ACTIVE_CATEGORIES_FOR_GAIN} categories {"\u2014"} hits didn{"\u2019"}t count this week.
            </div>
          )}

          <div className="wind-resolution-cats">
            {resolution.categoryResults.map(r => (
              <div key={r.categoryId} className={`wind-cat-row ${r.hit ? "hit" : "miss"}`}>
                <span className="wind-cat-icon">{r.icon}</span>
                <span className="wind-cat-name">{r.name}</span>
                <span className="wind-cat-detail">
                  {r.kind === "cap"
                    ? `${r.actual}h of ${r.target}h`
                    : `${r.actual}h over 7 nights`}
                </span>
                <span className={`wind-cat-verdict ${r.hit ? "hit" : "miss"}`}>
                  {r.hit ? "\u2713" : "\u2715"}
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

  const rpPct = Math.max(
    0,
    Math.min(100, ((windRp - WIND_RP_FLOOR) / (RP_VISUAL_MAX - WIND_RP_FLOOR)) * 100)
  );

  const sorted = [...weeklyResolutions].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const latest = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="tab-view active">
      <div className="journal-card">
        <div className="journal-card-header" style={{ cursor: "default" }}>
          <div className="journal-portrait">{def.portrait}</div>
          <div className="journal-heading">
            <div className="journal-name">{def.name}</div>
            <div className="journal-title">{def.arcLabel}</div>
            <div className="journal-level">
              Wind RP: {formatSignedRp(windRp)}
              {" \u00B7 "}
              Floor {formatSignedRp(WIND_RP_FLOOR)}
            </div>
            <div className="journal-progress-bar">
              <div className="journal-progress-fill" style={{ width: `${rpPct}%` }} />
            </div>
            <div
              className="journal-level"
              style={{ marginTop: 6, color: gateMet ? undefined : "var(--accent-ruby)" }}
            >
              This week: {activeCount} active categor{activeCount === 1 ? "y" : "ies"}
              {!gateMet && ` \u00B7 need ${MIN_ACTIVE_CATEGORIES_FOR_GAIN} to earn RP`}
            </div>
          </div>
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
          <div className="placeholder-title">The first week hasn{"\u2019"}t resolved yet.</div>
          <p className="placeholder-body">
            On Monday, the week{"\u2019"}s caps and floors get tallied, and The Wind
            moves a little closer or a little further. Nothing yet {"\u2014"} come
            back then.
          </p>
        </div>
      )}
    </div>
  );
}
