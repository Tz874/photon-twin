/* PHOTON // TWIN · Service Worker
   策略：首次访问把所有资源抓进 cache，之后完全走 cache（离线优先）。
   版本号改动会触发重新缓存。 */
const VER = 'photon-twin-v10';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VER);
    await c.addAll(CORE).catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(VER);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;                       // 离线优先
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') c.put(req, res.clone());
      return res;
    } catch (err) {
      // 完全离线且没缓存时，回退到首页
      return (await c.match('./index.html')) || new Response('offline', { status: 503 });
    }
  })());
});
