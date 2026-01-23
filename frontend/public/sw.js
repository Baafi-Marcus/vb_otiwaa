// Basic Service Worker for PWA compliance
const CACHE_NAME = 'vb-otiwaa-cache-v1';

// SELF-DESTRUCT ON LOCALHOST
// If we are on localhost, we don't want the service worker to intercept anything
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    self.registration.unregister().then(() => {
        console.log('SW Self-Destructed on Localhost');
    });
}

const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo-black.png',
    '/logo-white.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip interception for development assets (Vite)
    if (event.request.url.includes('@vite') ||
        event.request.url.includes('@react-refresh') ||
        event.request.url.includes('localhost')) {
        return; // Let the browser handle these normally
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
