// Device documents live in Vercel Blob (private). One JSON doc per device:
//   devices/<deviceId>.json
// When BLOB_READ_WRITE_TOKEN is absent (local testing) the same API is backed
// by plain files under NUDGE_STORE_DIR so the functions can be exercised with
// a node harness.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PREFIX = 'devices/';
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

async function blobLib() { return import('@vercel/blob'); }

function fileDir() {
  return process.env.NUDGE_STORE_DIR || path.join(process.cwd(), '.nudge-store');
}

export function emptyDevice(deviceId) {
  return {
    deviceId,
    name: '',
    tz: 'America/Edmonton',
    subscription: null,
    schedule: [],      // [{ id, kind, label, time, days?, date?, url }]
    open: [],          // fired, unanswered nudges
    log: [],           // answered / expired nudges (newest last)
    fired: {},         // "itemId@YYYY-MM-DD" -> firedAt (dedupe window ~7 days)
    lastTick: 0,
    updatedAt: 0,
  };
}

export async function getDevice(deviceId) {
  const key = PREFIX + deviceId + '.json';
  if (useBlob) {
    const { get } = await blobLib();
    try {
      const r = await get(key, { access: 'private', useCache: false });
      if (!r) return null;
      const text = await new Response(r.stream).text();
      return JSON.parse(text);
    } catch (err) {
      if (err?.name === 'BlobNotFoundError' || /not.?found/i.test(String(err?.message))) return null;
      throw err;
    }
  }
  try {
    const text = await fs.readFile(path.join(fileDir(), deviceId + '.json'), 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function putDevice(doc) {
  doc.updatedAt = Date.now();
  const key = PREFIX + doc.deviceId + '.json';
  const text = JSON.stringify(doc);
  if (useBlob) {
    const { put } = await blobLib();
    await put(key, text, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    });
    return;
  }
  await fs.mkdir(fileDir(), { recursive: true });
  await fs.writeFile(path.join(fileDir(), doc.deviceId + '.json'), text);
}

export async function listDeviceIds() {
  if (useBlob) {
    const { list } = await blobLib();
    const ids = [];
    let cursor;
    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 100 });
      for (const b of page.blobs) {
        const m = b.pathname.match(/^devices\/([a-f0-9]{32})\.json$/);
        if (m) ids.push(m[1]);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return ids;
  }
  try {
    const names = await fs.readdir(fileDir());
    return names.filter(n => /^[a-f0-9]{32}\.json$/.test(n)).map(n => n.slice(0, 32));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
