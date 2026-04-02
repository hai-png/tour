/**
 * Service Worker for HAI PNG Virtual Tour PWA
 * ============================================================
 * Provides offline support, caching strategies, and PWA functionality
 * for mobile and desktop deployment.
 */

const CACHE_VERSION = 'v5';
const CACHE_NAME = `hai-tour-static-${CACHE_VERSION}`;
const MEDIA_CACHE_NAME = `hai-tour-media-${CACHE_VERSION}`;
const CDN_CACHE_NAME = `hai-tour-cdn-${CACHE_VERSION}`;

// Core static assets (cached immediately on install)
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/ui-components.css',
  './js/main.js',
  './js/PanoramaViewer.js',
  './js/UIManager.js',
  './js/HotspotManager.js',
  './js/FloorPlanManager.js',
  './js/GuidedTourManager.js',
  './js/LocationManager.js',
  './js/TranslationManager.js',
  './js/GalleryManager.js',
  './js/AudioManager.js',
  './js/CaptureViewManager.js',
  './js/PWAManager.js',
  './js/VRModeManager.js',
  './manifest.json',
  './offline.html',
  './media/tdv-import/skin/logo.png',
  './media/tdv-import/skin/logo.webp'
];

// External CDN URLs to cache for offline support
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// URL patterns for different caching strategies
const CACHE_STRATEGIES = {
  // Cache-first: Best for static assets that rarely change
  cacheFirst: [
    /^\/css\//,
    /^\/js\//,
    /^\/media\/tdv-import\/skin\//,
    /\/font-awesome\//,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/
  ],
  
  // Network-first: Best for dynamic content
  networkFirst: [
    /^\/media\/tdv-import\/panorama_/,
    /^\/media\/tdv-import\/hotspots\//,
    /^\/floor-plan\//,
    /^\/gallery\//
  ],
  
  // Stale-while-revalidate: Best for content that updates occasionally
  staleWhileRevalidate: [
    /project\.json$/,
    /hotspots\.json$/,
    /floor-plan-config\.json$/
  ]
};

// Maximum cache size for media files (prevent unlimited growth)
const MAX_MEDIA_CACHE_SIZE = 500 * 1024 * 1024; // 500MB

// Maximum age for cached items (in seconds)
const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60, // 7 days
  media: 30 * 24 * 60 * 60, // 30 days
  cdn: 30 * 24 * 60 * 60    // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  self.skipWaiting(); // Activate immediately

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Caching static assets');
          return cache.addAll(STATIC_ASSETS).catch(err => {
            console.warn('[SW] Some static assets failed to cache:', err);
          });
        }),
      // Cache CDN assets
      caches.open(CDN_CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Caching CDN assets');
          return cache.addAll(CDN_ASSETS).catch(err => {
            console.warn('[SW] Some CDN assets failed to cache:', err);
          });
        })
    ])
      .then(() => {
        console.log('[SW] Installation complete');
      })
      .catch((error) => {
        console.error('[SW] Installation error:', error);
      })
  );
});

// Activate event - clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  const currentCaches = [CACHE_NAME, MEDIA_CACHE_NAME, CDN_CACHE_NAME];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old cache versions
              const isOldCache = !currentCaches.includes(name) && 
                                 (name.startsWith('hai-tour-') || name.startsWith('hai-tour-v'));
              if (isOldCache) {
                console.log('[SW] Deleting old cache:', name);
              }
              return isOldCache;
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients about activation
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_ACTIVATED' });
          });
        });
      })
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on URL pattern
  const strategy = getCacheStrategy(url);

  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'network-first') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'stale-while-revalidate') {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default: cache-first for same-origin, network-first for CDN
    if (url.origin === self.location.origin) {
      event.respondWith(cacheFirst(request));
    } else if (CDN_ASSETS.some(cdn => url.href.includes(cdn))) {
      event.respondWith(cacheFirst(request, CDN_CACHE_NAME));
    }
  }
});

/**
 * Determine caching strategy based on URL pattern
 */
function getCacheStrategy(url) {
  const href = url.href;
  const pathname = url.pathname;

  // Check cache-first patterns
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(href) || pattern.test(pathname)) {
      return 'cache-first';
    }
  }

  // Check network-first patterns
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(href) || pattern.test(pathname)) {
      return 'network-first';
    }
  }

  // Check stale-while-revalidate patterns
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(href) || pattern.test(pathname)) {
      return 'stale-while-revalidate';
    }
  }

  return null;
}

/**
 * Cache-First Strategy
 * Best for: Static assets (CSS, JS, fonts, logos)
 */
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update in background
    eventWaitUntil(updateCache(request, cacheName));
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
  }
}

/**
 * Network-First Strategy
 * Best for: Dynamic content (panoramas, floor plans, galleries)
 */
async function networkFirst(request, cacheName = MEDIA_CACHE_NAME) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      // Enforce cache size limits
      await enforceCacheSizeLimit(cacheName, MAX_MEDIA_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network-first failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Best for: Configuration files that update occasionally
 */
async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always fetch from network in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.warn('[SW] Stale-while-revalidate network fetch failed:', error);
    });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Update cache in background
 */
async function updateCache(request, cacheName = CACHE_NAME) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response);
    }
  } catch (error) {
    // Network error - ignore for background updates
  }
}

/**
 * Enforce cache size limits
 */
async function enforceCacheSizeLimit(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length === 0) return;
    
    // Estimate current cache size (simplified)
    // In production, you might want to use the Cache Storage API more precisely
    if (keys.length > 1000) { // Simple limit: max 1000 items
      const oldestKey = keys[0];
      await cache.delete(oldestKey);
      console.log('[SW] Evicted old cache entry to maintain size limit');
    }
  } catch (error) {
    console.error('[SW] Cache size enforcement failed:', error);
  }
}

// Helper for event.waitUntil that doesn't block
function eventWaitUntil(promise) {
  if (typeof event !== 'undefined' && event.waitUntil) {
    event.waitUntil(promise);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAME),
        caches.delete(MEDIA_CACHE_NAME),
        caches.delete(CDN_CACHE_NAME)
      ]).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      getCacheStatus().then((status) => {
        event.ports[0]?.postMessage(status);
      })
    );
  }

  if (event.data && event.data.type === 'PRECACHE_MEDIA') {
    event.waitUntil(precacheMedia(event.data.urls));
  }
});

/**
 * Get cache status for diagnostics
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = {
      itemCount: keys.length,
      estimatedSize: keys.length * 100 * 1024 // Rough estimate
    };
  }

  return status;
}

/**
 * Precache media files in background
 */
async function precacheMedia(urls) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
      }
    } catch (error) {
      console.warn('[SW] Failed to precache:', url, error);
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-capture') {
    event.waitUntil(syncCaptures());
  }
});

async function syncCaptures() {
  // Handle syncing captured images when back online
  console.log('[SW] Syncing captures...');
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New update available',
    icon: 'media/tdv-import/skin/logo.png',
    badge: 'media/tdv-import/skin/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('HAI PNG Virtual Tour', options)
  );
});
