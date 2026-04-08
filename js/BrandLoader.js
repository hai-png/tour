/**
 * Brand Loader - Dynamic Brand Theming System
 * ============================================================
 * Loads brand configuration and applies theme dynamically
 * Supports GitHub Pages hosting with brand subdirectories
 */

export class BrandLoader {
  constructor() {
    this.brandConfig = null;
    this.brandSlug = this.detectBrandFromURL();
    this.isLoaded = false;
  }

  /**
   * Detect brand from URL path or query parameter
   * Supports: /brand-name/ or ?brand=brand-name
   */
  detectBrandFromURL() {
    // Check query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const brandParam = urlParams.get('brand');
    if (brandParam) {
      return brandParam.toLowerCase();
    }

    // Check URL path: /brand-name/...
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      // Check if first path segment is a brand
      const potentialBrand = pathParts[0].toLowerCase();
      const knownBrands = ['ayat', 'demahope', 'gift', 'hosea', 'metropolitan', 'temer'];
      if (knownBrands.includes(potentialBrand)) {
        return potentialBrand;
      }
    }

    return null;
  }

  /**
   * Get the base path for the repo (handles GitHub Pages subdirectory)
   */
  getBasePath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 0) {
      const knownBrands = ['ayat', 'demahope', 'gift', 'hosea', 'metropolitan', 'temer'];
      if (knownBrands.includes(parts[0].toLowerCase())) return '/';
      return `/${parts[0]}`;
    }
    return '';
  }

  /**
   * Resolve a relative asset path to absolute with repo base path
   */
  resolveAssetPath(assetPath) {
    if (!assetPath) return '';
    if (assetPath.startsWith('/') || assetPath.startsWith('http')) return assetPath;
    const basePath = this.getBasePath();
    return `${basePath}/${assetPath}`;
  }

  /**
   * Get hero image path from brand folder
   */
  getHeroImagePath() {
    if (!this.brandConfig || !this.brandConfig.hero) return null;
    return this.resolveAssetPath(this.brandConfig.hero);
  }

  /**
   * Load brand configuration JSON
   */
  async loadBrandConfig() {
    if (!this.brandSlug) {
      console.log('[BrandLoader] No brand detected, using default');
      return null;
    }

    try {
      const basePath = this.getBasePath();
      const possiblePaths = [
        `${basePath}/_brands/${this.brandSlug}/brand-config.json`,
        `/_brands/${this.brandSlug}/brand-config.json`,
        `./_brands/${this.brandSlug}/brand-config.json`,
      ];

      for (const path of possiblePaths) {
        try {
          console.log(`[BrandLoader] Trying to load: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            this.brandConfig = await response.json();
            this.isLoaded = true;
            console.log(`[BrandLoader] Loaded brand config: ${this.brandSlug}`);
            return this.brandConfig;
          }
        } catch (e) {
          // Try next path
          continue;
        }
      }

      console.warn(`[BrandLoader] Brand config not found for: ${this.brandSlug}`);
      return null;
    } catch (error) {
      console.error('[BrandLoader] Error loading brand config:', error);
      return null;
    }
  }

  /**
   * Apply brand theme to CSS custom properties
   * Simply replaces blue colors with brand colors
   */
  applyTheme() {
    if (!this.brandConfig || !this.brandConfig.theme) {
      console.log('[BrandLoader] No theme to apply');
      return;
    }

    const theme = this.brandConfig.theme;
    const root = document.documentElement;

    // Override the blue CSS variables with brand colors
    // This replaces: --primary, --primary-dark, --primary-light, --secondary
    const cssVars = {
      '--primary': theme.primary,
      '--primary-dark': theme.primaryDark,
      '--primary-light': theme.primaryLight || theme.primary,
      '--secondary': theme.primaryLight || theme.primary,
      '--bg-glass': theme.primaryAlpha || theme.primary + '99',
      '--border-accent': theme.primaryAlpha || theme.primary + '33',
    };

    // Apply to :root
    Object.entries(cssVars).forEach(([prop, value]) => {
      if (value) {
        root.style.setProperty(prop, value);
      }
    });

    // Apply dark mode overrides
    if (theme.dark) {
      const darkVars = {
        '--primary': theme.primaryLight || theme.primary,
        '--primary-dark': theme.primary,
        '--primary-light': theme.primaryLight || theme.primary,
        '--secondary': theme.primaryLight || theme.primary,
        '--border-accent': theme.primaryAlpha || theme.primary + '4D',
      };

      // Store for dark mode
      root.style.setProperty('--brand-dark-primary', theme.primaryLight || theme.primary);
      root.style.setProperty('--brand-dark-primary-dark', theme.primary);
      root.style.setProperty('--brand-dark-primary-light', theme.primaryLight || theme.primary);

      Object.entries(darkVars).forEach(([prop, value]) => {
        if (value) {
          root.style.setProperty(prop, value);
        }
      });
    }

    // Add body class for brand
    document.body.classList.add(`brand-${this.brandSlug}`);

    console.log(`[BrandLoader] Theme applied: ${this.brandSlug} - Primary: ${theme.primary}`);
  }

  /**
   * Update loading screen with brand-specific content
   */
  updateLoadingScreen() {
    if (!this.brandConfig) {
      console.log('[BrandLoader] No brand config to update loading screen');
      return;
    }

    const brand = this.brandConfig.brand;
    const pwa = this.brandConfig.pwa;
    const ui = this.brandConfig.ui;

    // Update loading logo
    const loadingLogo = document.querySelector('.loading-logo');
    if (loadingLogo && brand.logo) {
      loadingLogo.src = this.resolveAssetPath(brand.logo);
      loadingLogo.alt = brand.companyName;
      loadingLogo.onerror = () => {
        loadingLogo.src = 'media/tdv-import/skin/logo.webp';
      };
    }

    // Update loading title
    const loadingTitle = document.querySelector('.loading-header h1');
    if (loadingTitle) {
      loadingTitle.textContent = `${brand.companyName} Virtual Tour`;
    }

    // Update loading subtitle
    const loadingSubtitle = document.querySelector('.loading-subtitle');
    if (loadingSubtitle && brand.tagline) {
      loadingSubtitle.textContent = brand.tagline;
    }

    // Update brand container logo
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo && brand.logo) {
      brandLogo.src = this.resolveAssetPath(brand.logo);
      brandLogo.alt = brand.shortName;
      brandLogo.onerror = () => {
        brandLogo.src = 'media/tdv-import/skin/logo.webp';
      };
    }

    // Update property info modal logo
    const propertyInfoLogo = document.querySelector('.property-info-logo img');
    if (propertyInfoLogo && brand.logo) {
      propertyInfoLogo.src = this.resolveAssetPath(brand.logo);
      propertyInfoLogo.alt = brand.companyName;
      propertyInfoLogo.onerror = () => {
        propertyInfoLogo.src = 'media/tdv-import/skin/logo.webp';
      };
    }

    // Update brand text
    const brandText = document.querySelector('.brand-text h1');
    if (brandText) {
      brandText.textContent = brand.shortName;
    }

    const brandTagline = document.querySelector('.brand-text p');
    if (brandTagline) {
      brandTagline.textContent = brand.tagline || 'Virtual Tour';
    }

    // Update page title
    if (pwa && pwa.name) {
      document.title = `${pwa.name} - Virtual Tour`;
    }

    // Update loading button text
    const enterButton = document.querySelector('.btn-start-tour-modern .btn-title');
    if (enterButton && ui && ui.labels && ui.labels.enterButton) {
      enterButton.textContent = ui.labels.enterButton;
    }

    // Update loading status text
    const loadingStatusText = document.getElementById('loading-status-text');
    if (loadingStatusText && ui && ui.intro) {
      loadingStatusText.textContent = ui.intro.loadingText || 'Loading...';
    }

    console.log('[BrandLoader] Loading screen updated');
  }

  /**
   * Update contact modal with brand info
   */
  updateContactInfo() {
    if (!this.brandConfig || !this.brandConfig.contact) {
      return;
    }

    const contact = this.brandConfig.contact;
    const project = this.brandConfig.project;

    // Update contact cards grid (property info modal)
    const contactCardsGrid = document.querySelector('.contact-cards-grid');
    if (contactCardsGrid) {
      let cardsHtml = '';

      // Phone cards
      if (contact.phones && contact.phones.length > 0) {
        const primaryPhone = contact.phones.find(p => p.primary) || contact.phones[0];
        cardsHtml += `
          <div class="contact-card">
            <i class="fas fa-phone-alt"></i>
            <div>
              <strong>${primaryPhone.label || 'Phone'}</strong>
              <p>${primaryPhone.display || primaryPhone.value}</p>
            </div>
            <a href="${primaryPhone.tel}" class="contact-action-link">
              <i class="fas fa-phone"></i> Call
            </a>
          </div>
        `;
      }

      // Email card
      if (contact.emails && contact.emails.length > 0) {
        const primaryEmail = contact.emails.find(e => e.primary) || contact.emails[0];
        cardsHtml += `
          <div class="contact-card">
            <i class="fas fa-envelope"></i>
            <div>
              <strong>${primaryEmail.label || 'Email'}</strong>
              <p>${primaryEmail.value}</p>
            </div>
            <a href="${primaryEmail.mailto}" class="contact-action-link">
              <i class="fas fa-paper-plane"></i> Email
            </a>
          </div>
        `;
      }

      // Business hours
      if (contact.businessHours) {
        cardsHtml += `
          <div class="contact-card">
            <i class="fas fa-clock"></i>
            <div>
              <strong>Office Hours</strong>
              <p>${contact.businessHours}</p>
            </div>
          </div>
        `;
      }

      // Website
      if (contact.website) {
        cardsHtml += `
          <div class="contact-card">
            <i class="fas fa-globe"></i>
            <div>
              <strong>Website</strong>
              <p>${contact.website.replace(/^https?:\/\//, '')}</p>
            </div>
            <a href="${contact.website}" target="_blank" class="contact-action-link">
              <i class="fas fa-external-link-alt"></i> Visit
            </a>
          </div>
        `;
      }

      contactCardsGrid.innerHTML = cardsHtml;
    }

    // Update simple contact modal (bottom of page)
    const contactInfo = document.querySelector('#modal-contact .contact-info');
    if (contactInfo) {
      let infoHtml = '';
      
      // Email
      if (contact.emails && contact.emails.length > 0) {
        const email = contact.emails.find(e => e.primary) || contact.emails[0];
        infoHtml += `<div class="contact-item"><i class="fas fa-envelope"></i><span>${email.value}</span></div>`;
      }
      
      // Phone
      if (contact.phones && contact.phones.length > 0) {
        const phone = contact.phones.find(p => p.primary) || contact.phones[0];
        infoHtml += `<div class="contact-item"><i class="fas fa-phone"></i><span>${phone.display || phone.value}</span></div>`;
      }
      
      // Address
      if (contact.address) {
        infoHtml += `<div class="contact-item"><i class="fas fa-map-marker-alt"></i><span>${contact.address}</span></div>`;
      }
      
      contactInfo.innerHTML = infoHtml;
    }

    // Update contact form endpoint
    const contactForm = document.getElementById('property-contact-form');
    if (contactForm && contact.contactForm && contact.contactForm.endpoint) {
      contactForm.action = contact.contactForm.endpoint;
    }

    // Update contact form fields if specified
    if (contact.contactForm && contact.contactForm.fields) {
      const formFields = document.querySelectorAll('#property-contact-form .form-row');
      // Only update if brand has custom fields
    }

    console.log('[BrandLoader] Contact info updated');
  }

  /**
   * Update share modal with brand social links
   */
  updateShareInfo() {
    if (!this.brandConfig || !this.brandConfig.contact) {
      return;
    }

    const social = this.brandConfig.contact.social;
    const shareOptions = document.querySelector('.share-options');
    
    if (shareOptions && social) {
      let shareHtml = '';
      
      // Facebook
      if (social.facebook && social.facebook.enabled) {
        shareHtml += `
          <a href="${social.facebook.url}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-facebook-f"></i>
            <span>Facebook</span>
          </a>
        `;
      }
      
      // Instagram
      if (social.instagram && social.instagram.enabled) {
        shareHtml += `
          <a href="${social.instagram.url}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-instagram"></i>
            <span>Instagram</span>
          </a>
        `;
      }
      
      // WhatsApp
      if (this.brandConfig.contact.whatsapp && this.brandConfig.contact.whatsapp.enabled) {
        const wa = this.brandConfig.contact.whatsapp;
        const waUrl = `https://wa.me/${wa.number.replace('+', '')}?text=${encodeURIComponent(wa.message || '')}`;
        shareHtml += `
          <a href="${waUrl}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp</span>
          </a>
        `;
      }
      
      // YouTube
      if (social.youtube && social.youtube.enabled) {
        shareHtml += `
          <a href="${social.youtube.url}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-youtube"></i>
            <span>YouTube</span>
          </a>
        `;
      }
      
      // Telegram
      if (social.telegram && social.telegram.enabled) {
        shareHtml += `
          <a href="${social.telegram.url}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-telegram-plane"></i>
            <span>Telegram</span>
          </a>
        `;
      }
      
      // TikTok
      if (social.tiktok && social.tiktok.enabled) {
        shareHtml += `
          <a href="${social.tiktok.url}" target="_blank" class="share-option" style="text-decoration:none;">
            <i class="fab fa-tiktok"></i>
            <span>TikTok</span>
          </a>
        `;
      }
      
      // Copy link button (always present)
      shareHtml += `
        <button class="share-option" data-share="copy">
          <i class="fas fa-link"></i>
          <span>Copy Link</span>
        </button>
      `;
      
      shareOptions.innerHTML = shareHtml;
    }

    console.log('[BrandLoader] Share info updated');
  }

  /**
   * Update location tab with brand project info
   */
  updateLocationInfo() {
    if (!this.brandConfig || !this.brandConfig.project) {
      return;
    }

    const project = this.brandConfig.project;
    const contact = this.brandConfig.contact;
    const brand = this.brandConfig.brand;

    // Update property hero image with brand hero
    const heroImage = document.getElementById('property-hero-img');
    if (heroImage && this.brandConfig.hero) {
      const heroPath = this.getHeroImagePath();
      if (heroPath) {
        heroImage.src = heroPath;
        heroImage.onerror = () => {
          // Hide image if not found, show gradient instead
          heroImage.style.display = 'none';
          heroImage.parentElement.style.background = `linear-gradient(135deg, var(--primary-dark), var(--primary))`;
          heroImage.parentElement.style.minHeight = '200px';
        };
      }
    }

    // Update location details
    const locationDetails = document.querySelector('.location-details-compact');
    if (locationDetails) {
      let detailsHtml = '';
      
      // Address
      if (contact && contact.address) {
        detailsHtml += `
          <div class="location-detail-item">
            <i class="fas fa-map-pin"></i>
            <span>${contact.address}</span>
          </div>
        `;
      }
      
      // Coordinates
      if (project.coordinates) {
        const lat = project.coordinates.lat.toFixed(4);
        const lng = project.coordinates.lng.toFixed(4);
        const latDir = project.coordinates.lat >= 0 ? 'N' : 'S';
        const lngDir = project.coordinates.lng >= 0 ? 'E' : 'W';
        detailsHtml += `
          <div class="location-detail-item">
            <i class="fas fa-compass"></i>
            <span>${Math.abs(lat)}° ${latDir}, ${Math.abs(lng)}° ${lngDir}</span>
          </div>
        `;
      }
      
      // Building info
      if (project.buildingSize) {
        detailsHtml += `
          <div class="location-detail-item">
            <i class="fas fa-building"></i>
            <span>${project.buildingSize}${project.buildingType ? ' | ' + project.buildingType : ''}</span>
          </div>
        `;
      }
      
      // Delivery
      if (project.deliveryTime) {
        detailsHtml += `
          <div class="location-detail-item">
            <i class="fas fa-clock"></i>
            <span>Delivery: ${project.deliveryTime}</span>
          </div>
        `;
      }
      
      locationDetails.innerHTML = detailsHtml;
    }

    // Update get directions link
    const directionsBtn = document.querySelector('.location-actions-compact a[href*="maps.google"]');
    if (directionsBtn && project.coordinates) {
      directionsBtn.href = `https://maps.google.com/?q=${project.coordinates.lat},${project.coordinates.lng}`;
    }

    // Update copy address button
    const copyAddressBtn = document.getElementById('btn-copy-property-address');
    if (copyAddressBtn && contact && contact.address) {
      copyAddressBtn.onclick = () => {
        navigator.clipboard.writeText(contact.address).then(() => {
          alert('Address copied to clipboard!');
        }).catch(() => {
          console.error('Failed to copy address');
        });
      };
    }

    // Update property description in overview
    const propertyDesc = document.querySelector('.property-description');
    if (propertyDesc && project.description) {
      propertyDesc.textContent = project.description;
    }

    // Update property name in header
    const propertyTitle = document.querySelector('.property-info-title h2');
    if (propertyTitle && project.name) {
      propertyTitle.innerHTML = `<i class="fas fa-building"></i> ${project.name}`;
    }

    // Update subtitle
    const propertySubtitle = document.querySelector('.property-subtitle');
    if (propertySubtitle && brand.tagline) {
      propertySubtitle.textContent = brand.tagline;
    }

    console.log('[BrandLoader] Location info updated');
  }

  /**
   * Update meta tags for brand
   */
  updateMetaTags() {
    if (!this.brandConfig || !this.brandConfig.pwa) {
      return;
    }

    const pwa = this.brandConfig.pwa;
    const seo = this.brandConfig.seo;
    const brand = this.brandConfig.brand;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && seo && seo.metaDescription) {
      metaDescription.content = seo.metaDescription;
    }

    // Update theme color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && pwa.themeColor) {
      themeColor.content = pwa.themeColor;
    }

    // Update background color
    const bgColor = document.querySelector('meta[name="background-color"]');
    if (bgColor && pwa.backgroundColor) {
      bgColor.content = pwa.backgroundColor;
    }

    // Update PWA name
    const appName = document.querySelector('meta[name="application-name"]');
    if (appName && pwa.shortName) {
      appName.content = pwa.shortName;
    }

    // Update Apple mobile web app title
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle && pwa.shortName) {
      appleTitle.content = pwa.shortName;
    }

    // Update msapplication-TileColor
    const tileColor = document.querySelector('meta[name="msapplication-TileColor"]');
    if (tileColor && pwa.themeColor) {
      tileColor.content = pwa.themeColor;
    }

    // Update favicons with brand icon
    if (pwa.icon192) {
      const iconPath = `${this.getBasePath()}/_brands/${this.brandSlug}/${pwa.icon192}`;
      // Update standard favicon
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(link => {
        link.href = iconPath;
      });
      // Update apple-touch-icon
      document.querySelectorAll('link[rel="apple-touch-icon"]').forEach(link => {
        link.href = iconPath;
      });
    }

    console.log('[BrandLoader] Meta tags updated');
  }

  /**
   * Update PWA manifest with brand info
   */
  updateManifest() {
    if (!this.brandConfig || !this.brandConfig.pwa) {
      return;
    }

    const pwa = this.brandConfig.pwa;
    const brand = this.brandConfig.brand;

    // Try to update manifest if it's inline
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      // For GitHub Pages, we can't dynamically update manifest.json
      // But we can register a service worker to intercept manifest requests
      console.log('[BrandLoader] PWA manifest would need server-side update for full branding');
    }

    console.log('[BrandLoader] Manifest update noted (requires server-side config for full PWA branding)');
  }

  /**
   * Apply brand-specific loading screen styles
   */
  applyLoadingScreenStyles() {
    if (!this.brandConfig || !this.brandConfig.theme) {
      return;
    }

    const theme = this.brandConfig.theme;
    const style = document.createElement('style');
    style.id = 'brand-loading-styles';
    
    // Check for hero image
    const heroImage = this.getHeroImagePath();
    const hasHero = heroImage && this.brandConfig.hero;
    
    style.textContent = this.generateLoadingScreenCSS(theme, hasHero ? heroImage : null);
    document.head.appendChild(style);

    console.log('[BrandLoader] Loading screen styles applied' + (hasHero ? ' with hero image' : ''));
  }

  /**
   * Get hero image path from brand folder
   */
  getHeroImagePath() {
    if (!this.brandConfig || !this.brandConfig.hero) {
      return null;
    }
    
    const hero = this.brandConfig.hero;
    // Handle different path formats
    if (hero.startsWith('/')) {
      return hero;
    }
    if (hero.startsWith('_brands/')) {
      return hero;
    }
    // Assume it's in the brand folder
    return `/_brands/${this.brandSlug}/${hero}`;
  }

  /**
   * Generate CSS for loading screen theming
   */
  generateLoadingScreenCSS(theme, heroImagePath = null) {
    const heroBackground = heroImagePath 
      ? `background: url('${heroImagePath}') center/cover no-repeat fixed;`
      : `background: linear-gradient(135deg, ${theme.primaryDark} 0%, ${theme.primary} 100%);`;

    return `
      /* Loading Screen Brand Styles */
      .loading-overlay {
        ${heroBackground}
      }

      /* White/transparent buttons on loading screen */
      .btn-start-tour-modern {
        background: rgba(255, 255, 255, 0.15) !important;
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
        color: #ffffff !important;
        backdrop-filter: blur(10px);
      }

      .btn-start-tour-modern:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.25) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2) !important;
      }

      .btn-start-tour-modern .btn-text .btn-title {
        color: #ffffff !important;
      }

      .btn-start-tour-modern .btn-text .btn-subtitle {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      .btn-start-tour-modern .btn-icon {
        color: #ffffff !important;
      }

      .btn-start-tour-modern .btn-icon i {
        color: #ffffff !important;
      }

      /* Stat cards - white/transparent */
      .stat-card {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px);
      }

      .stat-card:hover {
        background: rgba(255, 255, 255, 0.15) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      .stat-value {
        color: #ffffff !important;
      }

      .stat-label-modern {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      .stat-icon {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      /* Settings panel - white/transparent */
      .loading-settings-modern {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px);
      }

      .loading-settings-modern h3 {
        color: #ffffff !important;
      }

      .setting-option-modern {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.15) !important;
      }

      .toggle-text-modern .toggle-title {
        color: #ffffff !important;
      }

      .toggle-text-modern .toggle-desc {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* Stats grid container */
      .loading-stats-modern {
        background: rgba(255, 255, 255, 0.05) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(10px);
      }

      /* Text colors */
      .loading-header h1 {
        color: #ffffff !important;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      }

      .loading-subtitle {
        color: rgba(255, 255, 255, 0.9) !important;
        text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
      }

      .loading-status-text {
        color: #ffffff !important;
      }

      /* Spinner */
      .spinner-modern {
        border-color: rgba(255, 255, 255, 0.2);
        border-top-color: rgba(255, 255, 255, 0.8);
      }

      /* Progress bar */
      .prep-progress-bar {
        background: rgba(255, 255, 255, 0.15) !important;
      }

      .prep-progress-bar-fill {
        background: rgba(255, 255, 255, 0.6) !important;
      }

      .prep-stat {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .prep-stat i {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      .prep-progress-icon {
        color: rgba(255, 255, 255, 0.8) !important;
      }

      /* Particles - subtle white */
      .particle {
        background: rgba(255, 255, 255, 0.15) !important;
      }

      /* Logo glow */
      .logo-glow {
        background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
      }

      /* Shimmer on button */
      .btn-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      }
    `;
  }

  /**
   * Apply brand-specific tour UI styles
   * No longer needed - CSS variables handle this
   */
  applyTourUIStyles() {
    // CSS variables already handle tour UI theming
    console.log('[BrandLoader] Tour UI themed via CSS variables');
  }

  /**
   * Get brand configuration
   */
  getConfig() {
    return this.brandConfig;
  }

  /**
   * Get brand slug
   */
  getBrandSlug() {
    return this.brandSlug;
  }

  /**
   * Check if brand is loaded
   */
  isBrandLoaded() {
    return this.isLoaded;
  }
}
