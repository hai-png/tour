/**
 * Service Worker for HAI PNG Virtual Tour PWA
 * ============================================================
 * Full offline-first: precaches ALL media on first boot so the
 * entire tour works offline with zero additional download steps.
 *
 * Version: 12.0.0
 */

const CACHE_VERSION = 'v12';
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
      
      // Precache ALL media during installation to ensure full offline availability
      try {
        await precacheAllMediaOnInstall();
      } catch (err) {
        console.error('[SW] Media precaching during install failed:', err);
        // Notify clients that precaching failed so they can retry
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.postMessage({ 
          type: 'PRECACHE_FAILED', 
          error: err.message 
        }));
      }
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
      (async () => {
        // Try matching with both URL forms (with and without ./)
        const requestUrl = request.url;
        const urlPath = url.pathname;
        
        // Try original request first
        let cached = await caches.match(request);
        if (cached) return cached;
        
        // Try with ./ prefix
        if (!urlPath.startsWith('./')) {
          const withPrefix = './' + urlPath;
          cached = await caches.match(withPrefix);
          if (cached) return cached;
        }
        
        // Try without ./ prefix
        if (urlPath.startsWith('./')) {
          const withoutPrefix = urlPath.substring(2);
          cached = await caches.match(withoutPrefix);
          if (cached) return cached;
        }
        
        // Not in cache - try network
        try {
          const response = await fetch(request);
          if (response.ok) {
            const clone = response.clone();
            const cacheName = isMediaUrl(url.pathname) ? CACHE_NAMES.media : CACHE_NAMES.shell;
            caches.open(cacheName).then(c => c.put(request, clone));
          }
          return response;
        } catch {
          // Network failed - return offline page or error response
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./offline.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        }
      })()
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
      // Don't throw - return offline page or a failed response
      if (request.mode === 'navigate') return caches.match('./offline.html');
      // Return a network error response gracefully
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

function isMediaUrl(pathname) {
  return /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|ogg)$/i.test(pathname);
}

// ── Precache ALL media on install (for full offline support) ─
async function precacheAllMediaOnInstall() {
  console.log('[SW] Starting install-time media precaching...');
  
  const urls = await discoverAllMediaUrlsForPrecache();
  if (!urls.length) {
    console.log('[SW] No media URLs to precache during install');
    return;
  }

  console.log(`[SW] Precaching ${urls.length} media items during install...`);
  
  // Notify clients that precaching has started
  const initialClients = await self.clients.matchAll();
  initialClients.forEach(c => c.postMessage({ 
    type: 'CACHE_START', 
    total: urls.length,
    message: `Preparing ${urls.length} items for offline use...`
  }));
  
  const cache = await caches.open(CACHE_NAMES.media);
  let cached = 0, failed = 0;
  const failures = [];
  
  // Use batch processing for better performance
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // Normalize URL to ensure consistent form
          const normalizedUrl = url.startsWith('./') ? url : './' + url;
          const altUrl = normalizedUrl.startsWith('./') ? normalizedUrl.substring(2) : './' + normalizedUrl;
          
          const resp = await fetch(normalizedUrl, { cache: 'no-cache' });
          if (!resp.ok) {
            if (failures.length < 5) {
              failures.push({ url: normalizedUrl, status: resp.status, statusText: resp.statusText });
            }
            console.warn(`[SW] Failed to fetch ${normalizedUrl}: ${resp.status} ${resp.statusText}`);
            return false;
          }
          // Store with normalized URL
          await cache.put(normalizedUrl, resp.clone());
          // Also store without ./ prefix for broader matching
          await cache.put(altUrl, resp);
          return true;
        } catch (err) {
          if (failures.length < 5) {
            failures.push({ url: url, error: err.message });
          }
          console.warn(`[SW] Error caching ${url}:`, err.message);
          return false;
        }
      })
    );
    
    cached += results.filter(r => r.status === 'fulfilled' && r.value).length;
    failed += results.filter(r => r.status === 'fulfilled' && !r.value).length;
    
    // Send progress update to clients
    const percent = Math.round(((cached + failed) / urls.length) * 100);
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({
      type: 'CACHE_PROGRESS',
      cached, failed, total: urls.length,
      percent,
      url: batch[batch.length - 1] || '',
    }));
    
    console.log(`[SW] Install precache: ${cached + failed}/${urls.length} (${percent}%)`);
    
    // Yield to avoid blocking the main thread
    if ((cached + failed) % 10 === 0) {
      await new Promise(r => setTimeout(r, 10));
    }
  }

  console.log(`[SW] Install-time precache complete: ${cached}/${urls.length} cached`);
  if (failures.length > 0) {
    console.error(`[SW] First ${failures.length} install-time failures:`, JSON.stringify(failures, null, 2));
  }
  
  // Notify all clients that precaching is complete
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ 
    type: 'OFFLINE_CACHE_COMPLETE', 
    cached, 
    failed, 
    total: urls.length 
  }));
}

