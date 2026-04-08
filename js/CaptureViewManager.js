/**
 * Capture View Manager - Save current panorama view as image
 * ============================================================
 */

export class CaptureViewManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isCapturing = false;
    this.captureQuality = 0.95;
    // Hotspots and overlays are always excluded by default
    this.excludeHotspots = true;
    this.excludeOverlays = true;
    this.watermark = {
      enabled: true,
      text: 'Virtual Tour',
      position: 'bottom-right',
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.8
    };

    this.init();
  }

  init() {
    // No toggle settings needed - hotspots and overlays always excluded
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Capture button in settings
    document.getElementById('btn-capture-view')?.addEventListener('click', () => {
      this.captureView();
    });

    // Keyboard shortcut (C key)
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.captureView();
        }
      }
    });

    // Quality setting
    const qualitySelect = document.getElementById('capture-quality');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        this.captureQuality = parseFloat(e.target.value);
      });
    }

    // Watermark toggle
    const watermarkToggle = document.getElementById('toggle-watermark');
    if (watermarkToggle) {
      watermarkToggle.addEventListener('click', () => {
        watermarkToggle.classList.toggle('active');
        this.watermark.enabled = watermarkToggle.classList.contains('active');
      });
    }
  }

  /**
   * Capture current view without hotspots and overlays
   */
  async captureView() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    this.showCaptureFeedback('Preparing capture...');

    try {
      const viewer = this.tourPlayer.viewer;
      if (!viewer || !viewer.renderer || !viewer.camera || !viewer.sceneGroup) {
        throw new Error('Viewer not initialized');
      }

      // Wait a moment for any animations to complete
      await this.delay(100);

      // Store current visibility states
      const hotspotStates = this.getHotspotStates();
      const overlayStates = this.getOverlayStates();

      // Hide hotspots and overlays before capture
      let hiddenCount = 0;
      if (this.excludeHotspots) {
        hiddenCount = this.hideHotspots();
        console.log('[CaptureView] Hidden hotspots:', hiddenCount);
      }
      if (this.excludeOverlays) {
        const overlayCount = this.hideOverlays();
        console.log('[CaptureView] Hidden overlays:', overlayCount);
        hiddenCount += overlayCount;
      }

      // Force a render with proper state
      viewer.renderer.autoClear = true;
      viewer.renderer.render(viewer.renderer.scene, viewer.camera);
      
      // Wait for GPU to finish and for visibility changes to apply
      await this.delay(200);

      // Get canvas
      const canvas = viewer.canvas;
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Capture using the most reliable method
      const imageData = await this.captureWebGLCanvas(canvas);

      // Restore hotspots and overlays
      if (this.excludeHotspots && hotspotStates.length > 0) {
        this.restoreHotspots(hotspotStates);
      }
      if (this.excludeOverlays && overlayStates.length > 0) {
        this.restoreOverlays(overlayStates);
      }

      // Re-render to restore view
      viewer.renderer.render(viewer.renderer.scene, viewer.camera);

      // Create final image with watermark if enabled
      let finalImageData = imageData;
      if (this.watermark.enabled) {
        finalImageData = await this.addWatermark(imageData);
      }

      // Download the image
      this.downloadImage(finalImageData);

      this.showCaptureFeedback('✓ Capture saved!', 'success');
    } catch (error) {
      console.error('[CaptureView] Error:', error);
      this.showCaptureFeedback('✗ Capture failed: ' + error.message, 'error');
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Capture WebGL canvas - most reliable method
   */
  async captureWebGLCanvas(canvas) {
    return new Promise((resolve, reject) => {
      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          // Not WebGL, use regular capture
          resolve(canvas.toDataURL('image/jpeg', this.captureQuality));
          return;
        }

        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');

        // Read pixels from WebGL
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // Create ImageData (flip vertically)
        const imageData = new ImageData(canvas.width, canvas.height);
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const sourceIndex = ((canvas.height - y - 1) * canvas.width + x) * 4;
            const destIndex = (y * canvas.width + x) * 4;
            
            imageData.data[destIndex] = pixels[sourceIndex];     // R
            imageData.data[destIndex + 1] = pixels[sourceIndex + 1]; // G
            imageData.data[destIndex + 2] = pixels[sourceIndex + 2]; // B
            imageData.data[destIndex + 3] = pixels[sourceIndex + 3]; // A
          }
        }

        // Draw to temp canvas
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        const dataUrl = tempCanvas.toDataURL('image/jpeg', this.captureQuality);
        resolve(dataUrl);

      } catch (error) {
        console.error('[CaptureView] WebGL capture error:', error);
        // Fallback to drawImage method
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const ctx = tempCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, 0);
          resolve(tempCanvas.toDataURL('image/jpeg', this.captureQuality));
        } catch (e) {
          reject(e);
        }
      }
    });
  }

  /**
   * Get current hotspot visibility states
   */
  getHotspotStates() {
    const states = [];
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    if (sceneGroup) {
      sceneGroup.children.forEach((child, index) => {
        if (child.userData.isHotspot) {
          states.push({ index, visible: child.visible });
        }
      });
    }
    return states;
  }

  /**
   * Get current overlay visibility states
   */
  getOverlayStates() {
    const states = [];
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    if (sceneGroup) {
      sceneGroup.children.forEach((child, index) => {
        if (child.userData.isOverlay) {
          states.push({ index, visible: child.visible });
        }
      });
    }
    return states;
  }

  /**
   * Hide all hotspots
   */
  hideHotspots() {
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    let count = 0;
    if (sceneGroup) {
      sceneGroup.children.forEach(child => {
        if (child.userData.isHotspot) {
          child.visible = false;
          count++;
        }
      });
    }
    return count;
  }

  /**
   * Restore hotspot visibility
   */
  restoreHotspots(states) {
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    if (sceneGroup) {
      states.forEach(state => {
        const child = sceneGroup.children[state.index];
        if (child && child.userData.isHotspot) {
          child.visible = state.visible;
        }
      });
    }
  }

  /**
   * Hide all overlays
   */
  hideOverlays() {
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    let count = 0;
    if (sceneGroup) {
      sceneGroup.children.forEach(child => {
        if (child.userData.isOverlay) {
          child.visible = false;
          count++;
        }
      });
    }
    return count;
  }

  /**
   * Restore overlay visibility
   */
  restoreOverlays(states) {
    const sceneGroup = this.tourPlayer.viewer.sceneGroup;
    if (sceneGroup) {
      states.forEach(state => {
        const child = sceneGroup.children[state.index];
        if (child && child.userData.isOverlay) {
          child.visible = state.visible;
        }
      });
    }
  }

  /**
   * Add watermark to image
   */
  addWatermark(imageDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add watermark
        if (this.watermark.enabled) {
          const fontSize = Math.floor(canvas.height * (this.watermark.fontSize / 1000));
          ctx.font = `${fontSize}px Inter, Arial, sans-serif`;
          ctx.fillStyle = this.watermark.color;
          ctx.globalAlpha = this.watermark.opacity;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';

          const padding = canvas.width * 0.02;
          const x = canvas.width - padding;
          const y = canvas.height - padding;

          // Add text shadow for better visibility
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillText(this.watermark.text, x, y);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.globalAlpha = 1;
        }

        resolve(canvas.toDataURL('image/jpeg', this.captureQuality));
      };
      img.src = imageDataUrl;
    });
  }

  /**
   * Download image
   */
  downloadImage(imageDataUrl) {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const scene = this.tourPlayer.project?.scenes[this.tourPlayer.currentSceneIndex];
    const sceneName = scene ? scene.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'view';
    
    link.download = `hai-png-${sceneName}-${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Show capture feedback
   */
  showCaptureFeedback(message, type = 'info') {
    // Remove existing feedback
    const existing = document.querySelector('.capture-feedback');
    if (existing) {
      existing.remove();
    }

    const feedback = document.createElement('div');
    feedback.className = `capture-feedback capture-feedback-${type}`;
    
    const bgColor = type === 'success' ? 'rgba(16, 185, 129, 0.9)' :
                    type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                    'var(--bg-dark)';
    
    feedback.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: ${bgColor};
      backdrop-filter: blur(10px);
      border-radius: var(--radius-md);
      padding: 12px 24px;
      color: var(--text);
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border);
      animation: fadeInDown 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' :
                 type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
                 '<i class="fas fa-camera"></i>';

    feedback.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.animation = 'fadeOutUp 0.3s ease';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set watermark options
   */
  setWatermark(options) {
    this.watermark = { ...this.watermark, ...options };
  }
}
