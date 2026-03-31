/**
 * UI Manager - Handles all UI interactions
 * ============================================================
 */

export class UIManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.currentLanguage = 'en';
    this.isMuted = false;
    this.initEventListeners();
    this.initNewLayoutListeners();
    this.initSettingsControls();
    this.initDarkMode();
  }

  /**
   * Format room name by removing number prefix and handling floor names
   * - Remove leading numbers (e.g., "01_", "10_")
   * - Remove "first floor", "2nd floor", etc. EXCEPT for family rooms
   * - Capitalize words properly
   */
  formatRoomName(rawName) {
    if (!rawName) return '';

    let name = rawName;

    // Remove leading number and underscore (e.g., "01_", "10_")
    name = name.replace(/^\d+_\s*/, '');

    // Check if this is a family room (keep floor name for family rooms)
    const isFamilyRoom = name.toLowerCase().includes('family room');

    if (!isFamilyRoom) {
      // Remove floor references for non-family rooms
      name = name.replace(/^(first|1st|second|2nd|third|3rd|fourth|4th)\s+floor\s+/i, '');
    }

    // Capitalize each word
    name = name.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return name;
  }

  /**
   * Toggle dark mode on/off
   */
  toggleDarkMode() {
    const body = document.body;
    const btn = document.getElementById('btn-dark-mode');
    const icon = btn?.querySelector('i');
    const label = btn?.querySelector('span');

    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');

    // Save preference to localStorage
    localStorage.setItem('darkMode', isDark);

    // Update button icon and label
    if (icon) {
      icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (label) {
      const translationManager = this.tourPlayer?.translationManager;
      if (translationManager) {
        const key = isDark ? 'lightMode' : 'darkMode';
        label.textContent = translationManager.t(key) || (isDark ? 'Light Mode' : 'Dark Mode');
      }
    }
  }

  /**
   * Initialize dark mode from localStorage
   */
  initDarkMode() {
    const savedMode = localStorage.getItem('darkMode');
    const btn = document.getElementById('btn-dark-mode');
    const icon = btn?.querySelector('i');
    const label = btn?.querySelector('span');

    if (savedMode === 'true') {
      document.body.classList.add('dark-mode');
      if (icon) icon.className = 'fas fa-sun';
      if (label) {
        const translationManager = this.tourPlayer?.translationManager;
        if (translationManager) {
          label.textContent = translationManager.t('lightMode') || 'Light Mode';
        }
      }
    }
  }

  /**
   * Get scene name - uses raw name from project.json and formats it
   * Does NOT use translations for scene names to ensure consistent formatting
   */
  getSceneName(scene) {
    return this.formatRoomName(scene.name);
  }

  initNewLayoutListeners() {
    // Floor plan toggle
    document.getElementById('floor-plan-toggle')?.addEventListener('click', () => {
      const container = document.getElementById('floor-plan-container');
      const icon = document.querySelector('#floor-plan-toggle i');
      container.classList.toggle('collapsed');
      icon.className = container.classList.contains('collapsed')
        ? 'fas fa-chevron-down'
        : 'fas fa-chevron-up';
    });

    // Property Info button - opens modal
    document.getElementById('btn-prop-info')?.addEventListener('click', () => {
      this.openModal('property-info');
      this.updatePropertyInfoModal();
    });

    // Contact button on main page - opens contact modal
    document.getElementById('btn-contact-main')?.addEventListener('click', () => {
      this.openModal('contact-inquiry');
    });

    // Contact CTA button in property info modal - opens contact modal
    document.getElementById('btn-contact-cta')?.addEventListener('click', () => {
      this.openModal('contact-inquiry');
    });

    // Property info tabs
    document.querySelectorAll('.property-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchPropertyTab(tabId);
      });
    });

    // Copy property address
    document.getElementById('btn-copy-property-address')?.addEventListener('click', () => {
      navigator.clipboard.writeText('Waigani Drive, Port Moresby, NCD');
      this.showToast('Address copied to clipboard!');
    });

    // Open external map
    document.getElementById('btn-open-external-map')?.addEventListener('click', () => {
      window.open('https://maps.google.com/?q=-9.4431,147.1803', '_blank');
    });

    // Property contact form
    document.getElementById('property-contact-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.showToast('Inquiry sent successfully!');
      e.target.reset();
    });

    // Modal property info buttons
    document.getElementById('btn-modal-location')?.addEventListener('click', () => {
      this.openModal('location');
      document.getElementById('modal-property-info')?.classList.remove('active');
    });

    document.getElementById('btn-modal-contact')?.addEventListener('click', () => {
      this.openModal('contact');
      document.getElementById('modal-property-info')?.classList.remove('active');
    });

    // Gallery widget
    document.getElementById('btn-gallery-widget')?.addEventListener('click', () => {
      this.toggleGalleryWidget();
    });

    document.getElementById('btn-gallery-close')?.addEventListener('click', () => {
      this.closeGalleryWidget();
    });

    // Dark Mode Toggle
    document.getElementById('btn-dark-mode')?.addEventListener('click', () => {
      this.toggleDarkMode();
    });

    // Horizontal room list navigation
    document.getElementById('room-prev')?.addEventListener('click', () => {
      this.tourPlayer.prevScene();
    });

    document.getElementById('room-next')?.addEventListener('click', () => {
      this.tourPlayer.nextScene();
    });

    // Intro controls (on loading screen)
    document.getElementById('intro-prev')?.addEventListener('click', () => {
      this.tourPlayer.prevScene();
      this.updateIntroControls();
    });

    document.getElementById('intro-next')?.addEventListener('click', () => {
      this.tourPlayer.nextScene();
      this.updateIntroControls();
    });

    document.getElementById('btn-start-tour')?.addEventListener('click', () => {
      this.startTour();
    });
  }

  /**
   * Switch property info tab
   */
  switchPropertyTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.property-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab panels
    document.querySelectorAll('.property-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    // Invalidate map size if switching to location tab
    if (tabId === 'location' && this.propertyMap) {
      setTimeout(() => {
        this.propertyMap.invalidateSize();
      }, 100);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: var(--text);
      padding: 12px 24px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  toggleGalleryWidget() {
    // Open lightbox with gallery
    if (this.tourPlayer.galleryManager) {
      this.tourPlayer.galleryManager.openLightbox(0);
    }
  }

  closeGalleryWidget() {
    const content = document.getElementById('gallery-widget-content');
    if (content) {
      content.classList.add('hidden');
    }
  }

  /**
   * Update gallery widget with thumbnails and count
   */
  updateGalleryWidget() {
    const preview1 = document.getElementById('gallery-preview-1');
    const preview2 = document.getElementById('gallery-preview-2');
    const countBadge = document.getElementById('gallery-preview-count');
    const mediaCount = document.getElementById('gallery-media-count');
    
    if (!preview1 || !preview2 || !countBadge || !mediaCount) return;
    
    const galleryManager = this.tourPlayer.galleryManager;
    if (!galleryManager || !galleryManager.images) return;
    
    const images = galleryManager.images;
    const totalImages = images.length;
    
    // Set first two thumbnails
    if (images.length >= 1) {
      const img1 = preview1.querySelector('img');
      if (img1) {
        img1.src = images[0].thumbnail;
        img1.alt = images[0].title;
      }
    }
    
    if (images.length >= 2) {
      const img2 = preview2.querySelector('img');
      if (img2) {
        img2.src = images[1].thumbnail;
        img2.alt = images[1].title;
      }
    }
    
    // Set count badge
    const remainingCount = Math.max(0, totalImages - 2);
    countBadge.querySelector('span').textContent = `+${remainingCount}`;
    
    // Set media count text
    mediaCount.textContent = `${totalImages} Photos & Videos`;
    
    // Add click handler to open lightbox
    const galleryBar = document.getElementById('gallery-widget-bar');
    if (galleryBar) {
      galleryBar.addEventListener('click', (e) => {
        if (!e.target.closest('.gallery-grid-btn')) {
          this.tourPlayer.galleryManager.openLightbox(0);
        }
      });
    }
    
    // Add click handler to grid button
    const gridBtn = document.getElementById('btn-gallery-grid');
    if (gridBtn) {
      gridBtn.addEventListener('click', () => {
        this.tourPlayer.galleryManager.openLightbox(0);
      });
    }
  }

  toggleSound() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btn-sound');
    if (btn) {
      const icon = btn.querySelector('i');
      const label = btn.querySelector('span');
      if (this.isMuted) {
        icon.className = 'fas fa-volume-mute';
        if (label) label.textContent = 'Muted';
      } else {
        icon.className = 'fas fa-volume-up';
        if (label) label.textContent = 'Sound';
      }
    }
    // Use AudioManager's toggleMute
    if (this.tourPlayer.audioManager) {
      this.tourPlayer.audioManager.toggleMute();
    }
  }

  updateIntroControls() {
    const scene = this.tourPlayer.project?.scenes[this.tourPlayer.currentSceneIndex];
    if (!scene) return;

    const nameEl = document.getElementById('intro-room-name');
    const counterEl = document.getElementById('intro-room-counter');
    
    if (nameEl) nameEl.textContent = scene.name;
    if (counterEl) {
      const index = this.tourPlayer.currentSceneIndex + 1;
      const total = this.tourPlayer.project.scenes.length;
      counterEl.textContent = `${index} of ${total}`;
    }
  }

  startTour() {
    // Read settings from loading screen
    const autoRotateEnabled = document.getElementById('setting-auto-rotate')?.checked ?? true;
    const startGuidedTour = document.getElementById('setting-guided-tour')?.checked ?? false;

    // Apply auto-rotate setting
    if (this.tourPlayer) {
      this.tourPlayer.autoRotate = autoRotateEnabled;
      if (!autoRotateEnabled) {
        this.tourPlayer.lastInteraction = performance.now(); // Prevent auto-rotate from starting
      }
    }

    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    // Start guided tour if selected
    if (startGuidedTour && this.tourPlayer?.guidedTourManager) {
      setTimeout(() => {
        this.tourPlayer.guidedTourManager.startTour();
      }, 500);
    }
  }

  /**
   * Start the guided tour directly
   */
  startGuidedTour() {
    // Open the guided tour modal and start the tour
    this.openModal('guided-tour');
    
    // Start the tour after a short delay to ensure modal is rendered
    setTimeout(() => {
      if (this.tourPlayer.guidedTourManager) {
        this.tourPlayer.guidedTourManager.startTour();
      }
    }, 300);
  }

  /**
   * Populate loading screen room list
   */
  populateLoadingRoomList() {
    const grid = document.getElementById('loading-room-grid');
    const scenesEl = document.getElementById('stat-total-scenes');
    const hotspotsEl = document.getElementById('stat-total-hotspots');
    const floorsEl = document.getElementById('stat-total-floors');

    if (!grid || !this.tourPlayer.project) return;

    const scenes = this.tourPlayer.project.scenes;

    // Update stats
    if (scenesEl) scenesEl.textContent = scenes.length;

    const totalHotspots = scenes.reduce((sum, s) => sum + (s.hotspots?.length || 0), 0);
    if (hotspotsEl) hotspotsEl.textContent = totalHotspots;

    const totalFloors = this.tourPlayer.floorPlanManager?.floorplans?.length || 1;
    if (floorsEl) floorsEl.textContent = totalFloors;

    // Populate room grid (show first 8 rooms as preview)
    const previewRooms = scenes.slice(0, 8);
    grid.innerHTML = previewRooms.map((scene, i) => `
      <div class="loading-room-item ${i === 0 ? 'active' : ''}" data-index="${i}">
        <img src="${scene.thumbnailUrl}" alt="${scene.name}" loading="lazy"
          onerror="this.style.background='#1e293b'" />
        <div class="room-name">${scene.name}</div>
      </div>
    `).join('');

    // Add click listeners
    grid.querySelectorAll('.loading-room-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.tourPlayer.loadScene(index);
        // Highlight selected
        grid.querySelectorAll('.loading-room-item').forEach((el, i) => {
          el.classList.toggle('active', i === index);
        });
      });
    });
  }

  updatePropertyInfoModal() {
    const project = this.tourPlayer.project;
    if (!project) return;

    // Update stats
    const scenes = project.scenes;
    const totalHotspots = scenes.reduce((sum, s) => sum + (s.hotspots?.length || 0), 0);
    const totalFloors = this.tourPlayer.floorPlanManager?.floorplans?.length || 1;

    // Update quick stats
    const roomsEl = document.getElementById('stat-total-rooms');
    const hotspotsEl = document.getElementById('stat-total-hotspots-prop');
    const floorsEl = document.getElementById('stat-total-floors-prop');
    
    if (roomsEl) roomsEl.textContent = scenes.length;
    if (hotspotsEl) hotspotsEl.textContent = totalHotspots;
    if (floorsEl) floorsEl.textContent = totalFloors;

    // Initialize Leaflet map
    this.initPropertyMap();
  }

  /**
   * Initialize Leaflet map for property location
   */
  initPropertyMap() {
    const mapContainer = document.getElementById('property-map');
    if (!mapContainer) return;

    // Clear any existing map
    mapContainer.innerHTML = '';
    mapContainer.style.position = 'relative';

    // Property coordinates - Port Moresby, PNG
    const propertyLat = -9.4431;
    const propertyLng = 147.1803;

    // Create map with dark theme
    const map = L.map('property-map', {
      center: [propertyLat, propertyLng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    });

    // Add dark matter tiles (CartoDB)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Custom marker icon
    const propertyIcon = L.divIcon({
      className: 'property-marker',
      html: `<div style="
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        border: 3px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <i class="fas fa-home" style="
          color: #fff;
          font-size: 18px;
          transform: rotate(45deg);
        "></i>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    // Add property marker
    const marker = L.marker([propertyLat, propertyLng], { icon: propertyIcon }).addTo(map);

    // Add popup
    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #6366f1; font-size: 14px;">HAI PNG Property</h4>
        <p style="margin: 0; color: #666; font-size: 12px;">Waigani Drive, Port Moresby</p>
      </div>
    `).openPopup();

    // Force map resize after modal is fully visible
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // Store map reference for later invalidation
    this.propertyMap = map;
  }

  initEventListeners() {
    // Action buttons
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.openModal('settings');
      this.updateZoomLevelDisplay();
    });
    document.getElementById('btn-language')?.addEventListener('click', () => this.openModal('language'));
    document.getElementById('btn-location')?.addEventListener('click', () => this.openModal('location'));
    // Guided tour button - start tour directly
    document.getElementById('btn-guided-tour')?.addEventListener('click', () => {
      this.startGuidedTour();
    });

    // Guided tour start button in settings
    document.getElementById('btn-guided-tour-settings')?.addEventListener('click', () => {
      const tourType = document.getElementById('guided-tour-type')?.value || 'text';
      if (this.tourPlayer?.guidedTourManager) {
        this.tourPlayer.guidedTourManager.tourType = tourType;
        this.tourPlayer.guidedTourManager.startTour();
        this.closeModal('settings');
      }
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      document.getElementById('viewer-container').requestFullscreen();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this.tourPlayer.resetView();
    });

    // Capture viewport button
    document.getElementById('btn-capture-viewport')?.addEventListener('click', () => {
      if (this.tourPlayer.captureViewManager) {
        this.tourPlayer.captureViewManager.captureView();
      }
    });

    // Zoom controls
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.adjustZoom(10);
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.adjustZoom(-10);
    });

    // Share button - opens share modal
    document.getElementById('btn-share')?.addEventListener('click', () => {
      this.openShareModal();
    });

    // Share modal options
    document.querySelectorAll('.share-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const shareType = option.dataset.share;
        this.shareToPlatform(shareType);
      });
    });

    // Copy link button
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
      this.copyShareLink();
    });

    // Language selection
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        this.setLanguage(lang);
      });
    });

    // Settings zoom controls
    document.getElementById('btn-settings-zoom-in')?.addEventListener('click', () => {
      this.adjustZoom(5);
    });
    document.getElementById('btn-settings-zoom-out')?.addEventListener('click', () => {
      this.adjustZoom(-5);
    });
    document.getElementById('btn-settings-zoom-reset')?.addEventListener('click', () => {
      this.resetZoom();
    });

    // Quality selector
    document.getElementById('settings-quality')?.addEventListener('change', (e) => {
      this.setQuality(e.target.value);
    });

    // Sensitivity slider
    document.getElementById('settings-sensitivity')?.addEventListener('input', (e) => {
      this.setSensitivity(parseInt(e.target.value));
    });

    // VR mode toggle
    document.getElementById('toggle-vr-mode')?.addEventListener('click', function() {
      this.classList.toggle('active');
      const isEnabled = this.classList.contains('active');
      
      // Apply VR mode settings
      if (this.tourPlayer.viewer) {
        if (isEnabled) {
          // Enable VR mode - split screen, wider FOV
          this.tourPlayer.viewer.setFov(90);
          document.getElementById('viewer-container').classList.add('vr-mode');
        } else {
          // Disable VR mode
          this.tourPlayer.viewer.setFov(75);
          document.getElementById('viewer-container').classList.remove('vr-mode');
        }
      }
      
      console.log('[UIManager] VR Mode:', isEnabled ? 'enabled' : 'disabled');
    });

    // Motion sensitivity slider
    const sensitivitySlider = document.getElementById('settings-sensitivity');
    if (sensitivitySlider) {
      sensitivitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        // Map 1-10 to sensitivity multiplier (0.5 - 2.0)
        const sensitivity = 0.5 + (value - 1) * (1.5 / 9);
        
        if (this.tourPlayer.viewer) {
          this.tourPlayer.viewer.setSensitivity(sensitivity);
        }
        
        console.log('[UIManager] Motion Sensitivity set to:', sensitivity.toFixed(2));
      });
    }

    // Watermark toggle
    document.getElementById('toggle-watermark')?.addEventListener('click', function() {
      this.classList.toggle('active');
      if (this.tourPlayer.captureViewManager) {
        this.tourPlayer.captureViewManager.watermark.enabled = this.classList.contains('active');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.tourPlayer.prevScene();
      if (e.key === 'ArrowRight') this.tourPlayer.nextScene();
      if (e.key === 'Escape') this.closeAllModals();
    });
  }
  
  setLanguage(lang) {
    this.currentLanguage = lang;

    // Update UI
    document.querySelectorAll('.language-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });

    // Use TranslationManager if available
    if (this.tourPlayer.translationManager) {
      this.tourPlayer.translationManager.setLanguage(lang);
    }

    console.log(`[UIManager] Language changed to: ${lang}`);
    this.closeModal('language');
  }

  /**
   * Share on social media platforms
   */
  shareOnSocial(platform) {
    const tourUrl = encodeURIComponent(window.location.href);
    const tourTitle = encodeURIComponent(this.tourPlayer.project?.name || 'HAI PNG Virtual Tour');

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${tourUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${tourUrl}&text=${tourTitle}`,
      whatsapp: `https://wa.me/?text=${tourTitle}%20${tourUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${tourUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${tourUrl}&description=${tourTitle}`,
      email: `mailto:?subject=${tourTitle}&body=Check out this virtual tour: ${window.location.href}`
    };

    if (shareUrls[platform]) {
      if (platform === 'email') {
        window.location.href = shareUrls[platform];
      } else {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      }
    }
  }

  /**
   * Share to platform (new share modal)
   */
  shareToPlatform(platform) {
    const tourUrl = window.location.href;
    const tourTitle = this.tourPlayer.project?.name || 'HAI PNG Virtual Tour';
    const encodedUrl = encodeURIComponent(tourUrl);
    const encodedTitle = encodeURIComponent(tourTitle);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      copy: 'copy'
    };

    if (platform === 'copy') {
      this.copyShareLink();
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }

  /**
   * Copy share link to clipboard
   */
  copyShareLink() {
    const tourUrl = window.location.href;
    navigator.clipboard.writeText(tourUrl).then(() => {
      // Show success feedback
      const btn = document.getElementById('btn-copy-link');
      if (btn) {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          btn.innerHTML = originalIcon;
        }, 2000);
      }
    }).catch(() => {
      // Fallback
      const input = document.getElementById('share-link');
      if (input) {
        input.select();
        document.execCommand('copy');
      }
    });
  }

  /**
   * Open share modal with QR code
   */
  openShareModal() {
    const modal = document.getElementById('modal-share');
    if (!modal) return;

    // Set the share link
    const shareLinkInput = document.getElementById('share-link-input');
    if (shareLinkInput) {
      shareLinkInput.value = window.location.href;
    }

    modal.classList.add('active');

    // Generate QR code after modal is fully visible
    setTimeout(() => {
      this.generateQRCode(window.location.href);
    }, 200);
  }

  /**
   * Generate QR code using QRCode library
   */
  async generateQRCode(url) {
    const container = document.getElementById('qr-code-container');
    if (!container) {
      console.error('[UIManager] QR code container not found');
      return;
    }

    // Clear container
    container.innerHTML = '';

    console.log('[UIManager] Generating QR code for:', url);
    console.log('[UIManager] QRCode library available:', typeof window.QRCode !== 'undefined');

    try {
      if (typeof window.QRCode !== 'undefined') {
        // QRCode.js needs a div element, not canvas
        const qrDiv = document.createElement('div');
        qrDiv.id = 'qr-code-div';
        qrDiv.style.cssText = 'width:150px;height:150px;';
        container.appendChild(qrDiv);
        
        // Use QRCode.js library
        new window.QRCode(qrDiv, {
          text: url,
          width: 150,
          height: 150,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
        console.log('[UIManager] QR code generated successfully');
      } else {
        console.warn('[UIManager] QRCode library not loaded, using fallback');
        this.generateSimpleQRCode(url, container);
      }
    } catch (error) {
      console.error('[UIManager] QR Code generation failed:', error);
      this.generateSimpleQRCode(url, container);
    }
  }

  /**
   * Fallback simple QR code generator
   */
  generateSimpleQRCode(url, container) {
    if (!container) return;

    // Create a simple visual placeholder
    container.innerHTML = `
      <div class="qr-placeholder">
        <i class="fas fa-qrcode" style="font-size:60px;color:#0f172a;margin-bottom:10px;"></i>
        <p style="font-size:11px;color:#666;text-align:center;">Scan to view tour</p>
      </div>
    `;
  }

  /**
   * Adjust zoom level
   */
  adjustZoom(delta) {
    if (this.tourPlayer.viewer) {
      const currentFov = this.tourPlayer.viewer.fov;
      const newFov = Math.max(30, Math.min(120, currentFov - delta));
      this.tourPlayer.viewer.setFov(newFov);
      this.updateZoomLevelDisplay();
    }
  }

  /**
   * Reset zoom to default
   */
  resetZoom() {
    if (this.tourPlayer.viewer) {
      this.tourPlayer.viewer.setFov(75);
      this.updateZoomLevelDisplay();
    }
  }

  /**
   * Update zoom level display
   */
  updateZoomLevelDisplay() {
    const zoomLevelEl = document.getElementById('settings-zoom-level');
    if (zoomLevelEl && this.tourPlayer.viewer) {
      const fov = Math.round(this.tourPlayer.viewer.fov);
      zoomLevelEl.textContent = `${fov}°`;
    }
  }

  /**
   * Set quality setting
   */
  setQuality(quality) {
    console.log('[UIManager] Quality set to:', quality);
    // Quality logic can be implemented here
    // For example, adjust texture resolution based on quality
  }

  /**
   * Set motion sensitivity
   */
  setSensitivity(value) {
    console.log('[UIManager] Sensitivity set to:', value);
    // Sensitivity logic can be implemented here
    // For example, adjust mouse/touch sensitivity
  }
  
  updateFloatingInfoCard(scene) {
    const titleEl = document.getElementById('info-card-title');
    const descEl = document.getElementById('info-card-description');
    const metaEl = document.querySelector('.info-card-meta');

    if (titleEl) titleEl.textContent = scene.name;
    if (descEl) descEl.textContent = scene.metadata?.description || `Explore ${scene.name}`;
    if (metaEl) {
      const sceneIndex = this.tourPlayer.project.scenes.findIndex(s => s.id === scene.id);
      metaEl.innerHTML = `
        <span><i class="fas fa-door-open"></i> Room ${sceneIndex + 1} of ${this.tourPlayer.project.scenes.length}</span>
        <span><i class="fas fa-map-pin"></i> ${scene.hotspots.length} hotspots</span>
      `;
    }

    // Update prop info panel
    const propNameEl = document.getElementById('prop-room-name');
    const propDescEl = document.getElementById('prop-room-desc');
    if (propNameEl) propNameEl.textContent = scene.name;
    if (propDescEl) propDescEl.textContent = scene.metadata?.description || `Explore ${scene.name}`;

    // Update current room display in top bar
    const currentRoomEl = document.getElementById('current-room-name');
    if (currentRoomEl) {
      currentRoomEl.textContent = this.getSceneName(scene);
    }
  }

  updateSceneList(activeIndex) {
    const list = document.getElementById('room-list-items');
    if (!list) return;

    if (list.children.length === 0) {
      list.innerHTML = '';
      this.tourPlayer.project.scenes.forEach((scene, i) => {
        const item = document.createElement('div');
        item.className = 'room-item-horizontal' + (i === activeIndex ? ' active' : '');

        // Get formatted scene name (removes numbers, keeps floor for family rooms)
        const formattedName = this.getSceneName(scene);

        item.innerHTML = `
          <img src="${scene.thumbnailUrl}" alt="${scene.name}" onerror="this.style.background='#1e293b'" />
          <div class="room-name-overlay">${formattedName}</div>
        `;
        item.addEventListener('click', () => this.tourPlayer.loadScene(i));
        list.appendChild(item);
      });
    } else {
      document.querySelectorAll('.room-item-horizontal').forEach((item, i) => {
        item.classList.toggle('active', i === activeIndex);
      });
    }

    // Scroll active item into view
    const activeItem = list.querySelector('.room-item-horizontal.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
  
  updateNavLabels(index, scenes) {
    const prevLabel = document.getElementById('nav-prev-label');
    const nextLabel = document.getElementById('nav-next-label');
    if (prevLabel && index > 0) {
      const prevSceneKey = 'scene_' + scenes[index - 1].name.replace(/ /g, '_').replace(/[&]/g, '');
      prevLabel.textContent = this.tourPlayer.translationManager.t(prevSceneKey) || scenes[index - 1].name;
    }
    if (nextLabel && index < scenes.length - 1) {
      const nextSceneKey = 'scene_' + scenes[index + 1].name.replace(/ /g, '_').replace(/[&]/g, '');
      nextLabel.textContent = this.tourPlayer.translationManager.t(nextSceneKey) || scenes[index + 1].name;
    }
  }
  
  updateCompass(yaw) {
    // Compass removed - replaced with location component
  }
  
  openModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (!modal) return;

    // Populate tour info with project data
    if (name === 'info' && this.tourPlayer.project) {
      this.populateTourInfo();
    }

    // Sync auto-rotate toggle state when opening settings
    if (name === 'settings') {
      const autorotateToggle = document.getElementById('toggle-autorotate');
      if (autorotateToggle && this.tourPlayer) {
        autorotateToggle.classList.toggle('active', this.tourPlayer.autoRotate);
      }
    }

    modal.classList.add('active');
  }
  
  populateTourInfo() {
    const project = this.tourPlayer.project;
    if (!project) return;
    
    // Update title
    const titleEl = document.getElementById('tour-info-title');
    if (titleEl) titleEl.textContent = project.name || 'HAI PNG Virtual Tour';
    
    // Update property description
    const descEl = document.getElementById('property-description-text');
    if (descEl) {
      descEl.textContent = project.description || 
        'This stunning multi-level property features modern architecture with spacious living areas, ' +
        'floor-to-ceiling windows, and premium finishes throughout. The open-concept design seamlessly ' +
        'connects indoor and outdoor living spaces, perfect for entertaining.';
    }
    
    // Update stats
    const totalHotspots = project.scenes.reduce((sum, scene) => sum + scene.hotspots.length, 0);
    
    document.getElementById('stat-scenes').textContent = project.scenes.length;
    document.getElementById('stat-hotspots').textContent = totalHotspots;
    document.getElementById('stat-floors-tour').textContent = this.tourPlayer.floorPlanManager?.floorplans?.length || 2;
    document.getElementById('stat-tours').textContent = '1';
  }
  
  closeModal(name) {
    document.getElementById(`modal-${name}`)?.classList.remove('active');
  }
  
  closeAllModals() {
    ['settings', 'info', 'gallery', 'contact', 'language', 'location', 'guided-tour', 'share'].forEach(name => this.closeModal(name));
  }
  
  toggleSetting(setting) {
    if (setting === 'autorotate') {
      const isActive = this.tourPlayer.toggleAutoRotate();
      const toggle = document.getElementById('toggle-autorotate');
      if (toggle) {
        toggle.classList.toggle('active', isActive);
      }
    }
  }

  /**
   * Initialize settings controls
   */
  initSettingsControls() {
    // Small delay to ensure tourPlayer is fully initialized
    setTimeout(() => {
      // Zoom/FOV slider
      const zoomSlider = document.getElementById('settings-zoom');
      const zoomValue = document.getElementById('settings-zoom-value');
      
      if (zoomSlider && zoomValue && this.tourPlayer?.viewer) {
        // Set initial value from default FOV
        const currentFOV = this.tourPlayer.defaultFOV || this.tourPlayer.viewer.fov || 60;
        zoomSlider.value = currentFOV;
        zoomValue.textContent = `${currentFOV}°`;
        
        zoomSlider.addEventListener('input', (e) => {
          const fov = parseInt(e.target.value);
          zoomValue.textContent = `${fov}°`;
          if (this.tourPlayer) {
            this.tourPlayer.setFOV(fov);
          }
        });
        
        console.log(`[UIManager] Zoom slider initialized at ${currentFOV}°`);
      }

      // Auto-rotate toggle - sync with current state
      const autorotateToggle = document.getElementById('toggle-autorotate');
      if (autorotateToggle && this.tourPlayer) {
        // Sync with actual auto-rotate state
        autorotateToggle.classList.toggle('active', this.tourPlayer.autoRotate);
      }
    }, 500);
  }
}
