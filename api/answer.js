// POST /api/answer { deviceId, nudgeId, answer } — did | later | skip | opened
import { cors, json, body, validDeviceId } from './_lib/http.js';
import { getDevice, putDevice } from './_lib/store.js';
import { answerNudge } from './_lib/schedule.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  const b = body(req);
  if (!validDeviceId(b.deviceId)) return json(res, 400, { error: 'bad deviceId' });
  const doc = await getDevice(b.deviceId);
  if (!doc) return json(res, 404, { error: 'unknown device' });
  const ok = answerNudge(doc, String(b.nudgeId || ''), String(b.answer || ''), Date.now());
  if (ok) await putDevice(doc);
  return json(res, 200, { ok, open: doc.open });
}