// ── URL discovery for install-time precaching ────────────────
async function discoverAllMediaUrlsForPrecache() {
  const urls = new Set();

  // Helper for safe JSON fetch
  const safeJson = async (url) => {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  };

  // 1. Project scenes
  const project = await safeJson('./media/tdv-import/project.json');
  if (project?.scenes) {
    for (const scene of project.scenes) {
      // Thumbnail
      if (scene.thumbnailUrl) {
        urls.add(scene.thumbnailUrl);
        // Also add webp variant if it's a jpg/jpeg
        const webp = scene.thumbnailUrl.replace(/\.(jpg|jpeg)$/i, '.webp');
        if (webp !== scene.thumbnailUrl) urls.add(webp);
      }
      
      // Panorama cube faces — handle {face} template properly
      if (scene.panoramaUrl?.includes('{face}')) {
        // Example: media/tdv-import/panoramas/panorama_XXX_0/{face}.jpg
        // Extract base path and extension from the template
        const templateMatch = scene.panoramaUrl.match(/^(.*){face}(\.[a-z]+)$/i);
        if (templateMatch) {
          const basePath = templateMatch[1]; // e.g., media/.../panorama_XXX_0/
          const ext = templateMatch[2]; // e.g., .jpg
          for (const face of ['front', 'back', 'left', 'right', 'top', 'bottom']) {
            urls.add(basePath + face + ext);
            // Also add webp variant if not already webp
            if (!ext.includes('webp')) {
              urls.add(basePath + face + '.webp');
            }
          }
        }
      } else if (scene.panoramaUrl) {
        urls.add(scene.panoramaUrl);
      }
    }
  }

  // Skin / logo
  urls.add('./media/tdv-import/skin/logo.png');
  urls.add('./media/tdv-import/skin/logo.webp');

  // 2. Hotspots
  const hotspots = await safeJson('./media/tdv-import/hotspots.json');
  if (hotspots?.hotspots) {
    for (const hs of hotspots.hotspots) {
      if (hs.sprite?.url) {
        // Add original URL and webp variant
        urls.add(hs.sprite.url);
        urls.add(hs.sprite.url.replace(/\.png$/i, '.webp'));
      }
      if (hs.minimap?.url) urls.add(hs.minimap.url);
      if (hs.image) urls.add(hs.image);
    }
  }

  // 3. Floor plan config
  const fp = await safeJson('./floor-plan/floor-plan-config.json');
  if (fp?.floors) {
    for (const floor of fp.floors) {
      if (floor.image) {
        // Convert .png to .webp since only webp files exist on disk
        const url = floor.image.replace(/^\.\//, './').replace(/\.png$/i, '.webp');
        urls.add(url);
      }
      if (floor.referenceImage) {
        const url = floor.referenceImage.replace(/^\.\//, './').replace(/\.png$/i, '.webp');
        urls.add(url);
      }
    }
  }
  // Known floor plan images
  ['./floor-plan/ground.webp', './floor-plan/first.webp', './floor-plan/second.webp', 
   './floor-plan/third.webp', './floor-plan/ground_floor_hotspot_position_with_initial_view.webp',
   './floor-plan/first_floor_hotspot_position_with_initial_view.webp',
   './floor-plan/second_floor_hotspot_position_with_initial_view.webp',
   './floor-plan/third_floor_hotspot_position_with_initial_view.webp',
   './floor-plan/brave_screensho.webp',
   './floor-plan/Gemini_Generated_Image_7t4s0p7t4s0p7t4s.webp',
   './floor-plan/Gemini_Generated_Image_dptkn5dptkn5dptk.webp'
  ].forEach(u => urls.add(u));

  // 4. Panorama cubes (known directories)
  const panoPrefixes = [
    './media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/',
    './media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/',
    './media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/',
  ];
  const faces = ['front.jpg', 'back.jpg', 'left.jpg', 'right.jpg', 'top.jpg', 'bottom.jpg'];
  for (const prefix of panoPrefixes) {
    for (const face of faces) {
      urls.add(prefix + face);
    }
  }

  // 5. Gallery images
  [
    './gallery/Entrance view.webp',
    './gallery/GF-DINING ROOM 2.webp',
    './gallery/GF-LIVING ROOM 2.webp',
    './gallery/GF-OPEN KITCHEN 1.webp',
    './gallery/MINI SALON.webp',
    './gallery/MNI SALON 2.webp',
    './gallery/Scene 67.webp',
    './gallery/Scene 68.webp',
    './gallery/Scene 70.webp',
    './gallery/Scene 71_1.webp',
    './gallery/Scene 74_1.webp',
    './gallery/Scene 77.webp',
    './gallery/Scene 78.webp',
    './gallery/Scene 80.webp',
    './gallery/Scene 81.webp',
  ].forEach(u => urls.add(u));

  return Array.from(urls);
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

  // Log first few failures to help diagnose issues
  const failures = [];

  for (const url of urls) {
    try {
      // Normalize URL to ensure consistent form
      const normalizedUrl = url.startsWith('./') ? url : './' + url;
      const altUrl = normalizedUrl.startsWith('./') ? normalizedUrl.substring(2) : './' + normalizedUrl;
      
      const resp = await fetch(normalizedUrl, { cache: 'no-cache' });
      if (!resp.ok) {
        if (failures.length < 5) {
          failures.push({ url: normalizedUrl, status: resp.status, statusText: resp.statusText });
        }
        console.warn(`[SW] Failed to fetch ${normalizedUrl}: ${resp.status} ${resp.statusText}`);
        failed++;
      } else {
        // Store with normalized URL
        await cache.put(normalizedUrl, resp.clone());
        // Also store without ./ prefix for broader matching
        await cache.put(altUrl, resp);
        cached++;
      }
    } catch (err) {
      if (failures.length < 5) {
        failures.push({ url: url, error: err.message });
      }
      console.warn(`[SW] Error caching ${url}:`, err.message);
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
  if (failures.length > 0) {
    console.error(`[SW] First ${failures.length} failures:`, JSON.stringify(failures, null, 2));
  }
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
