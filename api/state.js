// GET /api/state?deviceId= — open nudges + recent log for the app.
import { cors, json, validDeviceId } from './_lib/http.js';
import { getDevice } from './_lib/store.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const id = req.query?.deviceId;
  if (!validDeviceId(id)) return json(res, 400, { error: 'bad deviceId' });
  const doc = await getDevice(id);
  if (!doc) return json(res, 200, { open: [], log: [], subscribed: false });
  return json(res, 200, { open: doc.open, log: doc.log.slice(-60), subscribed: !!doc.subscription });
}
