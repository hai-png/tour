/**
 * Service Worker for HAI PNG Virtual Tour PWA
 * ============================================================
 * Full offline-first: precaches ALL media on first boot so the
 * entire tour works offline with zero additional download steps.
 *
 * Version: 11.0.0
 */

const CACHE_VERSION = 'v11';
const CACHE_NAMES = {
  shell:  `hai-tour-shell-${CACHE_VERSION}`,
  cdn:    `hai-tour-cdn-${CACHE_VERSION}`,
  media:  `hai-tour-media-${CACHE_VERSION}`,
  offline:`hai-tour-offline-${CACHE_VERSION}`,
};

// ── App Shell (precached on install) ──────────────────────────
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  // CSS
  './css/styles.css',
  './css/ui-components.css',
  './css/responsive.css',
  './css/mobile-fixes.css',
  './css/pwa.css',
  // JS — every file referenced by index.html
  './js/main.js',
  './js/PWAManager.js',
  './js/UIManager.js',
  './js/HotspotManager.js',
  './js/FloorPlanManager.js',
  './js/GuidedTourManager.js',
  './js/VRModeManager.js',
  './js/CaptureViewManager.js',
  './js/AudioManager.js',
  './js/GalleryManager.js',
  './js/LocationManager.js',
  './js/TranslationManager.js',
  './js/PanoramaViewer.js',
];

// ── CDN assets ────────────────────────────────────────────────
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
];

// ── Installation ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v' + CACHE_VERSION);
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      const [shellCache, cdnCache, offlineCache] = await Promise.all([
        caches.open(CACHE_NAMES.shell),
        caches.open(CACHE_NAMES.cdn),
        caches.open(CACHE_NAMES.offline),
      ]);

      await Promise.allSettled([
        shellCache.addAll(SHELL_ASSETS),
        cdnCache.addAll(CDN_ASSETS),
        offlineCache.addAll(['./offline.html']),
      ]);

      console.log('[SW] Shell + CDN precached');
    })()
  );
});

// ── Activation (old cache cleanup) ────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v' + CACHE_VERSION);
  const keep = new Set(Object.values(CACHE_NAMES));

  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(n => n.startsWith('hai-tour-') && !keep.has(n))
          .map(n => { console.log('[SW] Deleting old cache:', n); return caches.delete(n); })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // CDN assets → cache-first from cdn cache
  if (CDN_ASSETS.some(c => url.href.includes(c))) {
    event.respondWith(fromCacheOrNetwork(request, CACHE_NAMES.cdn));
    return;
  }

  // Same-origin → try cache, fall back to network, then offline page
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            const cacheName = isMediaUrl(url.pathname) ? CACHE_NAMES.media : CACHE_NAMES.shell;
            caches.open(cacheName).then(c => c.put(request, clone));
          }
          return response;
        }).catch(() => {
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./offline.html');
          }
          throw new Error('Offline');
        });
      })
    );
    return;
  }

  // Everything else → network-first
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAMES.shell).then(c => c.put(request, response.clone()));
      }
      return response;
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match('./offline.html');
      throw new Error('Offline');
    })
  );
});

function isMediaUrl(pathname) {
  return /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|ogg)$/i.test(pathname);
}

// ── Cache-First helper ────────────────────────────────────────
async function fromCacheOrNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match('./offline.html');
  }
}

// ── Message handling ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data?.type) return;

  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        Promise.all(Object.values(CACHE_NAMES).map(n => caches.delete(n)))
          .then(() => event.ports[0]?.postMessage({ success: true }))
      );
      break;

    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(s => event.ports[0]?.postMessage(s)));
      break;

    case 'PRECACHE_MEDIA':
      event.waitUntil(precacheMedia(data.urls, event.ports[0]));
      break;

    case 'GET_OFFLINE_STATUS':
      event.waitUntil(getOfflineStatus().then(s => event.ports[0]?.postMessage(s)));
      break;

    case 'DELETE_CACHE_URLS':
      event.waitUntil(deleteCacheUrls(data.urls, data.cacheName));
      break;
  }
});

// ── Precache ALL media (called by PWAManager on first boot) ───
async function precacheMedia(urls, port) {
  const cache = await caches.open(CACHE_NAMES.media);
  let cached = 0, failed = 0;
  const total = urls.length;

  console.log(`[SW] Precaching ${total} media items…`);

  port?.postMessage({ type: 'CACHE_START', total });

  for (const url of urls) {
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (resp.ok) {
        await cache.put(url, resp.clone());
        cached++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    port?.postMessage({
      type: 'CACHE_PROGRESS',
      cached, failed, total,
      percent: Math.round(((cached + failed) / total) * 100),
      url,
    });

    // Yield to avoid blocking the main thread
    if ((cached + failed) % 10 === 0) {
      await new Promise(r => setTimeout(r, 10));
    }
  }

  const result = {
    type: 'CACHE_COMPLETE',
    cached, failed, total,
    percent: 100,
    successRate: total ? Math.round((cached / total) * 100) : 0,
  };

  console.log(`[SW] Precache complete: ${cached}/${total}`);
  port?.postMessage(result);

  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'OFFLINE_CACHE_COMPLETE', ...result }));
}

// ── Cache status helpers ──────────────────────────────────────
async function getCacheStatus() {
  const status = {};
  for (const name of Object.values(CACHE_NAMES)) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = { itemCount: keys.length };
  }
  return status;
}

async function getOfflineStatus() {
  try {
    const [media, shell, cdn] = await Promise.all([
      caches.open(CACHE_NAMES.media),
      caches.open(CACHE_NAMES.shell),
      caches.open(CACHE_NAMES.cdn),
    ]);
    const [mediaKeys, shellKeys, cdnKeys] = await Promise.all([
      media.keys(), shell.keys(), cdn.keys(),
    ]);

    return {
      mediaCount: mediaKeys.length,
      staticCount: shellKeys.length,
      cdnCount: cdnKeys.length,
      totalCount: mediaKeys.length + shellKeys.length + cdnKeys.length,
      isReadyForOffline: mediaKeys.length > 0,
      version: CACHE_VERSION,
    };
  } catch (err) {
    return { mediaCount: 0, staticCount: 0, totalCount: 0, isReadyForOffline: false, version: CACHE_VERSION, error: err.message };
  }
}

async function deleteCacheUrls(urls, cacheName = CACHE_NAMES.media) {
  const cache = await caches.open(cacheName);
  await Promise.all(urls.map(u => cache.delete(u)));
}

console.log('[SW] Loaded v' + CACHE_VERSION);
