// Shared HTTP helpers for the nudge API (Vercel Node functions, ESM).

// Origins allowed to call the API from the browser. GitHub Pages is the live
// install; the Vercel domain itself is the fallback host; localhost is for
// vite preview during development.
const ALLOWED_ORIGINS = [
  'https://the-vfp.github.io',
  'https://brackroot.vercel.app',
  'http://localhost:4173',
  'http://localhost:5173',
];

export function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || /^https:\/\/brackroot[-a-z0-9]*\.vercel\.app$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Nudge-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).end(JSON.stringify(body));
}

// Vercel parses JSON bodies for Node functions; be defensive in case it's a string.
export function body(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch { return {}; } }
  return b;
}

// Device ids are 32 hex chars generated client-side; they double as the
// bearer credential for that device's own document.
export function validDeviceId(id) {
  return typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
}

// Admin endpoints (tick, log) take the shared key via header or ?key=.
export function isAdmin(req) {
  const key = process.env.NUDGE_ADMIN_KEY;
  if (!key) return false;
  const given = req.headers['x-nudge-key'] || req.query?.key;
  return typeof given === 'string' && given.length === key.length && timingSafeEqual(given, key);
}

function timingSafeEqual(a, b) {
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
