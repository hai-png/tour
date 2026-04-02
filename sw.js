/**
 * Service Worker for HAI PNG Virtual Tour PWA
 * ============================================================
 * Modern PWA implementation with intelligent caching, offline support,
 * and background sync capabilities.
 * 
 * Version: 7.0.0 - Complete Revamp
 */

// Cache versioning
const CACHE_VERSION = 'v7';
const CACHE_NAMES = {
  static: `hai-tour-static-${CACHE_VERSION}`,
  media: `hai-tour-media-${CACHE_VERSION}`,
  cdn: `hai-tour-cdn-${CACHE_VERSION}`,
  offline: `hai-tour-offline-${CACHE_VERSION}`,
  runtime: `hai-tour-runtime-${CACHE_VERSION}`
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './css/styles.css',
  './css/ui-components.css',
  './css/responsive.css',
  './css/mobile-fixes.css',
  './css/pwa.css',
  './js/main.js',
  './js/PWAManager.js',
  './js/UIManager.js',
  './js/HotspotManager.js',
  './js/FloorPlanManager.js',
  './js/GuidedTourManager.js',
  './js/VRModeManager.js'
];

// CDN assets for offline support
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  cacheFirst: [
    /^\/css\//,
    /^\/js\//,
    /^\/media\/tdv-import\/skin\//,
    /\/font-awesome\//,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/
  ],
  networkFirst: [
    /^\/media\/tdv-import\/panorama_/,
    /^\/media\/tdv-import\/hotspots\//,
    /^\/floor-plan\//,
    /^\/gallery\//
  ],
  staleWhileRevalidate: [
    /project\.json$/,
    /hotspots\.json$/,
    /floor-plan-config\.json$/
  ]
};

// Cache limits
const CACHE_LIMITS = {
  maxItems: 5000,
  maxMediaSize: 1 * 1024 * 1024 * 1024, // 1GB
  maxAge: {
    static: 30 * 24 * 60 * 60,  // 30 days
    media: 90 * 24 * 60 * 60,   // 90 days
    cdn: 30 * 24 * 60 * 60      // 30 days
  }
};

// Installation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + CACHE_VERSION);
  
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.static)
        .then(cache => {
          console.log('[SW] Caching static assets...');
          return cache.addAll(STATIC_ASSETS).catch(err => {
            console.warn('[SW] Some static assets failed to cache:', err);
          });
        }),
      
      // Cache CDN assets
      caches.open(CACHE_NAMES.cdn)
        .then(cache => {
          console.log('[SW] Caching CDN assets...');
          return cache.addAll(CDN_ASSETS).catch(err => {
            console.warn('[SW] Some CDN assets failed to cache:', err);
          });
        }),
      
      // Cache offline page
      caches.open(CACHE_NAMES.offline)
        .then(cache => {
          console.log('[SW] Caching offline page...');
          return cache.addAll(['./offline.html']).catch(err => {
            console.warn('[SW] Offline page failed to cache:', err);
          });
        })
    ])
      .then(() => {
        console.log('[SW] Installation complete');
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_INSTALLED',
              message: 'Service worker installed',
              version: CACHE_VERSION
            });
          });
        });
      })
      .catch(err => {
        console.error('[SW] Installation error:', err);
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  const currentCaches = Object.values(CACHE_NAMES);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              const isOldCache = !currentCaches.includes(name) &&
                                 (name.startsWith('hai-tour-') || name.startsWith('hai-tour-v'));
              if (isOldCache) {
                console.log('[SW] Deleting old cache:', name);
              }
              return isOldCache;
            })
            .map(name => caches.delete(name))
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

// Fetch handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine caching strategy
  const strategy = getCacheStrategy(url);
  
  if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'network-first') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'stale-while-revalidate') {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Default strategy based on origin
    if (url.origin === self.location.origin) {
      event.respondWith(cacheFirst(request));
    } else if (CDN_ASSETS.some(cdn => url.href.includes(cdn))) {
      event.respondWith(cacheFirst(request, CACHE_NAMES.cdn));
    } else {
      event.respondWith(networkFirst(request));
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
async function cacheFirst(request, cacheName = CACHE_NAMES.static) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached response and update in background
      eventWaitUntil(updateCache(request, cacheName));
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('./offline.html');
    }

    throw error;
  }
}

