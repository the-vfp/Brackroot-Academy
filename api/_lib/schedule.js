// Pure scheduling logic. No I/O, no push — so it can be unit-tested with fake
// clocks. Times are evaluated in the device's IANA timezone.

const DAY_MS = 86400000;
const SNOOZE_MS = 60 * 60 * 1000;   // "Later" = one hour
const FIRED_KEEP_MS = 8 * DAY_MS;   // dedupe memory

// ── Timezone helpers ──────────────────────────────────────────────────────

const fmtCache = new Map();
function fmt(tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Wall-clock parts of an instant in tz.
export function partsInTz(ms, tz) {
  const p = {};
  for (const { type, value } of fmt(tz).formatToParts(new Date(ms))) p[type] = value;
  return {
    y: +p.year, m: +p.month, d: +p.day,
    hh: +p.hour === 24 ? 0 : +p.hour, mm: +p.minute, ss: +p.second,
    dow: DOW[p.weekday],
    dateStr: `${p.year}-${p.month}-${p.day}`,
  };
}

// The instant at which the wall clock in tz reads dateStr + 'HH:MM'.
export function instantFor(dateStr, hhmm, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  // Two passes handle DST transitions well enough for reminder precision.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = partsInTz(guess, tz);
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
    guess += asUtc - seen;
  }
  return guess;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

function dowOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// ── Due computation ───────────────────────────────────────────────────────

// Returns the (item, dateStr, fireAt) triples whose fire instant falls in
// (since, now]. Items: { id, kind, label, time:'HH:MM', days?:[0-6], date?:'YYYY-MM-DD', url }.
export function dueBetween(items, since, now, tz) {
  const out = [];
  if (!(now > since)) return out;
  const first = partsInTz(since, tz).dateStr;
  const last = partsInTz(now, tz).dateStr;
  for (const item of items) {
    if (!item || !/^\d{2}:\d{2}$/.test(item.time || '')) continue;
    for (let ds = first; ds <= last; ds = addDays(ds, 1)) {
      const applies = item.date ? item.date === ds
        : Array.isArray(item.days) ? item.days.includes(dowOf(ds))
        : false;
      if (!applies) continue;
      const fireAt = instantFor(ds, item.time, tz);
      if (fireAt > since && fireAt <= now) out.push({ item, dateStr: ds, fireAt });
    }
  }
  return out;
}

// Advance a device document to `now`. Mutates and returns { doc, toPush }
// where toPush is the list of open-nudge records that need a push sent.
// `rand` supplies ids (injected for tests).
export function tickDevice(doc, now, rand = defaultId) {
  const tz = doc.tz || 'America/Edmonton';
  const toPush = [];
  // First tick: don't backfill a week of history — start from an hour ago.
  const since = doc.lastTick || (now - 60 * 60 * 1000);

  // 1. Snoozed nudges come back.
  for (const n of doc.open) {
    if (n.snoozeUntil && n.snoozeUntil <= now) {
      n.snoozeUntil = null;
      n.refiredAt = now;
      toPush.push(n);
    }
  }

  // 2. New fires.
  for (const { item, dateStr, fireAt } of dueBetween(doc.schedule, since, now, tz)) {
    const key = `${item.id}@${dateStr}`;
    if (doc.fired[key]) continue;
    doc.fired[key] = fireAt;

    // The same item still open from an earlier day = it was never answered.
    // Close it as "ignored" so the record stays honest, then open the new one.
    for (const prev of doc.open.filter(o => o.itemId === item.id)) {
      closeNudge(doc, prev, 'ignored', now);
    }
    const nudge = {
      nudgeId: rand(),
      itemId: item.id,
      kind: item.kind,
      label: item.label,
      url: item.url,
      dateStr,
      firedAt: fireAt,
      snoozeUntil: null,
      openedAt: null,
      laterCount: 0,
    };
    doc.open.push(nudge);
    toPush.push(nudge);
  }

  // 3. Forget old dedupe keys.
  for (const [k, t] of Object.entries(doc.fired)) {
    if (now - t > FIRED_KEEP_MS) delete doc.fired[k];
  }

  doc.lastTick = now;
  return { doc, toPush };
}

export function closeNudge(doc, nudge, answer, now) {
  doc.open = doc.open.filter(o => o.nudgeId !== nudge.nudgeId);
  doc.log.push({
    nudgeId: nudge.nudgeId,
    itemId: nudge.itemId,
    kind: nudge.kind,
    label: nudge.label,
    dateStr: nudge.dateStr,
    firedAt: nudge.firedAt,
    openedAt: nudge.openedAt,
    laterCount: nudge.laterCount,
    answer,                       // 'did' | 'skip' | 'ignored'
    answeredAt: now,
    minutesToAnswer: Math.round((now - nudge.firedAt) / 60000),
  });
  if (doc.log.length > 2000) doc.log = doc.log.slice(-2000);
}

// Apply an answer from the app. Returns false if the nudge isn't open.
export function answerNudge(doc, nudgeId, answer, now) {
  const n = doc.open.find(o => o.nudgeId === nudgeId);
  if (!n) return false;
  if (answer === 'opened') { if (!n.openedAt) n.openedAt = now; return true; }
  if (answer === 'later') { n.laterCount += 1; n.snoozeUntil = now + SNOOZE_MS; return true; }
  if (answer === 'did' || answer === 'skip') { closeNudge(doc, n, answer, now); return true; }
  return false;
}

function defaultId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
