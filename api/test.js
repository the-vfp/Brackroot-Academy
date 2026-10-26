// POST /api/test { deviceId } — fire a test nudge right now (Settings button).
import { cors, json, body, validDeviceId } from './_lib/http.js';
import { getDevice, putDevice } from './_lib/store.js';
import { sendNudge } from './_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  const b = body(req);
  if (!validDeviceId(b.deviceId)) return json(res, 400, { error: 'bad deviceId' });
  const doc = await getDevice(b.deviceId);
  if (!doc) return json(res, 404, { error: 'unknown device' });
  if (!doc.subscription) return json(res, 200, { ok: false, reason: 'not subscribed' });
  const now = Date.now();
  doc.open = doc.open.filter(o => o.kind !== 'test');
  const nudge = {
    nudgeId: 'test-' + now.toString(36), itemId: 'test', kind: 'test',
    label: 'If you can read this, nudges work.', url: './?tab=hearth',
    dateStr: new Date(now).toISOString().slice(0, 10), firedAt: now,
    snoozeUntil: null, openedAt: null, laterCount: 0,
  };
  const r = await sendNudge(doc.subscription, nudge);
  if (r === 'gone') doc.subscription = null;
  else if (r === 'ok') doc.open.push(nudge);
  await putDevice(doc);
  return json(res, 200, { ok: r === 'ok', reason: r, open: doc.open });
}
