/**
 * VR Mode Manager - WebXR integration for VR headsets
 * ============================================================
 */

export class VRModeManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isVRSupported = false;
    this.isInVR = false;
    this.vrButton = null;
    this.vrSession = null;
    this.vrFrame = null;
    this.vrReferenceSpace = null;
    this.animationFrame = null;

    this.init();
  }

  async init() {
    this.checkVRSupport();
    this.setupEventListeners();
  }

  /**
   * Check if WebXR is supported
   */
  checkVRSupport() {
    this.isVRSupported = 'xr' in navigator;
    
    if (this.isVRSupported) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        console.log('[VR] VR session supported:', supported);
        this.isVRSupported = supported;
        
        if (supported) {
          this.showVRButton();
        }
      });
    } else {
      console.log('[VR] WebXR not supported');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // VR toggle in settings
    document.getElementById('toggle-vr-mode')?.addEventListener('click', () => {
      this.toggleVR();
    });

    // VR button click
    if (this.vrButton) {
      this.vrButton.addEventListener('click', () => {
        this.enterVR();
      });
    }

    // Handle VR session end
    if (navigator.xr) {
      navigator.xr.addEventListener('sessionend', () => {
        this.onVREnd();
      });
    }

    // Keyboard shortcut (V key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'v' || e.key === 'V') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleVR();
        }
      }
    });
  }

  /**
   * Show VR button
   */
  showVRButton() {
    // Create VR button if not exists
    let vrBtn = document.getElementById('btn-vr-mode');
    if (!vrBtn) {
      vrBtn = document.createElement('button');
      vrBtn.id = 'btn-vr-mode';
      vrBtn.className = 'action-btn';
      vrBtn.title = 'VR Mode';
      vrBtn.innerHTML = '<i class="fas fa-vr-cardboard"></i>';
      vrBtn.style.cssText = `
        transition: all 0.3s;
      `;
      
      vrBtn.addEventListener('click', () => this.enterVR());
      
      // Add to right actions
      const rightActions = document.querySelector('.right-actions');
      if (rightActions) {
        rightActions.insertBefore(vrBtn, rightActions.firstChild);
      }
      
      this.vrButton = vrBtn;
    }
  }

  /**
   * Toggle VR mode
   */
  async toggleVR() {
    if (this.isInVR) {
      this.exitVR();
    } else {
      await this.enterVR();
    }
  }

  /**
   * Enter VR mode
   */
  async enterVR() {
    if (!this.isVRSupported) {
      this.showNotification('VR mode is not supported on this device', 'error');
      return;
    }

    try {
      // Request VR session
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });

      this.vrSession = session;
      this.isInVR = true;

      // Setup VR renderer
      this.setupVRRenderer(session);

      // Update UI
      this.updateVRUI(true);

      console.log('[VR] Entered VR mode');
      this.showNotification('Entered VR mode', 'success');

    } catch (error) {
      console.error('[VR] Failed to enter VR:', error);
      this.showNotification('Failed to enter VR: ' + error.message, 'error');
    }
  }

  /**
   * Setup VR renderer
   */
  setupVRRenderer(session) {
    const viewer = this.tourPlayer.viewer;
    if (!viewer || !viewer.renderer) return;

    // Set the XR session
    viewer.renderer.xr.setSession(session);

    // Create reference space
    session.requestReferenceSpace('local').then((referenceSpace) => {
      this.vrReferenceSpace = referenceSpace;

      // Start VR render loop
      session.requestAnimationFrame(this.onVRFrame.bind(this));
    });

    // Handle session end
    session.addEventListener('end', () => {
      this.onVREnd();
    });
  }

  /**
   * VR frame handler
   */
  onVRFrame(time, frame) {
    if (!this.vrSession || !this.isInVR) return;

    const viewer = this.tourPlayer.viewer;
    if (!viewer || !viewer.renderer) return;

    const session = this.vrSession;
    const referenceSpace = this.vrReferenceSpace;

    // Get viewer pose
    const viewerPose = frame.getViewerPose(referenceSpace);

    if (viewerPose) {
      // Update camera position and orientation
      const transform = viewerPose.transform;
      
      viewer.camera.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z
      );

      viewer.camera.quaternion.set(
        transform.orientation.x,
        transform.orientation.y,
        transform.orientation.z,
        transform.orientation.w
      );
    }

    // Render for each eye
    const baseLayer = session.renderState.baseLayer;
    if (baseLayer) {
      viewer.renderer.render(viewer.renderer.scene, viewer.camera);
    }

    // Request next frame
    session.requestAnimationFrame(this.onVRFrame.bind(this));
  }

  /**
   * Exit VR mode
   */
  async exitVR() {
    if (this.vrSession) {
      try {
        await this.vrSession.end();
      } catch (error) {
        console.error('[VR] Error ending VR session:', error);
      }
    }
    
    this.onVREnd();
  }

  /**
   * VR session ended
   */
  onVREnd() {
    this.isInVR = false;
    this.vrSession = null;
    this.vrFrame = null;

    // Reset camera
    const viewer = this.tourPlayer.viewer;
    if (viewer) {
      viewer.camera.position.set(0, 0, 0);
      viewer.camera.quaternion.identity();
    }

    // Update UI
    this.updateVRUI(false);

    console.log('[VR] Exited VR mode');
    this.showNotification('Exited VR mode', 'info');
  }

  /**
   * Update VR UI
   */
  updateVRUI(inVR) {
    const vrToggle = document.getElementById('toggle-vr-mode');
    const vrBtn = document.getElementById('btn-vr-mode');

    if (vrToggle) {
      vrToggle.classList.toggle('active', inVR);
    }

    if (vrBtn) {
      vrBtn.classList.toggle('active', inVR);
      vrBtn.innerHTML = inVR 
        ? '<i class="fas fa-vr-cardboard"></i>' 
        : '<i class="fas fa-vr-cardboard"></i>';
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid ${type === 'error' ? 'var(--accent)' : 'var(--primary)'};
      border-radius: var(--radius-md);
      padding: 12px 24px;
      color: var(--text);
      font-size: 13px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeInDown 0.3s ease;
    `;

    const icon = type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' :
                 type === 'success' ? '<i class="fas fa-check-circle"></i>' :
                 '<i class="fas fa-info-circle"></i>';

    notification.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOutUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Check if VR is supported
   */
  isSupported() {
    return this.isVRSupported;
  }

  /**
   * Check if currently in VR
   */
  isInVRMode() {
    return this.isInVR;
  }

  /**
   * Get VR devices
   */
  async getVRDevices() {
    if (!navigator.xr) return [];

    try {
      const devices = await navigator.xr.getDevices();
      return devices.filter(device => device.capabilities.hasImmersive);
    } catch (error) {
      console.error('[VR] Error getting devices:', error);
      return [];
    }
  }

  /**
   * AR mode (future enhancement)
   */
  async enterAR() {
    if (!this.isVRSupported) {
      this.showNotification('AR mode is not supported', 'error');
      return;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
      });

      this.vrSession = session;
      this.isInVR = true;

      this.setupVRRenderer(session);
      this.updateVRUI(true);

      console.log('[VR] Entered AR mode');
    } catch (error) {
      console.error('[VR] Failed to enter AR:', error);
      this.showNotification('Failed to enter AR: ' + error.message, 'error');
    }
  }
}
