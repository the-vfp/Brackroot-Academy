// POST /api/sync — the app pushes its device's schedule (+ push subscription)
// whenever anything changes. Returns the current open nudges for the Hearth.
import { cors, json, body, validDeviceId } from './_lib/http.js';
import { getDevice, putDevice, emptyDevice } from './_lib/store.js';

const MAX_ITEMS = 200;

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  const b = body(req);
  if (!validDeviceId(b.deviceId)) return json(res, 400, { error: 'bad deviceId' });

  const doc = (await getDevice(b.deviceId)) || emptyDevice(b.deviceId);
  if (typeof b.tz === 'string' && b.tz.length < 64) doc.tz = b.tz;
  if (typeof b.name === 'string') doc.name = b.name.slice(0, 40);
  if (b.subscription === null) doc.subscription = null;
  else if (b.subscription && typeof b.subscription.endpoint === 'string') doc.subscription = b.subscription;
  if (Array.isArray(b.schedule)) {
    doc.schedule = b.schedule.slice(0, MAX_ITEMS).map(cleanItem).filter(Boolean);
    // Drop open nudges whose item no longer exists (task deleted / completed).
    const ids = new Set(doc.schedule.map(i => i.id));
    doc.open = doc.open.filter(o => ids.has(o.itemId) || o.kind === 'test');
  }
  await putDevice(doc);
  return json(res, 200, { ok: true, open: doc.open, subscribed: !!doc.subscription });
}

function cleanItem(i) {
  if (!i || typeof i.id !== 'string' || !/^\d{2}:\d{2}$/.test(i.time || '')) return null;
  const out = {
    id: i.id.slice(0, 64),
    kind: ['daily', 'task', 'habit'].includes(i.kind) ? i.kind : 'task',
    label: String(i.label || '').slice(0, 120),
    time: i.time,
    url: typeof i.url === 'string' ? i.url.slice(0, 200) : './',
  };
  if (/^\d{4}-\d{2}-\d{2}$/.test(i.date || '')) out.date = i.date;
  else if (Array.isArray(i.days)) out.days = i.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6);
  else return null;
  return out;
}
