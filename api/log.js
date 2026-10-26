// GET /api/log — the accountability record, for Claude to read in a session.
import { cors, json, isAdmin } from './_lib/http.js';
import { getDevice, listDeviceIds } from './_lib/store.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!isAdmin(req)) return json(res, 401, { error: 'nope' });
  const days = Math.min(365, Math.max(1, Number(req.query?.days) || 30));
  const cutoff = Date.now() - days * 86400000;
  const devices = [];
  for (const id of await listDeviceIds()) {
    const doc = await getDevice(id);
    if (!doc) continue;
    devices.push({
      device: doc.name || id.slice(0, 6),
      tz: doc.tz,
      subscribed: !!doc.subscription,
      lastTick: doc.lastTick ? new Date(doc.lastTick).toISOString() : null,
      schedule: doc.schedule,
      open: doc.open,
      log: doc.log.filter(l => l.firedAt >= cutoff),
    });
  }
  return json(res, 200, { days, devices });
}
