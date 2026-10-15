// Nudges: push reminders that come to you. The app mirrors its schedule to a
// tiny server (api/) which fires the pushes on a cron; answers are logged
// there so the record can be read later. Everything here is best-effort —
// the tracker must keep working offline / with the API unreachable.

const API = (import.meta.env.VITE_NUDGE_API || '').replace(/\/$/, '');
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const LS_DEVICE = 'brackroot.nudge.device';
const LS_LAST_SYNC = 'brackroot.nudge.lastSync';

export const nudgesConfigured = !!(API && VAPID_PUBLIC);
export const pushSupported = typeof window !== 'undefined'
  && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// The device id is the credential for this device's server document. It lives
// in localStorage (not in the export) so a restored backup on another device
// doesn't hijack this one's subscription.
export function getDeviceId() {
  try {
    let id = localStorage.getItem(LS_DEVICE);
    if (!id || !/^[a-f0-9]{32}$/.test(id)) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(LS_DEVICE, id);
    }
    return id;
  } catch {
    return null;
  }
}

function tz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Edmonton'; }
  catch { return 'America/Edmonton'; }
}

async function call(path, { method = 'GET', body, query } = {}) {
  if (!API) throw new Error('Nudge API not configured');
  const url = new URL(API + path);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Nudge API ${res.status}`);
  return res.json();
}

// ── Schedule derivation ──────────────────────────────────────────────────
// Turns app data into the flat list the server fires from.
export function buildSchedule({ appState, tasks, habits }) {
  const items = [];
  const daily = appState && appState.nudgeDailyTime;
  if (daily && /^\d{2}:\d{2}$/.test(daily)) {
    items.push({
      id: 'daily-log', kind: 'daily', label: 'Open the Hearth and log your day.',
      time: daily, days: [0, 1, 2, 3, 4, 5, 6], url: './?tab=hearth',
    });
  }
  for (const t of tasks || []) {
    if (t.completed || !t.remindAt) continue;
    const base = { id: `task-${t.id}`, kind: 'task', label: t.text, time: t.remindAt, url: `./?tab=tasks&task=${t.id}` };
    if (t.recurrence && t.recurrence.type === 'weekly' && t.recurrence.days && t.recurrence.days.length) {
      items.push({ ...base, days: [...t.recurrence.days] });
    } else if (t.dueDate) {
      items.push({ ...base, date: t.dueDate });
    }
  }
  for (const h of habits || []) {
    if (h.active === false || !h.remindAt) continue;
    items.push({
      id: `habit-${h.id}`, kind: 'habit', label: `${h.icon ? h.icon + ' ' : ''}${h.name}`,
      time: h.remindAt, days: [0, 1, 2, 3, 4, 5, 6], url: `./?tab=habits&habit=${h.id}`,
    });
  }
  return items;
}

export function scheduleHash(items) {
  return JSON.stringify(items);
}

// ── Push subscription ────────────────────────────────────────────────────
function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export async function currentSubscription() {
  if (!pushSupported) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Ask permission + subscribe. Returns the subscription or throws with a
// human-readable reason.
export async function subscribePush() {
  if (!pushSupported) throw new Error("This browser can't do push notifications.");
  if (!nudgesConfigured) throw new Error("Nudges aren't configured for this build.");
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    throw new Error(perm === 'denied'
      ? 'Notifications are blocked for this app in your browser settings.'
      : 'Permission not granted.');
  }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }
  return sub;
}

export async function unsubscribePush() {
  const sub = await currentSubscription();
  if (sub) await sub.unsubscribe();
}

// ── Server calls ─────────────────────────────────────────────────────────
// subscription: undefined = leave the server's copy alone; null = drop it.
export async function syncToServer({ schedule, subscription, name }) {
  const deviceId = getDeviceId();
  if (!deviceId) throw new Error('No device id');
  const payload = { deviceId, tz: tz(), schedule, name: name || deviceName() };
  if (subscription !== undefined) payload.subscription = subscription ? subscription.toJSON() : null;
  const res = await call('/api/sync', { method: 'POST', body: payload });
  try { localStorage.setItem(LS_LAST_SYNC, String(Date.now())); } catch { /* ignore */ }
  return res;
}

export async function fetchState() {
  const deviceId = getDeviceId();
  if (!deviceId) return { open: [], log: [], subscribed: false };
  return call('/api/state', { query: { deviceId } });
}

export async function answerNudge(nudgeId, answer) {
  const deviceId = getDeviceId();
  return call('/api/answer', { method: 'POST', body: { deviceId, nudgeId, answer } });
}

export async function sendTestNudge() {
  const deviceId = getDeviceId();
  return call('/api/test', { method: 'POST', body: { deviceId } });
}

export function lastSyncAt() {
  try { return Number(localStorage.getItem(LS_LAST_SYNC)) || 0; } catch { return 0; }
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Browser';
}

// Keep the OS badge in step with the open-nudge count.
export async function setBadge(count) {
  try {
    if (!('setAppBadge' in navigator)) return;
    if (count > 0) await navigator.setAppBadge(count); else await navigator.clearAppBadge();
  } catch { /* best-effort */ }
}
