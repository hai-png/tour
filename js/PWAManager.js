/**
 * PWA Manager - Service Worker and offline functionality
 * ============================================================
 */

export class PWAManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isOnline = navigator.onLine;
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.swRegistration = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.registerServiceWorker();
    this.checkInstallability();
    this.monitorOnlineStatus();
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('./sw.js', {
          scope: './'
        });

        console.log('[PWA] Service Worker registered:', this.swRegistration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          this.checkForUpdates();
        }, 60 * 60 * 1000); // Check every hour
        
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates() {
    if (this.swRegistration) {
      const update = await this.swRegistration.update();
      if (update) {
        console.log('[PWA] Service Worker update available');
        this.showUpdateNotification();
      }
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstalled = false;
      console.log('[PWA] Install prompt ready');
      
      // Show install button in UI
      this.showInstallButton();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallButton();
    });

    // Service worker messages
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          this.showUpdateNotification();
        }
      });
    }
  }

  /**
   * Check if app is installable
   */
  async checkInstallability() {
    if ('beforeinstallprompt' in window) {
      // Install prompt will be triggered
    }
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] Running as standalone app');
    }
    
    if (navigator.standalone) {
      this.isInstalled = true;
      console.log('[PWA] Running as iOS standalone app');
    }
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Create install button if not exists
    let installBtn = document.getElementById('pwa-install-btn');
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 9999;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 8px;
        animation: fadeInUp 0.3s ease;
      `;
      
      installBtn.addEventListener('click', () => this.promptInstall());
      document.body.appendChild(installBtn);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (installBtn && installBtn.parentNode) {
          installBtn.style.animation = 'fadeOutDown 0.3s ease';
          setTimeout(() => installBtn.remove(), 300);
        }
      }, 10000);
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
  }

  /**
   * Prompt user to install
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log('[PWA] User response to install prompt:', outcome);
    this.deferredPrompt = null;
    
    if (outcome === 'accepted') {
      this.hideInstallButton();
    }
  }

  /**
   * Monitor online status
   */
  monitorOnlineStatus() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineNotification();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineNotification();
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
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
      padding: 12px 24px;
      color: var(--text);
      font-size: 13px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInDown 0.3s ease;
    `;
    
    notification.innerHTML = `
      <i class="fas fa-sync-alt" style="color: var(--primary);"></i>
      <span>New version available!</span>
      <button onclick="location.reload()" style="background:var(--primary);border:none;color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">
        Refresh
      </button>
      <button onclick="document.getElementById('pwa-update-notification').remove()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
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
      padding: 12px 24px;
      color: var(--text);
      font-size: 13px;
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
      <span>You're offline. Some features may be limited.</span>
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
      padding: 12px 24px;
      color: var(--text);
      font-size: 13px;
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
      navigator.serviceWorker.ready.then((registration) => {
        registration.active.postMessage({
          type: 'CACHE_URLS',
          urls: urls
        });
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
        cacheInfo[name] = keys.length;
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
}
