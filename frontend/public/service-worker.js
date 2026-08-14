const CACHE_NAME = 'experimind-ims-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker & clean up old caches
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

// Network First, fallback to Cache for seamless app experience
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and non-API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

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

          const isHtml = event.request.headers.get('accept')?.includes('text/html') || event.request.mode === 'navigate';
          if (isHtml) {
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
