/**
 * Gallery Manager - Photo gallery with lightbox and zoom
 * ============================================================
 */

export class GalleryManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.images = [];
    this.filteredImages = [];
    this.currentIndex = 0;
    this.currentZoom = 1;
    this.isAutoplay = false;
    this.autoplayInterval = null;
    this.currentFilter = 'all';
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentTranslateX = 0;
    this.currentTranslateY = 0;

    this.init();
  }

  init() {
    this.loadGalleryImages();
    this.setupEventListeners();
    this.setupLanguageListener();
  }

  /**
   * Setup language change listener
   */
  setupLanguageListener() {
    window.addEventListener('language-changed', () => {
      this.translateGalleryTitles();
    });
  }

  /**
   * Load gallery images from project or use defaults
   */
  loadGalleryImages() {
    // Load all images from gallery/ folder (using WebP for better performance)
    const galleryFiles = [
      'Entrance view',
      'GF-DINING ROOM 2',
      'GF-LIVING ROOM 2',
      'GF-OPEN KITCHEN 1',
      'MINI SALON',
      'MNI SALON 2',
      'Scene 67',
      'Scene 68',
      'Scene 70',
      'Scene 71_1',
      'Scene 74_1',
      'Scene 77',
      'Scene 78',
      'Scene 80',
      'Scene 81'
    ];

    this.images = galleryFiles.map((file, index) => ({
      id: index + 1,
      url: `gallery/${file}.webp`,
      thumbnail: `gallery/${file}.webp`,
      title: file.replace(/-/g, ' '),
      titleKey: `gallery_${index + 1}`,
      description: `Gallery image ${index + 1}`,
      category: this.categorizeImage(file)
    }));

    this.filteredImages = [...this.images];
    this.renderGallery();
    this.translateGalleryTitles();
  }

  /**
   * Categorize image based on filename
   */
  categorizeImage(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('kitchen')) return 'kitchen';
    if (lower.includes('salon') || lower.includes('living')) return 'salon';
    if (lower.includes('dining')) return 'dining';
    if (lower.includes('entrance')) return 'entrance';
    return 'other';
  }

  /**
   * Translate gallery titles
   */
  translateGalleryTitles() {
    const translationManager = this.tourPlayer.translationManager;
    if (!translationManager) return;

    // Update image titles with translations
    this.images.forEach(img => {
      img.title = translationManager.t(img.titleKey) || img.title;
    });

    this.filteredImages = [...this.images];
    this.renderGallery();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Gallery filter buttons
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterGallery(e.target.dataset.filter);
      });
    });

    // Lightbox navigation
    document.getElementById('lightbox-prev')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.prevImage();
      }
    });
    
    document.getElementById('lightbox-next')?.addEventListener('click', () => {
      if (this.currentIndex < this.filteredImages.length - 1) {
        this.nextImage();
      }
    });

    // Lightbox controls
    document.getElementById('lightbox-zoom-in')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('lightbox-zoom-out')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('lightbox-reset')?.addEventListener('click', () => this.resetZoom());
    document.getElementById('lightbox-autoplay')?.addEventListener('click', () => this.toggleAutoplay());
    document.getElementById('lightbox-download')?.addEventListener('click', () => this.downloadImage());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const lightbox = document.getElementById('modal-lightbox');
      if (lightbox?.classList.contains('active')) {
        e.stopPropagation(); // Prevent other keyboard handlers
        if (e.key === 'ArrowLeft') this.prevImage();
        if (e.key === 'ArrowRight') this.nextImage();
        if (e.key === '+' || e.key === '=') this.zoomIn();
        if (e.key === '-' || e.key === '_') this.zoomOut();
        if (e.key === '0') this.resetZoom();
        if (e.key === 'Escape') {
          lightbox.classList.remove('active');
          this.stopAutoplay();
        }
      }
    });

    // Mouse wheel zoom
    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
      lightboxImage.addEventListener('wheel', (e) => {
        if (this.currentZoom > 1 || e.deltaY < 0) {
          e.preventDefault();
          if (e.deltaY < 0) {
            this.zoomIn();
          } else {
            this.zoomOut();
          }
        }
      }, { passive: false });

      // Drag to pan when zoomed
      let isDragging = false;
      let startX = 0, startY = 0;

      lightboxImage.addEventListener('mousedown', (e) => {
        if (this.currentZoom > 1) {
          isDragging = true;
          startX = e.clientX - this.currentTranslateX;
          startY = e.clientY - this.currentTranslateY;
          lightboxImage.style.cursor = 'grabbing';
        }
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging && this.currentZoom > 1) {
          e.preventDefault();
          this.currentTranslateX = e.clientX - startX;
          this.currentTranslateY = e.clientY - startY;
          this.updateImageTransform();
        }
      });

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          lightboxImage.style.cursor = 'grab';
        }
      });
    }

    // Close on backdrop click
    const lightboxModal = document.getElementById('modal-lightbox');
    const lightboxContainer = document.querySelector('.lightbox-container');
    
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.remove('active');
          this.stopAutoplay();
        }
      });
    }

    // Prevent close when clicking inside lightbox container
    if (lightboxContainer) {
      lightboxContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Close button
    document.querySelector('.lightbox-close')?.addEventListener('click', () => {
      lightboxModal?.classList.remove('active');
      this.stopAutoplay();
    });
  }

  /**
   * Render gallery grid
   */
  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (grid) {
      grid.innerHTML = this.filteredImages.map((img, index) => `
        <div class="gallery-item" data-index="${index}" data-image-id="${img.id}">
          <img src="${img.thumbnail}" alt="${img.title}" loading="lazy"
            onerror="this.style.display='none';this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-glass);color:var(--text-muted);\\'><i class=\\'fas fa-image\\' style=\\'font-size:32px;opacity:0.3;\\'></i></div>'" />
          <div class="gallery-item-overlay">
            <span class="gallery-item-title">${img.title}</span>
          </div>
        </div>
      `).join('');

      // Add click listeners
      grid.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.openLightbox(index);
        });
      });
    }

    // Also render widget thumbnails
    this.renderWidgetThumbnails();
  }

  /**
   * Render gallery widget thumbnails
   */
  renderWidgetThumbnails() {
    const container = document.getElementById('gallery-thumbnails');
    if (!container) return;

    // Show only 3 images in widget
    const displayImages = this.images.slice(0, 3);
    
    container.innerHTML = displayImages.map((img, index) => `
      <div class="gallery-thumbnail" data-index="${index}">
        <img src="${img.thumbnail}" alt="${img.title}" loading="lazy"
          onerror="this.style.background='#1e293b'" />
      </div>
    `).join('');

    // Add click listeners - open lightbox
    container.querySelectorAll('.gallery-thumbnail').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.openLightbox(index);
      });
    });
  }

  /**
   * Open gallery widget or lightbox directly
   */
  openGalleryWidget() {
    // Open lightbox with first image directly
    this.openLightbox(0);
  }

  /**
   * Filter gallery by category
   */
  filterGallery(filter) {
    this.currentFilter = filter;
    
    if (filter === 'all') {
      this.filteredImages = [...this.images];
    } else {
      this.filteredImages = this.images.filter(img => img.category === filter);
    }
    
    this.currentIndex = 0;
    this.renderGallery();
  }

  /**
   * Open lightbox with image
   */
  openLightbox(index) {
    if (index < 0 || index >= this.filteredImages.length) return;
    
    this.currentIndex = index;
    this.currentZoom = 1;
    this.currentTranslateX = 0;
    this.currentTranslateY = 0;
    this.isAutoplay = false;
    
    const modal = document.getElementById('modal-lightbox');
    if (!modal) return;

    this.updateLightboxImage();
    this.renderThumbnails();
    modal.classList.add('active');
    
    // Reset autoplay button
    const autoplayBtn = document.getElementById('lightbox-autoplay');
    if (autoplayBtn) {
      autoplayBtn.classList.remove('active');
      autoplayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  /**
   * Update lightbox image
   */
  updateLightboxImage() {
    const img = this.filteredImages[this.currentIndex];
    if (!img) return;

    const lightboxImg = document.getElementById('lightbox-image');
    const title = document.getElementById('lightbox-title');
    const description = document.getElementById('lightbox-description');
    const wrapper = document.querySelector('.lightbox-image-wrapper');

    if (lightboxImg) {
      // Add loading class to wrapper
      if (wrapper) wrapper.classList.add('loading');
      
      // Reset zoom and transform
      this.currentZoom = 1;
      this.currentTranslateX = 0;
      this.currentTranslateY = 0;
      this.updateImageTransform();
      lightboxImg.style.cursor = 'grab';
      lightboxImg.style.display = 'block';
      
      // Remove any existing error message
      const existingError = wrapper.querySelector('.error-message');
      if (existingError) existingError.remove();
      
      // Set up image load handler
      lightboxImg.onload = () => {
        if (wrapper) wrapper.classList.remove('loading');
        lightboxImg.classList.add('loaded');
      };
      
      lightboxImg.onerror = () => {
        if (wrapper) {
          wrapper.classList.remove('loading');
          lightboxImg.style.display = 'none';
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-muted);flex-direction:column;gap:16px;';
          errorDiv.innerHTML = '<i class="fas fa-image" style="font-size:48px;opacity:0.3;"></i><p>Image failed to load</p>';
          wrapper.appendChild(errorDiv);
        }
      };
      
      // Set the image source last to trigger loading
      lightboxImg.src = img.url;
    }

    if (title) title.textContent = img.title;
    if (description) description.textContent = img.description;

    // Update thumbnail active state
    this.updateThumbnailActive();

    // Update navigation buttons
    this.updateNavigation();
  }

  /**
   * Update image transform with zoom and pan
   */
  updateImageTransform() {
    const img = document.getElementById('lightbox-image');
    if (img) {
      img.style.transform = `scale(${this.currentZoom}) translate(${this.currentTranslateX / this.currentZoom}px, ${this.currentTranslateY / this.currentZoom}px)`;
    }
  }

  /**
   * Render thumbnails
   */
  renderThumbnails() {
    const container = document.getElementById('lightbox-thumbnails');
    if (!container) return;

    container.innerHTML = this.filteredImages.map((img, index) => `
      <img 
        class="lightbox-thumbnail ${index === this.currentIndex ? 'active' : ''}" 
        src="${img.thumbnail}" 
        alt="${img.title}"
        data-index="${index}"
        loading="lazy"
      />
    `).join('');

    // Add click listeners
    container.querySelectorAll('.lightbox-thumbnail').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.currentIndex = parseInt(thumb.dataset.index);
        this.updateLightboxImage();
      });
    });

    // Scroll active thumbnail into view
    this.updateThumbnailActive();
  }

  /**
   * Update thumbnail active state
   */
  updateThumbnailActive() {
    document.querySelectorAll('.lightbox-thumbnail').forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentIndex);
    });

    // Scroll active thumbnail into view
    const activeThumb = document.querySelector('.lightbox-thumbnail.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  /**
   * Update navigation buttons state
   */
  updateNavigation() {
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    if (prevBtn) {
      if (this.currentIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.3';
        prevBtn.style.pointerEvents = 'none';
      } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'auto';
      }
    }

    if (nextBtn) {
      if (this.currentIndex >= this.filteredImages.length - 1) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.3';
        nextBtn.style.pointerEvents = 'none';
      } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
      }
    }
  }

  /**
   * Navigate to previous image
   */
  prevImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateLightboxImage();
    } else {
      // Loop to last image
      this.currentIndex = this.filteredImages.length - 1;
      this.updateLightboxImage();
    }
  }

  /**
   * Navigate to next image
   */
  nextImage() {
    if (this.currentIndex < this.filteredImages.length - 1) {
      this.currentIndex++;
      this.updateLightboxImage();
    } else {
      // Loop to first image
      this.currentIndex = 0;
      this.updateLightboxImage();
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    if (this.currentZoom < 3) {
      this.currentZoom = Math.min(3, this.currentZoom + 0.25);
      this.updateImageTransform();
    }
  }

  /**
   * Zoom out
   */
  zoomOut() {
    if (this.currentZoom > 0.5) {
      this.currentZoom = Math.max(0.5, this.currentZoom - 0.25);
      // Reset pan when zooming out below 1
      if (this.currentZoom <= 1) {
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;
      }
      this.updateImageTransform();
    }
  }

  /**
   * Reset zoom
   */
  resetZoom() {
    this.currentZoom = 1;
    this.currentTranslateX = 0;
    this.currentTranslateY = 0;
    this.updateImageTransform();
  }

  /**
   * Toggle autoplay
   */
  toggleAutoplay() {
    this.isAutoplay = !this.isAutoplay;
    const btn = document.getElementById('lightbox-autoplay');
    
    if (this.isAutoplay) {
      btn?.classList.add('active');
      btn.innerHTML = '<i class="fas fa-pause"></i>';
      this.autoplayInterval = setInterval(() => {
        if (this.currentIndex >= this.filteredImages.length - 1) {
          this.currentIndex = 0;
        } else {
          this.currentIndex++;
        }
        this.updateLightboxImage();
      }, 3000);
    } else {
      btn?.classList.remove('active');
      btn.innerHTML = '<i class="fas fa-play"></i>';
      this.stopAutoplay();
    }
  }

  /**
   * Stop autoplay
   */
  stopAutoplay() {
    this.isAutoplay = false;
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    const btn = document.getElementById('lightbox-autoplay');
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  /**
   * Download current image
   */
  downloadImage() {
    const img = this.filteredImages[this.currentIndex];
    if (!img) return;

    const link = document.createElement('a');
    link.href = img.url;
    link.download = `${img.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
