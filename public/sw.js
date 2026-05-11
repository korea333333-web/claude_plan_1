const CACHE_NAME = 'dalsaegim-v1';

// 오프라인 시 캐시할 핵심 리소스
const PRECACHE_URLS = [
  '/',
  '/icons/app-icon-1.png',
  '/icons/app-icon-2.png',
  '/icons/app-icon-3.png',
  '/icons/app-icon-4.png',
];

// 설치: 핵심 리소스 미리 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 네트워크 요청: Network First 전략 (API 제외)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API, auth 요청은 캐시하지 않음
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 응답만 캐시
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
