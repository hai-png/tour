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
    this.installProgress = 0;
    this.installStage = 'idle';

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
      return; // Exit early if not secure context
    }

    this.setupEventListeners();
    await this.registerServiceWorker();
    this.checkInstallability();
    this.monitorOnlineStatus();
    this.setupNavigationHandler();

    // Debug logging
    console.log('[PWA] Initialization complete');
    console.log('[PWA] isInstalled:', this.isInstalled);
    console.log('[PWA] isSecureContext:', window.isSecureContext);
    console.log('[PWA] manifest URL:', document.querySelector('link[rel="manifest"]')?.href);
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
        this.updateInstallProgress(10, 'Starting service worker...');

        this.swRegistration = await navigator.serviceWorker.register('./sw.js', {
          scope: './',
          updateViaCache: 'none'  // Always check for updates
        });

        this.updateInstallProgress(30, 'Service worker registered');
        console.log('[PWA] ✅ Service Worker registered:', this.swRegistration.scope);
        console.log('[PWA] Registration state:', this.swRegistration.state);
        console.log('[PWA] Active worker:', !!this.swRegistration.active);
        console.log('[PWA] Installing worker:', !!this.swRegistration.installing);
        console.log('[PWA] Waiting worker:', !!this.swRegistration.waiting);

        // Listen for updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found!');
          this.updateInstallProgress(50, 'Installing service worker...');
          const newWorker = this.swRegistration.installing;

          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] Worker state change:', newWorker.state);

            if (newWorker.state === 'installing') {
              this.updateInstallProgress(60, 'Installing...');
            } else if (newWorker.state === 'installed') {
              this.updateInstallProgress(80, 'Service worker installed');
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New content available');
                this.showUpdateNotification();
              } else {
                console.log('[PWA] Service worker ready');
                this.updateInstallProgress(90, 'Finalizing...');
              }
            } else if (newWorker.state === 'activating') {
              this.updateInstallProgress(95, 'Activating...');
            } else if (newWorker.state === 'activated') {
              this.updateInstallProgress(100, 'Ready');
            }
          });
        });

        // Wait for service worker to be ready, then check for install prompt
        await navigator.serviceWorker.ready;
        this.updateInstallProgress(100, 'Ready');
        console.log('[PWA] Service worker ready, checking install prompt...');

        // Dispatch a custom event to trigger install prompt check
        window.dispatchEvent(new CustomEvent('pwa-check-install'));

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
        this.updateInstallProgress(0, 'Failed to initialize');
      }
    } else {
      console.warn('[PWA] ❌ Service Worker is NOT supported in this browser');
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
      // Show progress container
      if (progress < 100) {
        progressEl.style.display = 'block';
      }

      // Update progress bar width
      progressBar.style.width = `${progress}%`;

      // Update status text
      if (status) {
        progressStatus.textContent = status;
      }

      // Hide progress when complete
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

    // Before install prompt (Chrome, Edge, Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
      this.isInstalled = false;
      console.log('[PWA] ✅ beforeinstallprompt event fired!');
      console.log('[PWA] promptEvent set:', !!this.promptEvent);
      console.log('[PWA] platforms:', e.platforms);

      // Update install button state immediately
      this.updateInstallButtonState();

      // Show install button immediately (no delay)
      if (!this.installPromptShown && this.promptEvent) {
        console.log('[PWA] Showing install button immediately');
        this.showInstallButton();
      }
    });

    // Listen for when the prompt is NOT fired (debugging)
    window.addEventListener('load', () => {
      console.log('[PWA] Page loaded, checking installability...');
      setTimeout(() => {
        if (!this.promptEvent) {
          console.log('[PWA] ⚠️ No prompt event after 3 seconds');
          console.log('[PWA] Possible reasons:');
          console.log('[PWA]   1. User previously dismissed install prompt');
          console.log('[PWA]   2. PWA criteria not met (check manifest)');
          console.log('[PWA]   3. Browser doesn\'t support install prompts');
          console.log('[PWA] Checking manifest...');
          fetch('manifest.json')
            .then(r => r.json())
            .then(m => {
              console.log('[PWA] Manifest loaded:', {
                name: m.name,
                short_name: m.short_name,
                display: m.display,
                icons: m.icons?.length || 0,
                start_url: m.start_url
              });
            })
            .catch(e => console.error('[PWA] Manifest error:', e));
        }
      }, 3000);
    });

    // Check for install prompt after service worker is ready
    window.addEventListener('pwa-check-install', () => {
      console.log('[PWA] pwa-check-install event received');
      console.log('[PWA] promptEvent:', !!this.promptEvent);
      
      // If we still don't have a prompt, try to manually trigger installability check
      if (!this.promptEvent) {
        this.checkInstallabilityManual();
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

    // Setup install button in settings
    setTimeout(() => this.setupInstallButton(), 500);
    
    // Setup offline download buttons
    setTimeout(() => this.setupOfflineDownloadButtons(), 1000);
  }

  /**
   * Setup install button in settings modal
   */
  setupInstallButton() {
    const installBtn = document.getElementById('btn-install-app');
    const installBtnText = document.getElementById('install-btn-text');
    const installHint = document.getElementById('install-hint');
    const installHintText = document.getElementById('install-hint-text');

    if (!installBtn) return;

    installBtn.addEventListener('click', () => {
      console.log('[PWA] Install button clicked in settings');
      this.promptInstall();
    });

    // Update button state based on install availability
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
        // Prompt not available - provide alternative instructions
        installBtnText.textContent = 'Install via Browser';
        installBtn.disabled = false;
        installBtn.onclick = () => this.showBrowserInstallHint();
        installHint.style.display = 'block';
        installHintText.textContent = 'Use your browser menu (⋮) → "Install HAI Tour" or "Create shortcut"';
      }
    };

    // Initial state update
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
      
      // Show progress modal
      const modal = document.getElementById('modal-offline-download');
      if (modal) {
        modal.classList.add('active');
        // Reset UI
        document.getElementById('offline-success-message').style.display = 'none';
        document.getElementById('btn-cancel-offline-download').style.display = 'inline-block';
      }

      try {
        const totalItems = await this.downloadForOffline(
          // Progress callback
          (progress) => {
            this.updateOfflineProgressUI(progress);
          },
          // Complete callback
          (result) => {
            this.updateOfflineProgressUI(result);
            // Show success message
            setTimeout(() => {
              document.getElementById('offline-success-message').style.display = 'block';
              document.getElementById('btn-cancel-offline-download').innerHTML = '<i class="fas fa-check"></i> Done';
            }, 500);
          }
        );

        console.log(`[PWA] Started downloading ${totalItems} items for offline access`);
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

    // Listen for service worker messages about cache completion
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'OFFLINE_CACHE_COMPLETE') {
          console.log('[PWA] Offline cache complete:', event.data);
          this.updateOfflineProgressUI({
            type: 'complete',
            ...event.data
          });
        } else if (event.data && event.data.type === 'SW_INSTALLED') {
          console.log('[PWA] SW Installed:', event.data);
        }
      });
    }
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
      
      if (data.result && data.result.url) {
        const fileName = data.result.url.split('/').pop();
        document.getElementById('offline-current-file').textContent = fileName + 
          (data.result.success ? ' ✓' : ' ✗');
      }
    } else if (data.type === 'complete') {
      document.getElementById('offline-progress-text').textContent = 'Download Complete!';
      document.getElementById('offline-progress-percent').textContent = '100%';
      document.getElementById('offline-progress-bar').style.width = '100%';
      document.getElementById('offline-stat-cached').textContent = data.cached;
      document.getElementById('offline-stat-pending').textContent = '0';
      document.getElementById('offline-stat-failed').textContent = data.failed || 0;
      document.getElementById('offline-current-file').textContent = 'All files cached successfully';
      
      // Update status display if visible
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
   * Manual installability check - triggers prompt if available
   */
  async checkInstallabilityManual() {
    console.log('[PWA] Manual installability check...');
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] Already running as standalone app');
      return;
    }
    
    // Check iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
      console.log('[PWA] iOS detected - showing install instructions');
      this.showIOSInstallInstructions();
      return;
    }
    
    // For Chrome/Edge - the beforeinstallprompt should have fired already
    // If not, the user may have previously dismissed it
    console.log('[PWA] No prompt available - user may have dismissed it previously');
    console.log('[PWA] To reset: Go to chrome://settings/content/siteDetails?site=https://hai-png.github.io and clear "Install" permission');
    
    // Update button to show manual install option
    if (this.updateInstallButtonState) {
      this.updateInstallButtonState();
    }
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
    // Show progress in loading screen
    this.updateInstallProgress(10, 'Preparing installation...');

    if (!this.promptEvent) {
      console.log('[PWA] Install prompt not available');

      // Show iOS instructions as fallback
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        this.updateInstallProgress(100, 'See instructions');
        this.showIOSInstallInstructions();
      } else {
        // Show message that app can be installed via browser menu
        this.updateInstallProgress(100, 'Use browser menu');
        this.showBrowserInstallHint();
      }

      // Update button state
      if (this.updateInstallButtonState) {
        this.updateInstallButtonState();
      }
      return;
    }

    this.updateInstallProgress(40, 'Launching installer...');
    this.promptEvent.prompt();
    const { outcome } = await this.promptEvent.userChoice;

    console.log('[PWA] User response to install prompt:', outcome);
    this.promptEvent = null;

    if (outcome === 'accepted') {
      this.updateInstallProgress(100, 'Installing...');
      this.hideInstallButton();
    } else {
      this.updateInstallProgress(0, 'Installation cancelled');
    }

    // Update button state
    if (this.updateInstallButtonState) {
      this.updateInstallButtonState();
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

    // Handle progress messages
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
          message: `Offline cache complete: ${data.cached}/${data.total} items cached (${data.successRate}% success rate)`
        });
      }
    };

    // Get all media URLs from the app
    const mediaUrls = await this.discoverAllMediaUrls();
    console.log(`[PWA] Discovered ${mediaUrls.length} media URLs to cache`);

    // Send cache command with message port
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
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

    // Add panoramas
    const panoramaFiles = await this.scanDirectory('media/tdv-import/panoramas/');
    panoramaFiles.forEach(file => {
      urls.add(`media/tdv-import/panoramas/${file}`);
      // Also add thumbnail versions
      const webpFile = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      if (webpFile !== file) {
        urls.add(`media/tdv-import/panoramas/${webpFile}`);
      }
    });

    // Add hotspot images
    const hotspotFiles = await this.scanDirectory('media/tdv-import/hotspots/');
    hotspotFiles.forEach(file => {
      urls.add(`media/tdv-import/hotspots/${file}`);
    });

    // Add floor plan images
    const floorPlanFiles = await this.scanDirectory('floor-plan/');
    floorPlanFiles.forEach(file => {
      if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        urls.add(`floor-plan/${file}`);
      }
    });

    // Add gallery images
    const galleryFiles = await this.scanDirectory('gallery/');
    galleryFiles.forEach(file => {
      urls.add(`gallery/${file}`);
    });

    // Add audio files
    const audioFiles = await this.scanDirectory('media/audio/');
    audioFiles.forEach(file => {
      urls.add(`media/audio/${file}`);
    });

    // Add skin/images
    const skinFiles = await this.scanDirectory('media/tdv-import/skin/');
    skinFiles.forEach(file => {
      urls.add(`media/tdv-import/skin/${file}`);
    });

    // Add config files
    urls.add('media/tdv-import/project.json');
    urls.add('media/tdv-import/hotspots.json');
    urls.add('floor-plan/floor-plan-config.json');

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

    return Array.from(urls);
  }

  /**
   * Scan directory for files (requires server support or manifest)
   */
  async scanDirectory(path) {
    try {
      // Try to fetch directory listing (works with some servers)
      const response = await fetch(path, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        return [];
      }

      // Try to get index file if it exists
      try {
        const indexResponse = await fetch(path + 'index.json');
        if (indexResponse.ok) {
          const data = await indexResponse.json();
          return data.files || [];
        }
      } catch (e) {
        // No index file
      }

      // Fallback: return empty array, files will be cached on-demand
      return [];
    } catch (error) {
      console.warn(`[PWA] Failed to scan directory ${path}:`, error);
      return [];
    }
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
        isReadyForOffline: false
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
   * Check if content is available offline
   */
  async isContentAvailableOffline() {
    const status = await this.getOfflineStatus();
    return status.isReadyForOffline;
  }
}
