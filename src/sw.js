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
    icon: appUrl('icons/icon-192.svg'),
    badge: appUrl('icons/icon-192.svg'),
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
  const { url, nudgeId } = event.notification.data || {};
  const target = new URL(appUrl(url));
  if (nudgeId) target.searchParams.set('nudge', nudgeId);
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Reuse an open window if there is one: navigate it rather than spawning
    // a second copy of the app.
    for (const c of all) {
      if ('navigate' in c) {
        try {
          await c.navigate(target.href);
          if ('focus' in c) await c.focus();
          return;
        } catch { /* fall through to openWindow */ }
      }
    }
    await self.clients.openWindow(target.href);
  })());
});

// If the browser rotates the subscription, the app re-syncs on next open
// (nudges.js checks getSubscription() against what it last sent).
self.addEventListener('pushsubscriptionchange', () => {});