/**
 * Network-First Strategy
 * Best for: Dynamic content (panoramas, floor plans, galleries)
 */
async function networkFirst(request, cacheName = CACHE_NAMES.media) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());

      // Enforce cache size limits
      await enforceCacheSizeLimit(cacheName);
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
      return caches.match('./offline.html');
    }

    throw error;
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Best for: Configuration files that update occasionally
 */
async function staleWhileRevalidate(request, cacheName = CACHE_NAMES.static) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always fetch from network in background
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.warn('[SW] Stale-while-revalidate network fetch failed:', error);
    });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Update cache in background
 */
async function updateCache(request, cacheName) {
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
async function enforceCacheSizeLimit(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length <= CACHE_LIMITS.maxItems) {
      return;
    }
    
    // Delete oldest entries
    const itemsToDelete = keys.slice(0, keys.length - CACHE_LIMITS.maxItems + 100);
    await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    
    console.log('[SW] Evicted', itemsToDelete.length, 'old cache entries');
  } catch (error) {
    console.error('[SW] Cache size enforcement failed:', error);
  }
}

/**
 * Helper for event.waitUntil
 */
function eventWaitUntil(promise) {
  if (typeof event !== 'undefined' && event.waitUntil) {
    event.waitUntil(promise);
  }
}

// Message handling
self.addEventListener('message', (event) => {
  const { data, ports } = event;
  
  if (!data || !data.type) {
    return;
  }
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHE_NAMES.static)
          .then(cache => cache.addAll(data.urls))
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        Promise.all([
          caches.delete(CACHE_NAMES.static),
          caches.delete(CACHE_NAMES.media),
          caches.delete(CACHE_NAMES.cdn),
          caches.delete(CACHE_NAMES.offline),
          caches.delete(CACHE_NAMES.runtime)
        ]).then(() => {
          ports[0]?.postMessage({ success: true });
        })
      );
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then(status => {
          ports[0]?.postMessage(status);
        })
      );
      break;
      
    case 'PRECACHE_MEDIA':
      event.waitUntil(precacheMedia(data.urls, data.port));
      break;
      
    case 'CACHE_ALL_MEDIA':
      event.waitUntil(cacheAllMedia(data.urls, data.port));
      break;
      
    case 'GET_OFFLINE_STATUS':
      event.waitUntil(
        getOfflineStatus().then(status => {
          ports[0]?.postMessage(status);
        })
      );
      break;
      
    case 'DELETE_CACHE_URLS':
      event.waitUntil(
        deleteCacheUrls(data.urls, data.cacheName)
      );
      break;
  }
});

/**
 * Get cache status for diagnostics
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    if (!name.startsWith('hai-tour-')) {
      continue;
    }
    
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    // Estimate size
    let estimatedSize = 0;
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        estimatedSize += blob.size;
      }
    }
    
    status[name] = {
      itemCount: keys.length,
      estimatedSize: estimatedSize
    };
  }
  
  return status;
}

/**
 * Get offline cache status
 */
async function getOfflineStatus() {
  try {
    const mediaCache = await caches.open(CACHE_NAMES.media);
    const mediaKeys = await mediaCache.keys();
    
    const staticCache = await caches.open(CACHE_NAMES.static);
    const staticKeys = await staticCache.keys();
    
    const cdnCache = await caches.open(CACHE_NAMES.cdn);
    const cdnKeys = await cdnCache.keys();
    
    const totalItems = mediaKeys.length + staticKeys.length + cdnKeys.length;
    
    // Estimate size
    let estimatedSize = 0;
    for (const key of mediaKeys) {
      estimatedSize += 500 * 1024; // Assume 500KB per media item
    }
    for (const key of staticKeys) {
      estimatedSize += 50 * 1024; // Assume 50KB per static item
    }
    
    return {
      mediaCount: mediaKeys.length,
      staticCount: staticKeys.length,
      cdnCount: cdnKeys.length,
      totalCount: totalItems,
      estimatedSize: estimatedSize,
      isReadyForOffline: mediaKeys.length > 10,
      version: CACHE_VERSION
    };
  } catch (error) {
    console.error('[SW] Failed to get offline status:', error);
    return {
      mediaCount: 0,
      staticCount: 0,
      cdnCount: 0,
      totalCount: 0,
      estimatedSize: 0,
      isReadyForOffline: false,
      error: error.message,
      version: CACHE_VERSION
    };
  }
}

