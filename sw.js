// Offline support: keeps a copy of the course and fonts so the app opens without internet.
// The page itself is refreshed in the background whenever you're online, so updates arrive on the next open.
const CACHE = 'ensld-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  // stale-while-revalidate: answer from cache instantly, refresh the cache from the network
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const hit = await c.match(key, {ignoreSearch: req.mode === 'navigate'});
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
