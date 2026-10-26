// GET /api/tick — called every few minutes by the GitHub Actions cron.
// Advances every device, sends the pushes that came due, records them.
import { cors, json, isAdmin } from './_lib/http.js';
import { getDevice, putDevice, listDeviceIds } from './_lib/store.js';
import { tickDevice } from './_lib/schedule.js';
import { sendNudge } from './_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!isAdmin(req)) return json(res, 401, { error: 'nope' });
  const now = Date.now();
  const report = [];
  for (const id of await listDeviceIds()) {
    const doc = await getDevice(id);
    if (!doc) continue;
    const { toPush } = tickDevice(doc, now);
    let sent = 0, gone = false;
    for (const n of toPush) {
      const r = await sendNudge(doc.subscription, n);
      if (r === 'ok') sent++;
      if (r === 'gone') gone = true;
    }
    if (gone) doc.subscription = null;
    await putDevice(doc);
    report.push({ device: doc.name || id.slice(0, 6), fired: toPush.length, sent, open: doc.open.length, subscribed: !!doc.subscription });
  }
  return json(res, 200, { ok: true, at: new Date(now).toISOString(), devices: report });
}