/**
 * Precache media files in background
 */
async function precacheMedia(urls, port) {
  const cache = await caches.open(CACHE_NAMES.media);
  let cached = 0;
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
        cached++;
        
        if (port) {
          port.postMessage({
            type: 'CACHE_PROGRESS',
            cached: cached,
            total: urls.length,
            url: url,
            percent: Math.round((cached / urls.length) * 100)
          });
        }
      }
    } catch (error) {
      console.warn('[SW] Failed to precache:', url, error);
    }
  }
  
  if (port) {
    port.postMessage({
      type: 'CACHE_COMPLETE',
      cached: cached,
      total: urls.length,
      percent: 100
    });
  }
}

/**
 * Cache ALL media files for full offline access
 */
async function cacheAllMedia(urls, port) {
  const cache = await caches.open(CACHE_NAMES.media);
  let cached = 0;
  let failed = 0;
  const results = [];
  
  console.log(`[SW] Starting full offline cache: ${urls.length} items`);
  
  if (port) {
    port.postMessage({
      type: 'CACHE_START',
      total: urls.length
    });
  }
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      
      if (response.ok) {
        const clonedResponse = response.clone();
        await cache.put(url, clonedResponse);
        cached++;
        results.push({ url, success: true });
        
        console.log(`[SW] Cached: ${url} (${cached}/${urls.length})`);
      } else {
        failed++;
        results.push({ url, success: false, error: `HTTP ${response.status}` });
      }
    } catch (error) {
      failed++;
      results.push({ url, success: false, error: error.message });
      console.warn(`[SW] Failed to cache: ${url}`, error);
    }
    
    // Report progress
    if (port) {
      port.postMessage({
        type: 'CACHE_PROGRESS',
        cached: cached,
        failed: failed,
        total: urls.length,
        url: url,
        percent: Math.round(((cached + failed) / urls.length) * 100),
        current: cached + failed,
        results: results.slice(-1)[0]
      });
    }
    
    // Small delay to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Enforce cache size limits
  await enforceCacheSizeLimit(CACHE_NAMES.media);
  
  // Final report
  const finalStatus = {
    type: 'CACHE_COMPLETE',
    cached: cached,
    failed: failed,
    total: urls.length,
    percent: 100,
    successRate: Math.round((cached / urls.length) * 100),
    results: results
  };
  
  console.log(`[SW] Offline cache complete: ${cached}/${urls.length} items cached`);
  
  if (port) {
    port.postMessage(finalStatus);
  }
  
  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'OFFLINE_CACHE_COMPLETE',
      ...finalStatus
    });
  });
}

/**
 * Delete specific URLs from cache
 */
async function deleteCacheUrls(urls, cacheName = CACHE_NAMES.media) {
  try {
    const cache = await caches.open(cacheName);
    
    for (const url of urls) {
      await cache.delete(url);
    }
    
    console.log('[SW] Deleted', urls.length, 'URLs from cache');
  } catch (error) {
    console.error('[SW] Failed to delete cache URLs:', error);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-capture') {
    event.waitUntil(syncCaptures());
  }
});

async function syncCaptures() {
  console.log('[SW] Syncing captures...');
  // Handle syncing captured images when back online
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New update available',
    icon: '/media/tdv-import/skin/logo.png',
    badge: '/media/tdv-import/skin/logo.png',
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

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[SW] Service Worker v' + CACHE_VERSION + ' loaded');
