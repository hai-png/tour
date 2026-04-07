/**
 * PWA Manager — Service Worker & Full-Offline Precaching
 * ============================================================
 * On first boot: discovers every media URL from project.json,
 * hotspots.json, and floor-plan config, then precaches ALL of
 * them via the Service Worker. The tour is fully offline-ready
 * immediately — no extra "download for offline" step needed.
 *
 * Version: 12.0.0
 */

export class PWAManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.swRegistration = null;
    this.promptEvent = null;
    this.userInteracted = false;
    this.installPromptShown = false;
    this.cacheChannel = null;
    this._mediaPrecached = false;

    this.init();
  }

  async init() {
    if (!window.isSecureContext) {
      console.warn('[PWA] Not a secure context — PWA install requires HTTPS or localhost.');
      return;
    }

    this.setupEventListeners();
    await this.registerServiceWorker();
    this.checkInstallability();
    this.monitorOnlineStatus();
    this.setupNavigationHandler();
    this.setupCacheMessageChannel();

    console.log('[PWA] Initialized');
  }

  /* ── MessageChannel ──────────────────────────────────────── */
  setupCacheMessageChannel() {
    this.cacheChannel = new MessageChannel();
    this.cacheChannel.port1.onmessage = (e) => this.handleSWMessage(e);
    this.cacheChannel.port1.start();
  }

  handleSWMessage(event) {
    const { type, ...data } = event.data;
    switch (type) {
      case 'SW_ACTIVATED':
        this.showUpdateNotification();
        break;
      case 'CACHE_START':
        this.updateOfflineProgressUI({ type: 'start', total: data.total });
        break;
      case 'CACHE_PROGRESS':
        this.updateOfflineProgressUI({ type: 'progress', ...data });
        break;
      case 'CACHE_COMPLETE':
        this._mediaPrecached = true;
        this.updateOfflineProgressUI({ type: 'complete', ...data });
        // Show install prompt after precaching completes if not already installed
        if (!this.isInstalled && !this.installPromptShown) {
          this.showInstallButton();
        }
        break;
      case 'OFFLINE_CACHE_COMPLETE':
        this._mediaPrecached = true;
        // Enable start button if precaching was already done
        const startBtn = document.getElementById('btn-start-tour');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.title = 'Ready for offline use';
        }
        // Update status text
        const statusText = document.getElementById('loading-status-text');
        const btnSubtitle = document.getElementById('btn-start-subtitle');
        if (statusText) statusText.textContent = 'Ready!';
        if (btnSubtitle) btnSubtitle.textContent = 'Ready for offline use';
        // Show install prompt after precaching completes
        if (!this.isInstalled && !this.installPromptShown) {
          this.showInstallButton();
        }
        // Hide progress after a delay
        setTimeout(() => {
          const prepProgress = document.getElementById('offline-prep-progress');
          if (prepProgress) prepProgress.style.display = 'none';
        }, 3000);
        break;
      case 'PRECACHE_FAILED':
        console.warn('[PWA] Install-time precaching failed:', data.error);
        this.notify({ 
          type: 'warning', 
          title: 'Offline Mode Incomplete', 
          message: 'Some media may not be available offline. Retrying precache...', 
          icon: 'fa-exclamation-triangle' 
        });
        // Retry precaching after a delay
        setTimeout(() => this.precacheAllMedia(), 3000);
        break;
    }
  }

  /* ── Service Worker registration ─────────────────────────── */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Worker not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none',
      });

      this.swRegistration.addEventListener('updatefound', () => {
        const worker = this.swRegistration.installing;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });

      await navigator.serviceWorker.ready;

      // Check if media is already cached from a previous session
      const status = await this.getOfflineStatus();
      if (status.isReadyForOffline && status.mediaCount > 100) {
        console.log(`[PWA] Media already cached from previous session (${status.mediaCount} items). Enabling start button.`);
        this._mediaPrecached = true;
        const startBtn = document.getElementById('btn-start-tour');
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.title = 'Ready for offline use';
        }
        // Update UI to show ready state
        const statusText = document.getElementById('loading-status-text');
        const btnSubtitle = document.getElementById('btn-start-subtitle');
        if (statusText) statusText.textContent = 'Ready!';
        if (btnSubtitle) btnSubtitle.textContent = 'Ready for offline use';
        // Hide progress if it was shown
        setTimeout(() => {
          const prepProgress = document.getElementById('offline-prep-progress');
          if (prepProgress) prepProgress.style.display = 'none';
        }, 500);
      } else {
        // Precache ALL media on first boot (automatic, no user action)
        await this.precacheAllMedia();
      }

      // Check for SW updates every hour
      setInterval(() => this.checkForUpdates(), 3600000);

      console.log('[PWA] SW registered');
    } catch (err) {
      console.error('[PWA] SW registration failed:', err);
    }
  }

  async checkForUpdates() {
    if (this.swRegistration) {
      try { await this.swRegistration.update(); } catch {}
    }
  }

  /* ── Dynamic media URL discovery + precaching ────────────── */
  async precacheAllMedia() {
    // Don't re-precache if already done in this session
    if (this._mediaPrecached) {
      console.log('[PWA] Media already precached, skipping');
      return;
    }

    // Don't try to precache when offline
    if (!navigator.onLine) {
      console.log('[PWA] Offline - skipping precache, using cached content');
      return;
    }

    try {
      const urls = await this.discoverAllMediaUrls();
      if (!urls.length) {
        console.warn('[PWA] No media URLs discovered - offline mode will be limited');
        this.notify({ 
          type: 'warning', 
          title: 'Limited Offline Mode', 
          message: 'No media files found. Some content won\'t be available offline.', 
          icon: 'fa-exclamation-triangle' 
        });
        return;
      }

      console.log(`[PWA] Starting precache of ${urls.length} media URLs for full offline support...`);

      // Show progress UI immediately
      this.updateOfflineProgressUI({ type: 'start', total: urls.length, message: 'Preparing offline content...' });

      const reg = await navigator.serviceWorker.ready;
      if (!reg.active) {
        console.error('[PWA] Service worker not active');
        return;
      }
      
      const mc = new MessageChannel();

      // Return a promise that resolves when precaching is complete
      await new Promise((resolve, reject) => {
        mc.port1.onmessage = (e) => {
          const { type, ...data } = e.data;
          this.handleSWMessage(e);

          if (type === 'CACHE_COMPLETE') {
            this._mediaPrecached = true;
            resolve();
          }
        };
        mc.port1.start();
        mc.port1.onmessageerror = reject;

        reg.active.postMessage({ type: 'PRECACHE_MEDIA', urls }, [mc.port2]);

        // Timeout after 5 minutes in case SW is unresponsive
        setTimeout(() => {
          if (!this._mediaPrecached) {
            console.warn('[PWA] Precache timed out after 5 minutes');
            this.notify({ 
              type: 'warning', 
              title: 'Precache Timeout', 
              message: 'Precaching took too long. Some media may not be cached for offline use.', 
              icon: 'fa-clock' 
            });
            this._mediaPrecached = true;
            resolve();
          }
        }, 300000);
      });

      console.log('[PWA] Precaching complete - all media now available offline');
    } catch (err) {
      console.error('[PWA] Failed to precache media:', err);
      this.notify({ 
        type: 'error', 
        title: 'Precache Failed', 
        message: `Failed to cache media for offline use: ${err.message}`, 
        icon: 'fa-exclamation-circle' 
      });
    }
  }

  async discoverAllMediaUrls() {
    const urls = new Set();

    // 1. Fetch project.json
    const project = await this._safeJson('media/tdv-import/project.json');
    if (project?.scenes) {
      for (const scene of project.scenes) {
        // Thumbnail
        if (scene.thumbnailUrl) {
          urls.add(scene.thumbnailUrl);
          // Also add webp variant if it exists
          const jpg = scene.thumbnailUrl.replace(/\.(jpg|jpeg)$/i, '.webp');
          if (jpg !== scene.thumbnailUrl) urls.add(jpg);
        }

        // Panorama cube faces — resolve {face} template
        if (scene.panoramaUrl?.includes('{face}')) {
          // Example: media/tdv-import/panoramas/panorama_XXX_0/{face}.jpg
          // Extract base path and extension from the template
          const templateMatch = scene.panoramaUrl.match(/^(.*){face}(\.[a-z]+)$/i);
          if (templateMatch) {
            const basePath = templateMatch[1];
            const ext = templateMatch[2];
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
    urls.add('media/tdv-import/skin/logo.png');

    // 2. Fetch hotspots.json
    const hotspots = await this._safeJson('media/tdv-import/hotspots.json');
    if (hotspots?.hotspots) {
      for (const hs of hotspots.hotspots) {
        if (hs.sprite?.url) urls.add(hs.sprite.url);
        // webp variant
        if (hs.sprite?.url) {
          urls.add(hs.sprite.url.replace(/\.png$/i, '.webp'));
        }
        if (hs.minimap?.url) urls.add(hs.minimap.url);
        if (hs.image) urls.add(hs.image);
      }
    }

    // 3. Floor plan config
    const fp = await this._safeJson('floor-plan/floor-plan-config.json');
    if (fp?.floors) {
      for (const floor of fp.floors) {
        if (floor.image) {
          // Convert .png to .webp since only webp files exist on disk
          urls.add(floor.image.replace(/\.png$/i, '.webp'));
        }
        if (floor.referenceImage) {
          urls.add(floor.referenceImage.replace(/\.png$/i, '.webp'));
        }
      }
    }
    // Actual files on disk are .webp
    urls.add('floor-plan/ground.webp');
    urls.add('floor-plan/first.webp');
    urls.add('floor-plan/second.webp');
    urls.add('floor-plan/third.webp');
    urls.add('floor-plan/ground_floor_hotspot_position_with_initial_view.webp');
    urls.add('floor-plan/first_floor_hotspot_position_with_initial_view.webp');
    urls.add('floor-plan/second_floor_hotspot_position_with_initial_view.webp');
    urls.add('floor-plan/third_floor_hotspot_position_with_initial_view.webp');
    // Additional floor plan images
    urls.add('floor-plan/brave_screensho.webp');
    urls.add('floor-plan/Gemini_Generated_Image_7t4s0p7t4s0p7t4s.webp');
    urls.add('floor-plan/Gemini_Generated_Image_dptkn5dptkn5dptk.webp');

    // 4. Extra panorama scenes not in project.json but exist on disk
    // These are referenced by the app but not in the main project config
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/front.jpg');
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/back.jpg');
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/left.jpg');
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/right.jpg');
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/top.jpg');
    urls.add('media/tdv-import/panoramas/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_0/bottom.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/front.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/back.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/left.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/right.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/top.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_0/bottom.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/front.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/back.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/left.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/right.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/top.jpg');
    urls.add('media/tdv-import/panoramas/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_0/bottom.jpg');

    // 5. Gallery images
    urls.add('gallery/Entrance view.webp');
    urls.add('gallery/GF-DINING ROOM 2.webp');
    urls.add('gallery/GF-LIVING ROOM 2.webp');
    urls.add('gallery/GF-OPEN KITCHEN 1.webp');
    urls.add('gallery/MINI SALON.webp');
    urls.add('gallery/MNI SALON 2.webp');
    urls.add('gallery/Scene 67.webp');
    urls.add('gallery/Scene 68.webp');
    urls.add('gallery/Scene 70.webp');
    urls.add('gallery/Scene 71_1.webp');
    urls.add('gallery/Scene 74_1.webp');
    urls.add('gallery/Scene 77.webp');
    urls.add('gallery/Scene 78.webp');
    urls.add('gallery/Scene 80.webp');
    urls.add('gallery/Scene 81.webp');

    return Array.from(urls);
  }

  async _safeJson(url) {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }

  /* ── Install prompt ──────────────────────────────────────── */
  setupEventListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
      this.isInstalled = false;

      console.log('[PWA] beforeinstallprompt event received - showing install button');
      const btn = document.getElementById('btn-install-app');
      if (btn) {
        btn.style.display = 'flex';
        btn.disabled = false;
      }
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.promptEvent = null;
      const btn = document.getElementById('btn-install-app');
      if (btn) btn.style.display = 'none';
      console.log('[PWA] App installed successfully');
    });

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify({ type: 'success', title: 'Back Online', message: 'Connection restored', icon: 'fa-wifi' });
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notify({ type: 'warning', title: "You're Offline", message: 'Cached content is still available', icon: 'fa-wifi' });
    });

    // Track first interaction for install eligibility
    const mark = () => {
      this.userInteracted = true;
      console.log('[PWA] User interaction detected, checking install prompt...');
      if (this.promptEvent && !this.installPromptShown) {
        console.log('[PWA] Showing install button after interaction');
        this.showInstallButton();
      }
      ['click', 'keydown', 'touchstart'].forEach(e => document.removeEventListener(e, mark));
    };
    ['click', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, mark, { once: true, passive: true }));

    setTimeout(() => this.setupOfflineDownloadButtons(), 1000);
  }

  showInstallButton() {
    const btn = document.getElementById('btn-install-app');
    if (btn) btn.style.display = 'flex';
  }

  setupOfflineDownloadButtons() {
    const installBtn = document.getElementById('btn-install-app');
    const checkBtn = document.getElementById('btn-check-offline-status');
    const statusDisp = document.getElementById('offline-status-display');

    installBtn?.addEventListener('click', () => this.triggerNativeInstall());

    if (checkBtn && statusDisp) {
      checkBtn.addEventListener('click', async () => {
        const status = await this.getOfflineStatus();
        statusDisp.style.display = 'block';
        document.getElementById('offline-cached-count').textContent = status.mediaCount || 0;
        document.getElementById('offline-size').textContent = this.formatBytes(status.mediaCount * 500 * 1024);
        const readyEl = document.getElementById('offline-ready');
        if (status.isReadyForOffline) {
          readyEl.textContent = 'Ready ✓';
          readyEl.style.color = '#10b981';
        } else {
          readyEl.textContent = 'Not Ready';
          readyEl.style.color = '#ef4444';
        }
      });
    }
  }

  async triggerNativeInstall() {
    if (this.promptEvent) {
      try {
        this.promptEvent.prompt();
        const { outcome } = await this.promptEvent.userChoice;
        if (outcome === 'accepted') {
          this.notify({ type: 'success', title: 'Installing…', message: 'The app is being installed', icon: 'fa-download' });
        }
        this.promptEvent = null;
        const btn = document.getElementById('btn-install-app');
        if (btn) btn.style.display = 'none';
      } catch {
        this.showManualInstallInstructions();
      }
    } else {
      this.showManualInstallInstructions();
    }
  }

  showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const steps = isIOS
      ? `<ol style="text-align:left;margin:12px 0;padding-left:20px;font-size:13px;line-height:1.8;">
           <li>Tap the <strong>Share</strong> button in Safari</li>
           <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
           <li>Tap <strong>Add</strong></li>
         </ol>`
      : `<ol style="text-align:left;margin:12px 0;padding-left:20px;font-size:13px;line-height:1.8;">
           <li>Click the <strong>menu</strong> (⋮ or ≡) in your browser</li>
           <li>Select <strong>"Install"</strong> or <strong>"Create shortcut"</strong></li>
           <li>Confirm</li>
         </ol>`;

    this.notify({ type: 'info', title: isIOS ? 'Install on iOS' : 'Install This App', message: 'Follow these steps:', icon: isIOS ? 'fa-apple' : 'fa-desktop', customHtml: steps, dismissible: true });
  }

  /* ── Update notification with skipWaiting ────────────────── */
  showUpdateNotification() {
    const el = document.createElement('div');
    el.className = 'pwa-notification info';
    el.innerHTML = `
      <div class="notif-body">
        <div class="notif-header">
          <i class="fas fa-sync-alt"></i>
          <strong>Update Available</strong>
        </div>
        <p>New version available. Click to refresh.</p>
      </div>
      <button class="notif-action-btn" id="notif-update-btn"><i class="fas fa-redo"></i> Refresh</button>
      <button class="notif-close-btn"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(el);

    el.querySelector('.notif-close-btn')?.addEventListener('click', () => el.remove());
    el.querySelector('#notif-update-btn')?.addEventListener('click', async () => {
      if (this.swRegistration?.waiting) {
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      setTimeout(() => window.location.reload(), 300);
    });

    setTimeout(() => { if (el.parentNode) el.remove(); }, 15000);
  }

  /* ── Notifications (CSS-class based, no inline styles) ───── */
  notify({ type = 'info', title, message, icon, dismissible = true, customHtml = '' }) {
    const el = document.createElement('div');
    el.className = `pwa-notification ${type}`;
    el.innerHTML = `
      <div class="notif-body">
        <div class="notif-header">
          <i class="fas ${icon}"></i>
          <strong>${title}</strong>
        </div>
        ${message ? `<p>${message}</p>` : ''}
      </div>
      ${customHtml ? `<div class="notif-custom">${customHtml}</div>` : ''}
      ${dismissible ? `<button class="notif-close-btn"><i class="fas fa-times"></i></button>` : ''}
    `;
    document.body.appendChild(el);
    el.querySelector('.notif-close-btn')?.addEventListener('click', () => el.remove());
  }

  /* ── Offline progress UI ──────────────────────────────────── */
  updateOfflineProgressUI(data) {
    // Update loading screen progress bar (if visible)
    const prepProgress = document.getElementById('offline-prep-progress');
    const statusText = document.getElementById('loading-status-text');
    const prepText = document.getElementById('offline-progress-text');
    const prepBar = document.getElementById('offline-progress-bar');
    const prepPercent = document.getElementById('offline-progress-percent');
    const prepCached = document.getElementById('offline-stat-cached');
    const prepPending = document.getElementById('offline-stat-pending');
    const prepFailed = document.getElementById('offline-stat-failed');
    const prepFile = document.getElementById('offline-current-file');
    const btnSubtitle = document.getElementById('btn-start-subtitle');

    if (data.type === 'start') {
      // Show progress bar in loading screen
      if (prepProgress) prepProgress.style.display = 'block';
      if (statusText) statusText.textContent = 'Preparing offline content...';
      if (prepText) prepText.textContent = `Preparing ${data.total} items for offline use...`;
      if (prepBar) prepBar.style.width = '0%';
      if (prepPercent) prepPercent.textContent = '0%';
      if (prepCached) prepCached.textContent = '0';
      if (prepPending) prepPending.textContent = data.total;
      if (prepFailed) prepFailed.textContent = '0';
      if (prepFile) prepFile.textContent = 'Starting download…';
      if (btnSubtitle) btnSubtitle.textContent = 'Preparing offline content...';
    } else if (data.type === 'progress') {
      if (statusText) statusText.textContent = `Downloading ${data.cached}/${data.total}...`;
      if (prepText) prepText.textContent = `Downloading ${data.cached}/${data.total}`;
      if (prepPercent) prepPercent.textContent = `${data.percent}%`;
      if (prepBar) prepBar.style.width = `${data.percent}%`;
      if (prepCached) prepCached.textContent = data.cached;
      if (prepPending) prepPending.textContent = data.total - data.cached - (data.failed || 0);
      if (prepFailed) prepFailed.textContent = data.failed || 0;
      if (prepFile && data.url) prepFile.textContent = data.url.split('/').pop();
      if (btnSubtitle) btnSubtitle.textContent = `${data.percent}% complete`;
    } else if (data.type === 'complete') {
      if (statusText) statusText.textContent = 'Ready!';
      if (prepText) prepText.textContent = 'Download Complete! Ready for offline.';
      if (prepPercent) prepPercent.textContent = '100%';
      if (prepBar) prepBar.style.width = '100%';
      if (prepCached) prepCached.textContent = data.cached;
      if (prepPending) prepPending.textContent = '0';
      if (prepFailed) prepFailed.textContent = data.failed || 0;
      if (prepFile) prepFile.textContent = `All files cached (${data.cached} items)`;
      if (btnSubtitle) btnSubtitle.textContent = 'Ready for offline use';
      
      // Enable the start tour button
      const startBtn = document.getElementById('btn-start-tour');
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.title = 'Ready for offline use';
      }
    }

    // Also update the old elements for backwards compatibility
    const text = document.getElementById('offline-progress-text');
    const pct = document.getElementById('offline-progress-percent');
    const bar = document.getElementById('offline-progress-bar');
    const cached = document.getElementById('offline-stat-cached');
    const pending = document.getElementById('offline-stat-pending');
    const failed = document.getElementById('offline-stat-failed');
    const file = document.getElementById('offline-current-file');

    if (data.type === 'start') {
      if (text) text.textContent = data.message;
      if (pct) pct.textContent = '0%';
      if (bar) bar.style.width = '0%';
      if (cached) cached.textContent = '0';
      if (pending) pending.textContent = data.total;
      if (failed) failed.textContent = '0';
      if (file) file.textContent = 'Initializing…';
    } else if (data.type === 'progress') {
      if (text) text.textContent = `Downloading ${data.cached}/${data.total}`;
      if (pct) pct.textContent = `${data.percent}%`;
      if (bar) bar.style.width = `${data.percent}%`;
      if (cached) cached.textContent = data.cached;
      if (pending) pending.textContent = data.total - data.cached - (data.failed || 0);
      if (failed) failed.textContent = data.failed || 0;
      if (file && data.url) file.textContent = data.url.split('/').pop();
    } else if (data.type === 'complete') {
      if (text) text.textContent = 'Download Complete!';
      if (pct) pct.textContent = '100%';
      if (bar) bar.style.width = '100%';
      if (cached) cached.textContent = data.cached;
      if (pending) pending.textContent = '0';
      if (failed) failed.textContent = data.failed || 0;
      if (file) file.textContent = 'All files cached';
    }
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  setupNavigationHandler() {
    if (!window.location.search) return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('start') === 'tour') setTimeout(() => document.getElementById('btn-start-tour')?.click(), 1000);
    if (p.get('modal') === 'gallery') setTimeout(() => this.tourPlayer?.ui?.openModal?.('gallery'), 1500);
    if (p.get('view') === 'floorplan') setTimeout(() => document.getElementById('floor-plan-container')?.scrollIntoView({ behavior: 'smooth' }), 1000);
  }

  checkInstallability() {
    if (window.matchMedia('(display-mode: standalone)').matches) { this.isInstalled = true; return; }
    if (window.navigator.standalone === true) { this.isInstalled = true; return; }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) this.showManualInstallInstructions();
  }

  monitorOnlineStatus() { this.isOnline = navigator.onLine; }

  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  }

  async getOfflineStatus() {
    if (!('serviceWorker' in navigator)) return { mediaCount: 0, totalCount: 0, isReadyForOffline: false, version: 'unknown' };
    return new Promise((resolve) => {
      const mc = new MessageChannel();
      mc.port1.onmessage = (e) => resolve(e.data);
      mc.port1.start();
      navigator.serviceWorker.ready.then(reg => reg.active.postMessage({ type: 'GET_OFFLINE_STATUS' }, [mc.port2]));
    });
  }

  async clearCache() {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  }

  isAppInstalled() { return this.isInstalled; }
  isAppOnline() { return this.isOnline; }
  canShowInstallPrompt() { return this.promptEvent !== null && !this.isInstalled && !this.installPromptShown; }
}
