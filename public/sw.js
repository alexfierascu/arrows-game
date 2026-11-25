// Service worker: lets the game open without a connection and shows the daily reminder.
//
// Files come from the network whenever it answers, so a new version is never held back; the
// copy kept here is only used when the network fails. The leaderboard API is never cached.

const FILES = 'ae-files-v1';
const REMINDER = 'ae-reminder'; // the reminder's texts in the player's language, saved by the page (js/pwa.js)
const DEFAULT_REMINDER = { title: 'Arrows Escape', body: 'Today’s daily challenge is waiting.' };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// The page lists the files it loaded before this worker took over, so the first visit is
// already enough to play offline.
self.addEventListener('message', event => {
  const urls = event.data && event.data.cache;
  if (Array.isArray(urls)) event.waitUntil(caches.open(FILES).then(cache => Promise.allSettled(urls.map(url => cache.add(url)))));
});

async function fromNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(FILES)).put(request, response.clone());
    return response;
  } catch (offline) {
    const kept = await caches.match(request, { ignoreSearch: true });
    if (kept) return kept;
    if (request.mode === 'navigate') return (await caches.match('/')) || Response.error();
    throw offline;
  }
}

self.addEventListener('fetch', event => {
  const { request } = event, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fromNetworkFirst(request));
});

// The server's push carries no text (see src/webpush.js): it only says "remind now".
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const saved = await (await caches.open(REMINDER)).match('/reminder-text');
    const { title, body } = saved ? await saved.json() : DEFAULT_REMINDER;
    await self.registration.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'daily' });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window' });
    return open.length ? open[0].focus() : self.clients.openWindow('/');
  })());
});
