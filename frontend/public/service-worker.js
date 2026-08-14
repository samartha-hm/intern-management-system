const CACHE_NAME = 'experimind-ims-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install Service Worker & cache critical PWA shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker & aggressively clean up all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network First for all requests, fallback to Cache for offline app experience
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // HTML Navigation requests should NEVER be served from stale cache if network is available
  const isHtmlNavigation = event.request.headers.get('accept')?.includes('text/html') || event.request.mode === 'navigate';

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache)).catch(() => {});
        }
        return response;
      } catch (err) {
        try {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          if (isHtmlNavigation) {
            const indexCached = await caches.match('/index.html');
            if (indexCached) return indexCached;
          }
        } catch (e) {
          // Ignore cache errors
        }

        return new Response(
          '<!DOCTYPE html><html><head><title>Offline</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Network Unavailable</h2><p>Please check your connection and refresh.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
      }
    })()
  );
});
