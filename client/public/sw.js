/* Roamly service worker: offline app shell and offline access to booking vouchers. */
const VERSION = 'roamly-v2';
const SHELL = ['/', '/index.html', '/roamly_logo.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const networkFirst = async (request) => {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build assets never change: cache first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((cache) => cache.put(request, copy));
      return res;
    })));
    return;
  }

  // Bookings and vouchers stay viewable without a connection (e.g. at a hotel desk).
  if (url.pathname.startsWith('/api/bookings/') || url.pathname === '/api/auth/session') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) return;

  // Page navigations: try the network, fall back to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
  }
});
