// Brackroot service worker (vite-plugin-pwa injectManifest).
// Precaching + offline navigation as before, plus push nudges.
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Resolve an app-relative URL ('./?tab=tasks&task=3') against the SW scope so
// it works on GitHub Pages (/Brackroot-Academy/) and on Vercel (/) alike.
function appUrl(rel) {
  return new URL(rel || './', self.registration.scope).href;
}

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Brackroot';
  const options = {
    body: data.body || '',
    tag: data.tag || 'brackroot-nudge',
    renotify: true,
    // Android won't render SVG here: PNG icon, and a monochrome PNG badge
    // (the status-bar glyph is drawn from the badge's alpha channel).
    icon: appUrl('icons/icon-192.png'),
    badge: appUrl('icons/badge-96.png'),
    data: { url: data.url || './', nudgeId: data.nudgeId || null },
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try {
      if ('setAppBadge' in navigator) {
        const open = await self.registration.getNotifications();
        await navigator.setAppBadge(Math.max(1, open.length));
      }
    } catch { /* badge is best-effort */ }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let href;
  try {
    const { url, nudgeId } = event.notification.data || {};
    const target = new URL(appUrl(url));
    if (nudgeId) target.searchParams.set('nudge', nudgeId);
    href = target.href;
  } catch {
    href = self.registration.scope;
  }
  event.waitUntil((async () => {
    // Android: focus() has to come FIRST, while the tap's user activation is
    // still live — focusing after an awaited navigate() silently does nothing.
    // Anything that fails falls through to openWindow, which always brings
    // the installed app up.
    try {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const scope = self.registration.scope;
      const client = all.find(c => c.url && c.url.startsWith(scope)) || all[0];
      if (client) {
        let focused = null;
        try { focused = await client.focus(); } catch { focused = null; }
        if (focused) {
          try { await focused.navigate(href); return; } catch { /* fall through */ }
        }
      }
    } catch { /* fall through */ }
    try {
      await self.clients.openWindow(href);
    } catch {
      // Last resort: the bare scope is always openable.
      await self.clients.openWindow(self.registration.scope);
    }
  })());
});

// Clearing a notification by swiping shouldn't leave a stale badge count.
self.addEventListener('notificationclose', (event) => {
  event.waitUntil((async () => {
    try {
      if (!('setAppBadge' in navigator)) return;
      const open = await self.registration.getNotifications();
      if (open.length === 0) await navigator.clearAppBadge();
      else await navigator.setAppBadge(open.length);
    } catch { /* best-effort */ }
  })());
});

// If the browser rotates the subscription, the app re-syncs on next open
// (nudges.js checks getSubscription() against what it last sent).
self.addEventListener('pushsubscriptionchange', () => {});
