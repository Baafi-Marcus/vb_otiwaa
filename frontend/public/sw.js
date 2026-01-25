// Service Worker with Network-First strategy for navigation
const CACHE_NAME = 'vb-otiwaa-cache-v2'; // Bumped version to force update

// SELF-DESTRUCT ON LOCALHOST
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    self.registration.unregister().then(() => {
        console.log('SW Self-Destructed on Localhost');
    });
}

const STATIC_ASSETS = [
    '/manifest.json',
    '/logo-black.png',
    '/logo-white.png'
];

self.addEventListener('install', (event) => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Delete old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Skip interception for development assets
    if (event.request.url.includes('@vite') ||
        event.request.url.includes('@react-refresh') ||
        event.request.url.includes('localhost')) {
        return;
    }

    // Network-First strategy for navigation requests (HTML pages)
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone and cache the response for offline fallback
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-First strategy for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
