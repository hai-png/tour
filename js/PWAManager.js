/**
 * PWA Manager - Service Worker and offline functionality
 * ============================================================
 * Provides PWA installation, offline support, and cache management
 * for mobile and desktop deployment.
 */

export class PWAManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.swRegistration = null;
    this.installPromptShown = false;
    this.userInteracted = false;
    this.promptEvent = null;

    // Track user interaction for install prompt
    this.trackUserInteraction();

    this.init();
  }

  async init() {
    // Check secure context requirement
    if (!window.isSecureContext) {
      console.warn('[PWA] ⚠️ NOT a secure context! PWA install requires HTTPS or localhost.');
      console.warn('[PWA] Current protocol:', window.location.protocol);
      console.warn('[PWA] isSecureContext:', window.isSecureContext);
      
      // Show warning
      setTimeout(() => this.showSecureContextWarning(), 1000);
    }
    
    this.setupEventListeners();
    await this.registerServiceWorker();
    this.checkInstallability();
    this.monitorOnlineStatus();
    this.setupNavigationHandler();
    
    // Debug logging
    console.log('[PWA] Initialization complete');
    console.log('[PWA] isInstalled:', this.isInstalled);
    console.log('[PWA] promptEvent:', this.promptEvent);
    console.log('[PWA] userInteracted:', this.userInteracted);
    console.log('[PWA] isSecureContext:', window.isSecureContext);
  }

  /**
   * Track user interaction for install prompt eligibility
   */
  trackUserInteraction() {
    const markInteraction = () => {
      this.userInteracted = true;
      ['click', 'keydown', 'touchstart'].forEach(evt => {
        document.removeEventListener(evt, markInteraction);
      });
    };

    ['click', 'keydown', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, markInteraction, { once: true, passive: true });
    });
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    console.log('[PWA] Checking service worker support...');
    
    if ('serviceWorker' in navigator) {
      console.log('[PWA] Service Worker is supported');
      
      try {
        console.log('[PWA] Registering service worker from ./sw.js...');
        
        this.swRegistration = await navigator.serviceWorker.register('./sw.js', {
          scope: './',
          updateViaCache: 'none'  // Always check for updates
        });

        console.log('[PWA] ✅ Service Worker registered:', this.swRegistration.scope);
        console.log('[PWA] Registration state:', this.swRegistration.state);
        console.log('[PWA] Active worker:', !!this.swRegistration.active);
        console.log('[PWA] Installing worker:', !!this.swRegistration.installing);
        console.log('[PWA] Waiting worker:', !!this.swRegistration.waiting);

        // Listen for updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found!');
          const newWorker = this.swRegistration.installing;

          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] Worker state change:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content available');
              this.showUpdateNotification();
            }
          });
        });

        // Check for updates periodically
        setInterval(() => {
          this.checkForUpdates();
        }, 60 * 60 * 1000); // Check every hour

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_ACTIVATED') {
            console.log('[PWA] Service Worker activated');
          }
        });

      } catch (error) {
        console.error('[PWA] ❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] ❌ Service Worker is NOT supported in this browser');
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        const update = await this.swRegistration.update();
        if (update) {
          console.log('[PWA] Service Worker update available');
        }
      } catch (error) {
        console.error('[PWA] Update check failed:', error);
      }
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Before install prompt (Chrome, Edge, Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
      this.isInstalled = false;
      console.log('[PWA] ✅ beforeinstallprompt event fired!');
      console.log('[PWA] promptEvent set:', !!this.promptEvent);
      console.log('[PWA] userInteracted:', this.userInteracted);

      // Show install button after a short delay and user interaction
      setTimeout(() => {
        console.log('[PWA] Checking if should show install button...');
        console.log('[PWA] userInteracted:', this.userInteracted);
        console.log('[PWA] installPromptShown:', this.installPromptShown);
        console.log('[PWA] promptEvent:', !!this.promptEvent);
        
        if (this.userInteracted && !this.installPromptShown && this.promptEvent) {
          console.log('[PWA] Showing install button');
          this.showInstallButton();
        } else {
          console.log('[PWA] NOT showing install button - conditions not met');
        }
      }, 2000);
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.promptEvent = null;
      this.installPromptShown = false;
      this.hideInstallButton();
    });

    // Online/Offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Add manual test button for debugging
    setTimeout(() => this.addDebugInstallButton(), 3000);
  }

  /**
   * Add debug install button for testing
   */
  addDebugInstallButton() {
    // Only add in development/testing
    const debugBtn = document.createElement('button');
    debugBtn.id = 'pwa-debug-install';
    debugBtn.innerHTML = '<i class="fas fa-bug"></i> <span>Test Install</span>';
    debugBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.8;
    `;
    
    debugBtn.addEventListener('click', () => {
      console.log('[PWA] Debug button clicked');
      console.log('[PWA] promptEvent:', !!this.promptEvent);
      console.log('[PWA] isInstalled:', this.isInstalled);
      this.promptInstall();
    });
    
    document.body.appendChild(debugBtn);
    console.log('[PWA] Debug install button added');
  }

  /**
   * Show warning about secure context requirement
   */
  showSecureContextWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff5722;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: calc(100vw - 40px);
    `;
    
    warning.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span><strong>PWA Install Not Available:</strong> Must use HTTPS or localhost. Current: ${window.location.protocol}</span>
      <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:white;cursor:pointer;font-size:18px;margin-left:12px;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(warning);
    console.log('[PWA] Secure context warning shown');
  }

  /**
   * Setup navigation handler for PWA
   */
  setupNavigationHandler() {
    // Handle PWA navigation
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('start') === 'tour') {
        // Auto-start tour after load
        setTimeout(() => {
          const startBtn = document.getElementById('btn-start-tour');
          if (startBtn) startBtn.click();
        }, 1000);
      }
      
      if (params.get('modal') === 'gallery') {
        // Open gallery modal after load
        setTimeout(() => {
          this.tourPlayer?.ui?.openModal?.('gallery');
        }, 1500);
      }
      
      if (params.get('view') === 'floorplan') {
        // Focus on floor plan
        setTimeout(() => {
          const floorPlanContainer = document.getElementById('floor-plan-container');
          if (floorPlanContainer) {
            floorPlanContainer.scrollIntoView({ behavior: 'smooth' });
          }
        }, 1000);
      }
    }
  }

  /**
   * Check if app is installable
   */
  async checkInstallability() {
    // Check if already installed (desktop)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] Running as standalone app');
      return;
    }

    // Check if already installed (iOS)
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] Running as iOS standalone app');
      return;
    }

    // Check iOS full-screen mode
    if (window.fullScreen === true || navigator.fullScreen) {
      this.isInstalled = true;
      console.log('[PWA] Running in full-screen mode');
      return;
    }

    // For iOS, show custom install instructions
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      this.showIOSInstallInstructions();
    }
  }

  /**
   * Show iOS install instructions
   */
  showIOSInstallInstructions() {
    // iOS doesn't support beforeinstallprompt
    // Show custom instructions instead
    const instructions = document.createElement('div');
    instructions.className = 'ios-install-instructions';
    instructions.innerHTML = `
      <div style="position:fixed;bottom:20px;right:20px;background:var(--bg-dark);border:1px solid var(--primary);border-radius:var(--radius-md);padding:16px;z-index:9999;max-width:300px;box-shadow:var(--shadow-lg);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <i class="fas fa-download" style="color:var(--primary);font-size:24px;"></i>
          <strong>Install on iPhone</strong>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
          To install this app on your iPhone:
        </p>
        <ol style="font-size:13px;color:var(--text);margin:0;padding-left:20px;">
          <li>Tap the <strong>Share</strong> button <i class="fas fa-share-square"></i></li>
          <li>Tap <strong>"Add to Home Screen"</strong> <i class="fas fa-plus-square"></i></li>
        </ol>
        <button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:8px;background:transparent;border:none;color:var(--text-muted);cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(instructions);

    // Auto-hide after 15 seconds
    setTimeout(() => {
      if (instructions.parentNode) {
        instructions.style.opacity = '0';
        instructions.style.transition = 'opacity 0.3s ease';
        setTimeout(() => instructions.remove(), 300);
      }
    }, 15000);
  }

  /**
   * Show install button - Fixed for tablets
   */
  showInstallButton() {
    if (this.installPromptShown) return;
    this.installPromptShown = true;

    // Create install button if not exists
    let installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.innerHTML = '<i class="fas fa-download"></i> <span>Install App</span>';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        padding: 14px 24px;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 99999;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: fadeInUp 0.3s ease;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        max-width: calc(100% - 40px);
      `;

      installBtn.addEventListener('mouseenter', () => {
        installBtn.style.transform = 'translateY(-2px)';
        installBtn.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4)';
      });

      installBtn.addEventListener('mouseleave', () => {
        installBtn.style.transform = 'translateY(0)';
        installBtn.style.boxShadow = 'var(--shadow-lg)';
      });

      installBtn.addEventListener('click', () => this.promptInstall());
      document.body.appendChild(installBtn);

      // Auto-hide after 20 seconds (longer for tablets)
      setTimeout(() => {
        if (installBtn && installBtn.parentNode) {
          installBtn.style.animation = 'fadeOutDown 0.3s ease';
          setTimeout(() => installBtn.remove(), 300);
          this.installPromptShown = false;
        }
      }, 20000);
      
      // Pulse animation to draw attention
      installBtn.style.animation = 'fadeInUp 0.3s ease, pulse 2s ease-in-out 1s infinite';
      
      // Add pulse keyframes if not exists
      if (!document.getElementById('pulse-keyframes')) {
        const style = document.createElement('style');
        style.id = 'pulse-keyframes';
        style.textContent = '@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }';
        document.head.appendChild(style);
      }
    }
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.remove();
    }
    this.installPromptShown = false;
  }

  /**
   * Prompt user to install
   */
  async promptInstall() {
    if (!this.promptEvent) {
      console.log('[PWA] Install prompt not available');

      // Show iOS instructions as fallback
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        this.showIOSInstallInstructions();
      } else {
        // Show message that app can be installed via browser menu
        this.showBrowserInstallHint();
      }

      return;
    }

    this.promptEvent.prompt();
    const { outcome } = await this.promptEvent.userChoice;

    console.log('[PWA] User response to install prompt:', outcome);
    this.promptEvent = null;

    if (outcome === 'accepted') {
      this.hideInstallButton();
    }
  }

  /**
   * Show browser install hint for when prompt is not available
   */
  showBrowserInstallHint() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid var(--primary);
      border-radius: var(--radius-md);
      padding: 16px 24px;
      color: var(--text);
      font-size: 14px;
      z-index: 99999;
      backdrop-filter: blur(20px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInUp 0.3s ease;
      max-width: calc(100vw - 40px);
    `;

    notification.innerHTML = `
      <i class="fas fa-info-circle" style="color: var(--primary);"></i>
      <span>To install this app, use your browser's "Install" or "Add to Home Screen" option in the menu.</span>
      <button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;margin-left:12px;">
        <i class="fas fa-times"></i>
      </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'fadeOutDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  /**
   * Handle online status
   */
  handleOnline() {
    this.isOnline = true;
    this.showOnlineNotification();
    
    // Retry any pending operations
    this.retryPendingOperations();
  }

  handleOffline() {
    this.isOnline = false;
    this.showOfflineNotification();
  }

  /**
   * Monitor online status
   */
  monitorOnlineStatus() {
    // Initial check
    this.isOnline = navigator.onLine;
  }

  /**
   * Retry pending operations when back online
   */
  async retryPendingOperations() {
    // Check if there are any pending syncs
    if ('serviceWorker' in navigator && 'sync' in window.SyncManager?.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('sync-capture');
      } catch (error) {
        // Sync not available
      }
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    // Remove existing notification if any
    const existing = document.getElementById('pwa-update-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid var(--primary);
      border-radius: var(--radius-md);
      padding: 14px 24px;
      color: var(--text);
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInDown 0.3s ease;
      max-width: calc(100vw - 40px);
    `;

    notification.innerHTML = `
      <i class="fas fa-sync-alt" style="color: var(--primary); animation: spin 2s linear infinite;"></i>
      <span>New version available! Refresh to update.</span>
      <button onclick="location.reload()" style="background:var(--primary);border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;margin-left:8px;">
        Refresh Now
      </button>
      <button onclick="document.getElementById('pwa-update-notification').remove()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;margin-left:8px;">
        <i class="fas fa-times"></i>
      </button>
    `;

    document.body.appendChild(notification);

    // Add spin animation
    if (!document.getElementById('spin-animation')) {
      const style = document.createElement('style');
      style.id = 'spin-animation';
      style.textContent = '@keyframes spin { 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
    // Remove existing offline notification
    const existing = document.getElementById('pwa-offline-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'pwa-offline-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid var(--accent);
      border-radius: var(--radius-md);
      padding: 14px 24px;
      color: var(--text);
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInDown 0.3s ease;
    `;

    notification.innerHTML = `
      <i class="fas fa-wifi" style="color: var(--accent);"></i>
      <span>You're offline. Cached content is still available.</span>
    `;

    document.body.appendChild(notification);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'fadeOutUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Show online notification
   */
  showOnlineNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid #10b981;
      border-radius: var(--radius-md);
      padding: 14px 24px;
      color: var(--text);
      font-size: 14px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInDown 0.3s ease;
    `;

    notification.innerHTML = `
      <i class="fas fa-wifi" style="color: #10b981;"></i>
      <span>Back online!</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOutUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({
        type: 'CACHE_URLS',
        urls: urls
      });
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const cacheInfo = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        cacheInfo[name] = {
          count: keys.length,
          estimatedSize: keys.length * 100 * 1024 // Rough estimate
        };
      }

      return cacheInfo;
    }
    return {};
  }

  /**
   * Clear cache
   */
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] Cache cleared');
    }
  }

  /**
   * Precache media files
   */
  async precacheMedia(urls) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({
        type: 'PRECACHE_MEDIA',
        urls: urls
      });
    }
  }

  /**
   * Is app installed?
   */
  isAppInstalled() {
    return this.isInstalled;
  }

  /**
   * Is app online?
   */
  isAppOnline() {
    return this.isOnline;
  }

  /**
   * Get install prompt state
   */
  canShowInstallPrompt() {
    return this.promptEvent !== null && !this.isInstalled && !this.installPromptShown;
  }
}
