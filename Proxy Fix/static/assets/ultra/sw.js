const CACHE_NAME = 'web-games-online-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/global.css',
  '/assets/css/container.css',
  '/assets/css/nav.css',
  '/assets/js/i.js',
  '/assets/js/c.js',
  '/assets/js/mv.js',
  '/favicon.png',
  '/assets/ultra/bundle.js',
  '/assets/ultra/config.js',
  '/assets/js/f.js',
  '/assets/ultra/sw.js',
];

// Install event to cache the static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event: Clear old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it, otherwise fetch from the network
      if (cachedResponse) {
        console.log(`Serving from cache: ${event.request.url}`);
        return cachedResponse;
      }

      // Otherwise, fetch the resource from the network
      return fetch(event.request).then((networkResponse) => {
        // Cache the new resource for future use
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }).catch((error) => {
      console.error('Fetching failed:', error);
      throw error;
    })
  );
});

// Optional: Background sync (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'your-sync-tag') {
    event.waitUntil(
      // Perform background sync actions here
    );
  }
});

// Push notifications (if required)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/favicon.png',
    badge: '/favicon.png',
  };

  event.waitUntil(
    self.registration.showNotification('New Notification', options)
  );
});
