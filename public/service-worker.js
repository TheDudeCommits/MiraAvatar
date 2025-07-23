// Service Worker for aggressive frame caching
const CACHE_NAME = 'mira-frames-v1';
const FRAMES_TO_CACHE = [];

// Generate list of all frame URLs
for (let i = 0; i < 350; i++) {
  const frameNumber = String(i).padStart(4, '0');
  FRAMES_TO_CACHE.push(`/mira_frames_optimized/frame_${frameNumber}.jpg`);
}

self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle Mira frame requests
  if (event.request.url.includes('/mira_frames_optimized/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(networkResponse => {
            // Cache the response for future requests
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
});