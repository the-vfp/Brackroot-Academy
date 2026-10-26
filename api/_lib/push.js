import webpush from 'web-push';

let configured = false;
// Env values are trimmed: a value pasted from a CRLF .env file once carried a
// trailing carriage return, which web-push rejects as "not a valid URL" and
// which took the whole function down before it could answer.
const env = (k, fallback = '') => (process.env[k] || fallback).trim();
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    env('VAPID_SUBJECT', 'mailto:addictedtopillows@gmail.com'),
    env('VAPID_PUBLIC_KEY'),
    env('VAPID_PRIVATE_KEY'),
  );
  configured = true;
}

// Send one nudge to a device. Returns 'ok', 'gone' (subscription dead — caller
// should drop it) or 'error'.
export async function sendNudge(subscription, nudge) {
  if (!subscription) return 'error';
  if (process.env.NUDGE_FAKE_PUSH) { return 'ok'; }
  const payload = JSON.stringify({
    title: titleFor(nudge),
    body: nudge.label,
    url: nudge.url,
    nudgeId: nudge.nudgeId,
    tag: `nudge-${nudge.itemId}`,
  });
  try {
    configure(); // inside the try: a misconfigured key must not 500 the endpoint
    await webpush.sendNotification(subscription, payload, { TTL: 6 * 3600, urgency: 'high' });
    return 'ok';
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) return 'gone';
    console.error('push failed', err.statusCode, err.body || err.message);
    return 'error';
  }
}

function titleFor(nudge) {
  if (nudge.kind === 'daily') return 'Brackroot · Daily log';
  if (nudge.kind === 'task') return nudge.refiredAt ? 'Brackroot · Still due' : 'Brackroot · Task due';
  if (nudge.kind === 'habit') return 'Brackroot · Habit';
  if (nudge.kind === 'test') return 'Brackroot · Test';
  return 'Brackroot';
}
