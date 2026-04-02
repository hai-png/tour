/**
 * PWA Manager - Modern Service Worker & Offline Functionality
 * ============================================================
 * Provides PWA installation, offline support, and cache management
 * with enhanced UX for mobile and desktop deployment.
 * 
 * Version: 7.0.0 - Complete Revamp
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
    this.installProgress = 0;
    this.installStage = 'idle';
    this.cacheChannel = null;

    this.init();
  }

  async init() {
    // Check secure context requirement
    if (!window.isSecureContext) {
      console.warn('[PWA] ⚠️ NOT a secure context! PWA install requires HTTPS or localhost.');
      console.warn('[PWA] Current protocol:', window.location.protocol);
      this.showSecureContextWarning();
      return;
    }

    this.setupEventListeners();
    await this.registerServiceWorker();
    this.checkInstallability();
    this.monitorOnlineStatus();
    this.setupNavigationHandler();
    this.setupCacheMessageChannel();

    console.log('[PWA] Initialization complete');
  }

  /**
   * Setup MessageChannel for SW communication
   */
  setupCacheMessageChannel() {
    this.cacheChannel = new MessageChannel();
    this.cacheChannel.port1.onmessage = (event) => this.handleSWMessage(event);
    this.cacheChannel.port1.start();
  }

  /**
   * Handle messages from Service Worker
   */
  handleSWMessage(event) {
    const { type, message, version, ...data } = event.data;

    switch (type) {
      case 'SW_INSTALLED':
        console.log('[PWA] Service Worker installed:', version);
        break;
      case 'SW_ACTIVATED':
        console.log('[PWA] Service Worker activated:', version);
        this.showUpdateAvailableNotification();
        break;
      case 'CACHE_PROGRESS':
        this.handleCacheProgress(data);
        break;
      case 'CACHE_COMPLETE':
        this.handleCacheComplete(data);
        break;
      case 'OFFLINE_CACHE_COMPLETE':
        this.handleOfflineCacheComplete(data);
        break;
    }
  }

  /**
   * Handle cache progress updates
   */
  handleCacheProgress(data) {
    const progressEl = document.getElementById('pwa-install-progress');
    const progressBar = document.getElementById('pwa-progress-bar');
    const progressStatus = document.getElementById('pwa-progress-status');

    if (progressBar) {
      progressBar.style.width = `${data.percent}%`;
    }

    if (progressStatus && data.url) {
      const fileName = data.url.split('/').pop();
      progressStatus.textContent = `Caching: ${fileName} (${data.percent}%)`;
    }

    if (progressEl && data.percent === 100) {
      setTimeout(() => {
        progressEl.style.opacity = '0';
        progressEl.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          progressEl.style.display = 'none';
          progressEl.style.opacity = '1';
        }, 500);
      }, 1500);
    }
  }

  /**
   * Handle cache completion
   */
  handleCacheComplete(data) {
    console.log('[PWA] Cache complete:', data);
    this.showNotification({
      type: 'success',
      title: 'Offline Cache Complete',
      message: `${data.cached}/${data.total} items cached successfully`,
      icon: 'fa-download',
      duration: 5000
    });
  }

  /**
   * Handle offline cache complete
   */
  handleOfflineCacheComplete(data) {
    console.log('[PWA] Offline cache complete:', data);
    this.showNotification({
      type: 'success',
      title: 'Ready for Offline Use',
      message: `${data.cached} items cached (${data.successRate}% success rate)`,
      icon: 'fa-wifi',
      duration: 5000
    });
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
      // Show install button after user interaction
      if (this.promptEvent && !this.installPromptShown) {
        this.showInstallButton();
      }
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
        this.updateInstallProgress(10, 'Starting service worker...');

        this.swRegistration = await navigator.serviceWorker.register('./sw.js', {
          scope: './',
          updateViaCache: 'none'
        });

        this.updateInstallProgress(30, 'Service worker registered');
        console.log('[PWA] ✅ Service Worker registered:', this.swRegistration.scope);

        // Listen for updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found!');
          this.updateInstallProgress(50, 'Installing service worker...');
          const newWorker = this.swRegistration.installing;

          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] Worker state:', newWorker.state);

            if (newWorker.state === 'installed') {
              this.updateInstallProgress(80, 'Service worker installed');
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New content available');
                this.showUpdateNotification();
              }
            } else if (newWorker.state === 'activated') {
              this.updateInstallProgress(100, 'Ready');
            }
          });
        });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        this.updateInstallProgress(100, 'Ready');
        console.log('[PWA] Service worker ready');

        // Trigger install prompt check
        window.dispatchEvent(new CustomEvent('pwa-check-install'));

        // Check for updates every hour
        setInterval(() => this.checkForUpdates(), 60 * 60 * 1000);

      } catch (error) {
        console.error('[PWA] ❌ Service Worker registration failed:', error);
        this.updateInstallProgress(0, 'Failed to initialize');
      }
    } else {
      console.warn('[PWA] ❌ Service Worker is NOT supported');
      this.updateInstallProgress(0, 'Not supported');
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
   * Update install progress indicator
   */
  updateInstallProgress(progress, status) {
    this.installProgress = progress;
    this.installStage = status;

    const progressEl = document.getElementById('pwa-install-progress');
    const progressBar = document.getElementById('pwa-progress-bar');
    const progressStatus = document.getElementById('pwa-progress-status');

    if (progressEl && progressBar && progressStatus) {
      if (progress < 100) {
        progressEl.style.display = 'block';
      }

      progressBar.style.width = `${progress}%`;
      progressStatus.textContent = status;

      if (progress >= 100) {
        setTimeout(() => {
          progressEl.style.opacity = '0';
          progressEl.style.transition = 'opacity 0.5s ease';
          setTimeout(() => {
            progressEl.style.display = 'none';
            progressEl.style.opacity = '1';
          }, 500);
        }, 1500);
      }
    }

    console.log(`[PWA] Progress: ${progress}% - ${status}`);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('[PWA] Setting up event listeners...');

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
      this.isInstalled = false;
      console.log('[PWA] ✅ beforeinstallprompt event fired!');

      this.updateInstallButtonState();

      if (!this.installPromptShown && this.promptEvent && this.userInteracted) {
        this.showInstallButton();
      }
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.promptEvent = null;
      this.installPromptShown = false;
      this.hideInstallButton();
      this.updateInstallButtonState();
    });

    // Online/Offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Setup buttons
    setTimeout(() => this.setupInstallButton(), 500);
    setTimeout(() => this.setupOfflineDownloadButtons(), 1000);

    // Track user interaction
    this.trackUserInteraction();
  }

  /**
   * Setup install button in settings
   */
  setupInstallButton() {
    const installBtn = document.getElementById('btn-install-app');
    const installBtnText = document.getElementById('install-btn-text');
    const installHint = document.getElementById('install-hint');
    const installHintText = document.getElementById('install-hint-text');

    if (!installBtn) return;

    installBtn.addEventListener('click', () => this.promptInstall());

    this.updateInstallButtonState = () => {
      if (!installBtnText || !installHint || !installHintText) return;

      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true) {
        installBtnText.textContent = 'App Installed ✓';
        installBtn.disabled = true;
        installHint.style.display = 'none';
        return;
      }

      // Check iOS
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        installBtnText.textContent = 'Install on iOS';
        installBtn.disabled = false;
        installHint.style.display = 'block';
        installHintText.textContent = 'Tap Share button (box with arrow), then "Add to Home Screen"';
        return;
      }

      // Check if prompt is available
      if (this.promptEvent) {
        installBtnText.textContent = 'Install App';
        installBtn.disabled = false;
        installHint.style.display = 'none';
      } else {
        installBtnText.textContent = 'Install via Browser';
        installBtn.disabled = false;
        installBtn.onclick = () => this.showBrowserInstallHint();
        installHint.style.display = 'block';
        installHintText.textContent = 'Use your browser menu (⋮) → "Install HAI Tour" or "Create shortcut"';
      }
    };

    this.updateInstallButtonState();
  }

  /**
   * Setup offline download buttons
   */
  setupOfflineDownloadButtons() {
    const downloadBtn = document.getElementById('btn-download-offline');
    const checkStatusBtn = document.getElementById('btn-check-offline-status');
    const statusDisplay = document.getElementById('offline-status-display');

    if (!downloadBtn || !checkStatusBtn) return;

    // Download all content
    downloadBtn.addEventListener('click', async () => {
      console.log('[PWA] Download offline button clicked');

      const modal = document.getElementById('modal-offline-download');
      if (modal) {
        modal.classList.add('active');
        document.getElementById('offline-success-message').style.display = 'none';
        document.getElementById('btn-cancel-offline-download').style.display = 'inline-block';
      }

      try {
        const totalItems = await this.downloadForOffline(
          (progress) => this.updateOfflineProgressUI(progress),
          (result) => {
            this.updateOfflineProgressUI(result);
            setTimeout(() => {
              document.getElementById('offline-success-message').style.display = 'block';
              document.getElementById('btn-cancel-offline-download').innerHTML = '<i class="fas fa-check"></i> Done';
            }, 500);
          }
        );

        console.log(`[PWA] Started downloading ${totalItems} items`);
      } catch (error) {
        console.error('[PWA] Download failed:', error);
        alert('Download failed: ' + error.message);
      }
    });

    // Check offline status
    checkStatusBtn.addEventListener('click', async () => {
      console.log('[PWA] Check offline status clicked');

      const status = await this.getOfflineStatus();

      if (statusDisplay) {
        statusDisplay.style.display = 'block';
        document.getElementById('offline-cached-count').textContent = status.mediaCount || 0;
        document.getElementById('offline-size').textContent = this.formatBytes(status.estimatedSize || 0);

        const readyEl = document.getElementById('offline-ready');
        if (status.isReadyForOffline) {
          readyEl.textContent = 'Ready ✓';
          readyEl.style.color = '#10b981';
        } else {
          readyEl.textContent = 'Not Ready';
          readyEl.style.color = '#ef4444';
        }
      }
    });
  }

  /**
   * Update offline download progress UI
   */
  updateOfflineProgressUI(data) {
    if (data.type === 'start') {
      document.getElementById('offline-progress-text').textContent = data.message;
      document.getElementById('offline-progress-percent').textContent = '0%';
      document.getElementById('offline-progress-bar').style.width = '0%';
      document.getElementById('offline-stat-cached').textContent = '0';
      document.getElementById('offline-stat-pending').textContent = data.total;
      document.getElementById('offline-stat-failed').textContent = '0';
      document.getElementById('offline-current-file').textContent = 'Initializing...';
    } else if (data.type === 'progress') {
      document.getElementById('offline-progress-text').textContent = `Downloading ${data.current}/${data.total}`;
      document.getElementById('offline-progress-percent').textContent = `${data.percent}%`;
      document.getElementById('offline-progress-bar').style.width = `${data.percent}%`;
      document.getElementById('offline-stat-cached').textContent = data.cached;
      document.getElementById('offline-stat-pending').textContent = data.total - data.current;
      document.getElementById('offline-stat-failed').textContent = data.failed || 0;

      if (data.url) {
        const fileName = data.url.split('/').pop();
        document.getElementById('offline-current-file').textContent = fileName;
      }
    } else if (data.type === 'complete') {
      document.getElementById('offline-progress-text').textContent = 'Download Complete!';
      document.getElementById('offline-progress-percent').textContent = '100%';
      document.getElementById('offline-progress-bar').style.width = '100%';
      document.getElementById('offline-stat-cached').textContent = data.cached;
      document.getElementById('offline-stat-pending').textContent = '0';
      document.getElementById('offline-stat-failed').textContent = data.failed || 0;
      document.getElementById('offline-current-file').textContent = 'All files cached';

      const statusDisplay = document.getElementById('offline-status-display');
      if (statusDisplay) {
        statusDisplay.style.display = 'block';
        document.getElementById('offline-cached-count').textContent = data.cached;
        document.getElementById('offline-size').textContent = this.formatBytes(data.cached * 500 * 1024);
        const readyEl = document.getElementById('offline-ready');
        readyEl.textContent = 'Ready ✓';
        readyEl.style.color = '#10b981';
      }
    }
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  }

  /**
   * Show install button
   */
  showInstallButton() {
    if (this.installPromptShown) return;
    this.installPromptShown = true;

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

      // Auto-hide after 20 seconds
      setTimeout(() => {
        if (installBtn && installBtn.parentNode) {
          installBtn.style.animation = 'fadeOutDown 0.3s ease';
          setTimeout(() => installBtn.remove(), 300);
          this.installPromptShown = false;
        }
      }, 20000);

      // Pulse animation
      installBtn.style.animation = 'fadeInUp 0.3s ease, pulse 2s ease-in-out 1s infinite';
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
    this.updateInstallProgress(10, 'Preparing installation...');

    if (!this.promptEvent) {
      console.log('[PWA] Install prompt not available');

      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        this.updateInstallProgress(100, 'See instructions');
        this.showIOSInstallInstructions();
      } else {
        this.updateInstallProgress(100, 'Use browser menu');
        this.showBrowserInstallHint();
      }

      if (this.updateInstallButtonState) {
        this.updateInstallButtonState();
      }
      return;
    }

    this.updateInstallProgress(40, 'Launching installer...');
    this.promptEvent.prompt();
    const { outcome } = await this.promptEvent.userChoice;

    console.log('[PWA] User response:', outcome);
    this.promptEvent = null;

    if (outcome === 'accepted') {
      this.updateInstallProgress(100, 'Installing...');
      this.hideInstallButton();
    } else {
      this.updateInstallProgress(0, 'Installation cancelled');
    }

    if (this.updateInstallButtonState) {
      this.updateInstallButtonState();
    }
  }

  /**
   * Show browser install hint
   */
  showBrowserInstallHint() {
    this.showNotification({
      type: 'info',
      title: 'Install via Browser',
      message: 'Use your browser\'s menu (⋮) → "Install HAI Tour" or "Create shortcut"',
      icon: 'fa-info-circle',
      duration: 10000
    });
  }

  /**
   * Show iOS install instructions
   */
  showIOSInstallInstructions() {
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

    setTimeout(() => {
      if (instructions.parentNode) {
        instructions.style.opacity = '0';
        instructions.style.transition = 'opacity 0.3s ease';
        setTimeout(() => instructions.remove(), 300);
      }
    }, 15000);
  }

  /**
   * Show warning about secure context requirement
   */
  showSecureContextWarning() {
    this.showNotification({
      type: 'warning',
      title: 'PWA Install Not Available',
      message: `Must use HTTPS or localhost. Current: ${window.location.protocol}`,
      icon: 'fa-exclamation-triangle',
      duration: 10000,
      dismissible: true
    });
  }

  /**
   * Setup navigation handler for PWA
   */
  setupNavigationHandler() {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);

      if (params.get('start') === 'tour') {
        setTimeout(() => {
          const startBtn = document.getElementById('btn-start-tour');
          if (startBtn) startBtn.click();
        }, 1000);
      }

      if (params.get('modal') === 'gallery') {
        setTimeout(() => {
          this.tourPlayer?.ui?.openModal?.('gallery');
        }, 1500);
      }

      if (params.get('view') === 'floorplan') {
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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] Running as standalone app');
      return;
    }

    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] Running as iOS standalone app');
      return;
    }

    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      this.showIOSInstallInstructions();
    }
  }

  /**
   * Handle online status
   */
  handleOnline() {
    this.isOnline = true;
    this.showNotification({
      type: 'success',
      title: 'Back Online',
      message: 'Your connection has been restored',
      icon: 'fa-wifi',
      duration: 3000
    });
  }

  handleOffline() {
    this.isOnline = false;
    this.showNotification({
      type: 'warning',
      title: 'You\'re Offline',
      message: 'Cached content is still available',
      icon: 'fa-wifi',
      duration: 5000
    });
  }

  /**
   * Monitor online status
   */
  monitorOnlineStatus() {
    this.isOnline = navigator.onLine;
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    this.showNotification({
      type: 'info',
      title: 'Update Available',
      message: 'New version available! Refresh to update.',
      icon: 'fa-sync-alt',
      duration: 10000,
      action: {
        label: 'Refresh Now',
        callback: () => window.location.reload()
      }
    });
  }

  /**
   * Show update available notification
   */
  showUpdateAvailableNotification() {
    this.showNotification({
      type: 'info',
      title: 'App Updated',
      message: 'The app has been updated in the background',
      icon: 'fa-check-circle',
      duration: 5000
    });
  }

  /**
   * Show generic notification
   */
  showNotification({ type = 'info', title, message, icon, duration = 5000, action, dismissible = true }) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid var(--${type === 'success' ? 'success' : type === 'warning' ? 'accent' : type === 'error' ? 'error' : 'primary'});
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

    const iconColor = type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#6366f1';
    
    let actionHTML = '';
    if (action) {
      actionHTML = `<button onclick="this.parentElement.remove(); (${action.callback})()" style="background:var(--primary);border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;margin-left:8px;">${action.label}</button>`;
    }

    notification.innerHTML = `
      <i class="fas ${icon}" style="color: ${iconColor};"></i>
      <div>
        <strong>${title}</strong>
        <div style="font-size:13px;opacity:0.8;margin-top:2px;">${message}</div>
      </div>
      ${actionHTML}
      ${dismissible ? `<button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;margin-left:8px;"><i class="fas fa-times"></i></button>` : ''}
    `;

    document.body.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'fadeOutUp 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }
  }

  /**
   * Download all content for full offline access
   */
  async downloadForOffline(onProgress, onComplete) {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.ready;

    // Create message channel for progress updates
    const messageChannel = new MessageChannel();
    const port = messageChannel.port1;
    port.start();

    port.onmessage = (event) => {
      const data = event.data;
      console.log('[PWA] Cache progress:', data);

      if (data.type === 'CACHE_START' && onProgress) {
        onProgress({
          type: 'start',
          total: data.total,
          message: `Starting download of ${data.total} items...`
        });
      } else if (data.type === 'CACHE_PROGRESS' && onProgress) {
        onProgress({
          type: 'progress',
          cached: data.cached,
          failed: data.failed,
          total: data.total,
          current: data.current,
          percent: data.percent,
          url: data.url,
          message: `Downloading ${data.current}/${data.total} (${data.percent}%)...`,
          result: data.results
        });
      } else if (data.type === 'CACHE_COMPLETE' && onComplete) {
        onComplete({
          type: 'complete',
          cached: data.cached,
          failed: data.failed,
          total: data.total,
          percent: data.percent,
          successRate: data.successRate,
          message: `Offline cache complete: ${data.cached}/${data.total} items`
        });
      }
    };

    const mediaUrls = await this.discoverAllMediaUrls();
    console.log(`[PWA] Discovered ${mediaUrls.length} media URLs`);

    registration.active.postMessage({
      type: 'CACHE_ALL_MEDIA',
      urls: mediaUrls
    }, [messageChannel.port2]);

    return mediaUrls.length;
  }

  /**
   * Discover all media URLs in the app
   */
  async discoverAllMediaUrls() {
    const urls = new Set();

    // Add existing thumbnails
    const existingThumbnails = [
      'media/tdv-import/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_t.jpg',
      'media/tdv-import/panorama_CFF86997_D78D_4109_41D6_D7F4B4601989_t.webp',
      'media/tdv-import/panorama_DB744300_D775_4107_41E1_E2F79FF4509D_t.jpg',
      'media/tdv-import/panorama_DB744300_D775_4107_41E1_E2F79FF4509D_t.webp',
      'media/tdv-import/panorama_DC440AF5_D777_C308_41B0_13691E9AEB46_t.jpg',
      'media/tdv-import/panorama_DC440AF5_D777_C308_41B0_13691E9AEB46_t.webp',
      'media/tdv-import/panorama_DC4452BD_D777_C379_41E5_1EDA7259DB75_t.jpg',
      'media/tdv-import/panorama_DC4452BD_D777_C379_41E5_1EDA7259DB75_t.webp',
      'media/tdv-import/panorama_DC44A2AB_D774_C319_41E5_339270552D3B_t.jpg',
      'media/tdv-import/panorama_DC44A2AB_D774_C319_41E5_339270552D3B_t.webp',
      'media/tdv-import/panorama_DC4530B4_D777_FF08_41E4_47F896114353_t.jpg',
      'media/tdv-import/panorama_DC4530B4_D777_FF08_41E4_47F896114353_t.webp',
      'media/tdv-import/panorama_DC45A6C1_D777_C308_41B5_775636919F4F_t.jpg',
      'media/tdv-import/panorama_DC45A6C1_D777_C308_41B5_775636919F4F_t.webp',
      'media/tdv-import/panorama_DC462273_D777_4309_41E4_17EF9CCCBD4C_t.jpg',
      'media/tdv-import/panorama_DC462273_D777_4309_41E4_17EF9CCCBD4C_t.webp',
      'media/tdv-import/panorama_DC467556_D777_C10B_41D1_4E673AAAA286_t.jpg',
      'media/tdv-import/panorama_DC467556_D777_C10B_41D1_4E673AAAA286_t.webp',
      'media/tdv-import/panorama_DC47BCE3_D777_4709_41E0_0857273CB166_t.jpg',
      'media/tdv-import/panorama_DC47BCE3_D777_4709_41E0_0857273CB166_t.webp',
      'media/tdv-import/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_t.jpg',
      'media/tdv-import/panorama_DC47BFD5_D777_C109_41E8_7CDCC241DDEB_t.webp',
      'media/tdv-import/panorama_DC50DD3E_D774_C17B_41E6_76ADB6C6217F_t.jpg',
      'media/tdv-import/panorama_DC50DD3E_D774_C17B_41E6_76ADB6C6217F_t.webp',
      'media/tdv-import/panorama_DC5B0CA0_D777_C707_41D6_CC02EF3AFBAD_t.jpg',
      'media/tdv-import/panorama_DC5B0CA0_D777_C707_41D6_CC02EF3AFBAD_t.webp',
      'media/tdv-import/panorama_DC5BA7E4_D777_410F_41E3_F0D566C2F4D7_t.jpg',
      'media/tdv-import/panorama_DC5BA7E4_D777_410F_41E3_F0D566C2F4D7_t.webp',
      'media/tdv-import/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_t.jpg',
      'media/tdv-import/panorama_DC5C1D26_D777_410B_41E1_2D89ADE704CD_t.webp',
      'media/tdv-import/panorama_DC5DE84D_D777_4F19_41B6_298BD1CC52E2_t.jpg',
      'media/tdv-import/panorama_DC5DE84D_D777_4F19_41B6_298BD1CC52E2_t.webp',
      'media/tdv-import/panorama_DC5E7314_D777_410F_41C9_B784BC991045_t.jpg',
      'media/tdv-import/panorama_DC5E7314_D777_410F_41C9_B784BC991045_t.webp',
      'media/tdv-import/panorama_DC5E97BE_D774_C17B_41E0_24BA91992222_t.jpg',
      'media/tdv-import/panorama_DC5E97BE_D774_C17B_41E0_24BA91992222_t.webp',
      'media/tdv-import/panorama_DC5F48A4_D774_CF0F_41BC_A28D6F8D7E53_t.jpg',
      'media/tdv-import/panorama_DC5F48A4_D774_CF0F_41BC_A28D6F8D7E53_t.webp',
      'media/tdv-import/panorama_DC5FADB7_D774_C109_41E0_A20BC05345FE_t.jpg',
      'media/tdv-import/panorama_DC5FADB7_D774_C109_41E0_A20BC05345FE_t.webp'
    ];
    
    existingThumbnails.forEach(url => urls.add(url));

    // Add config files
    urls.add('media/tdv-import/project.json');
    urls.add('media/tdv-import/hotspots.json');
    urls.add('floor-plan/floor-plan-config.json');

    return Array.from(urls);
  }

  /**
   * Get offline cache status
   */
  async getOfflineStatus() {
    if (!('serviceWorker' in navigator)) {
      return {
        mediaCount: 0,
        staticCount: 0,
        totalCount: 0,
        isReadyForOffline: false,
        version: 'unknown'
      };
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      const port = messageChannel.port1;
      port.start();

      port.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.ready.then((registration) => {
        registration.active.postMessage({
          type: 'GET_OFFLINE_STATUS'
        }, [messageChannel.port2]);
      });
    });
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

  /**
   * Get install prompt state
   */
  canShowInstallPrompt() {
    return this.promptEvent !== null && !this.isInstalled && !this.installPromptShown;
  }
}
