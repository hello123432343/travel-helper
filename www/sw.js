// 여행 도우미 서비스 워커 - 오프라인 작동을 위한 캐싱
const CACHE = 'travel-helper-v1';
const FILES = [
  './',
  './travel-helper.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 오프라인 우선 전략
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(resp => {
        // 성공한 GET 요청은 캐시
        if (e.request.method === 'GET' && resp.ok && e.request.url.startsWith(self.location.origin)) {
          const cl = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return resp;
      }).catch(() => {
        // 오프라인 폴백
        if (e.request.mode === 'navigate') return caches.match('./travel-helper.html');
      });
    })
  );
});
