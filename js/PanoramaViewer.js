/**
 * Panorama Viewer - Three.js based cubic panorama renderer
 * ============================================================
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class PanoramaViewer {
  constructor(containerId, canvasId, tourPlayer) {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);
    this.tourPlayer = tourPlayer;

    this.yaw = 0;
    this.pitch = 0;
    this.fov = 75;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.faceMap = { 'right': 0, 'left': 1, 'top': 2, 'bottom': 3, 'front': 4, 'back': 5 };
    this.faceDirs = { 'front': 'f', 'back': 'b', 'left': 'l', 'right': 'r', 'top': 'u', 'bottom': 'd' };

    this.initThree();
    this.setupInteraction();
    this.animate();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true  // Important for capturing
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.sceneGroup = new THREE.Group();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.container.clientWidth / this.container.clientHeight,
      0.1, 1000
    );
    this.camera.position.set(0, 0, 0);

    this.renderer.scene = new THREE.Scene();
    this.renderer.scene.background = new THREE.Color(0x0a0e1a);
    this.renderer.scene.add(this.sceneGroup);
    this.renderer.scene.add(this.camera);

    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  loadScene(scene, onComplete) {
    // Remove old cube
    while (this.sceneGroup.children.length > 0) {
      const obj = this.sceneGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
      this.sceneGroup.remove(obj);
    }

    // Load faces
    const baseUrl = scene.panoramaUrl.replace(/\/$/, '');
    const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const materials = faceNames.map(() =>
      new THREE.MeshBasicMaterial({ color: 0x1a1a2e, side: THREE.FrontSide })
    );

    const geometry = new THREE.BoxGeometry(500, 500, 500);
    geometry.scale(-1, 1, 1);
    const cube = new THREE.Mesh(geometry, materials);
    this.sceneGroup.add(cube);

    Promise.all(faceNames.map((name, i) =>
      this.loadFace(baseUrl, name, materials[this.faceMap[name]])
    )).then(() => {
      // Set initial view
      if (scene.initialView) {
        this.yaw = scene.initialView.yaw || 0;
        this.pitch = scene.initialView.pitch || 0;
        this.fov = scene.initialView.fov || 75;
        this.updateCamera();
      }
      if (onComplete) onComplete();
    });
  }

  loadFace(baseUrl, faceName, material) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = '';

      // Support new {face}.webp format or old directory format (using WebP for better performance)
      let imgUrl = baseUrl;
      if (baseUrl.includes('{face}')) {
        // New format: path/{face}.webp
        imgUrl = baseUrl.replace('{face}', faceName).replace('.jpg', '.webp');
      } else if (!baseUrl.endsWith('.webp') && !baseUrl.endsWith('.jpg')) {
        // Old format: path/face/2/0_0.webp
        imgUrl = `${baseUrl}/${this.faceDirs[faceName]}/2/0_0.webp`;
      } else if (baseUrl.endsWith('.jpg')) {
        // Convert jpg to webp
        imgUrl = baseUrl.replace('.jpg', '.webp');
      }

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        material.map = tex;
        material.color = new THREE.Color(0xffffff);
        material.needsUpdate = true;
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load face: ${imgUrl}`);
        material.color = new THREE.Color(0x1a1a2e);
        resolve();
      };
      img.src = imgUrl;
    });
  }

  updateCamera() {
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    const yawRad = this.yaw * Math.PI / 180;
    const pitchRad = this.pitch * Math.PI / 180;
    this.camera.lookAt(
      Math.sin(yawRad) * Math.cos(pitchRad),
      Math.sin(pitchRad),
      Math.cos(yawRad) * Math.cos(pitchRad)
    );
  }

  setView(yaw, pitch, fov) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.fov = fov;
    this.updateCamera();
  }

  setFov(fov) {
    this.fov = fov;
    this.updateCamera();
  }

  getYaw() { return this.yaw; }
  getPitch() { return this.pitch; }
  getFov() { return this.fov; }
  setYaw(yaw) { this.yaw = yaw; this.updateCamera(); }
  
  /**
   * Set mouse/touch sensitivity for camera movement
   */
  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0.5, Math.min(2.0, sensitivity));
  }

  setupInteraction() {
    const canvas = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    canvas.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
      // Update last interaction for auto-rotate (use performance.now() for consistency)
      if (this.tourPlayer) {
        this.tourPlayer.lastInteraction = performance.now();
      }
    });

    canvas.addEventListener('mousemove', e => {
      if (!this.isDragging) {
        // Hotspot and overlay hover detection
        this.mouse.x = ((e.clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth) * 2 - 1;
        this.mouse.y = -((e.clientY - canvas.getBoundingClientRect().top) / canvas.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const interactables = this.sceneGroup.children.filter(c =>
          c.userData.isHotspot || c.userData.isOverlay
        );
        const intersects = this.raycaster.intersectObjects(interactables);
        canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
        return;
      }
      // Drag to look - natural drag direction with sensitivity
      const sensitivity = this.sensitivity || 1.0;
      this.yaw -= (e.clientX - this.lastMouseX) * 0.2 * sensitivity;
      this.pitch -= (e.clientY - this.lastMouseY) * 0.2 * sensitivity;
      this.pitch = Math.max(-90, Math.min(90, this.pitch));
      this.updateCamera();
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      // Update last interaction for auto-rotate (use performance.now() for consistency)
      if (this.tourPlayer) {
        this.tourPlayer.lastInteraction = performance.now();
      }
    });

    canvas.addEventListener('mouseup', e => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
      // Update last interaction for auto-rotate (use performance.now() for consistency)
      if (this.tourPlayer) {
        this.tourPlayer.lastInteraction = performance.now();
      }

      // Hotspot and overlay click detection
      this.mouse.x = ((e.clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth) * 2 - 1;
      this.mouse.y = -((e.clientY - canvas.getBoundingClientRect().top) / canvas.clientHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check hotspots
      const hotspots = this.sceneGroup.children.filter(c => c.userData.isHotspot);
      const hotspotIntersects = this.raycaster.intersectObjects(hotspots);

      if (hotspotIntersects.length > 0 && hotspotIntersects[0].object.userData.targetSceneId) {
        const targetId = hotspotIntersects[0].object.userData.targetSceneId;
        const index = this.tourPlayer.project.scenes.findIndex(s => s.id === targetId);
        if (index !== -1) {
          this.tourPlayer.loadScene(index);
        }
        return;
      }

      // Check overlays (for edit mode selection)
      const overlays = this.sceneGroup.children.filter(c => c.userData.isOverlay);
      const overlayIntersects = this.raycaster.intersectObjects(overlays);

      if (overlayIntersects.length > 0) {
        const overlay = overlayIntersects[0].object;
        const overlayId = overlay.userData.overlayId;
        const overlayData = overlay.userData.overlayData;

        // Check if it's a YouTube overlay - open in modal
        if (overlay.userData.isYouTube && overlay.userData.youtubeId) {
          const youtubeId = overlay.userData.youtubeId;
          const modal = document.getElementById('modal-youtube');
          const iframe = document.getElementById('youtube-iframe');
          if (modal && iframe) {
            iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
            modal.classList.add('active');
            
            // Clear iframe when modal closes
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
              closeBtn.onclick = (e) => {
                e.preventDefault();
                modal.classList.remove('active');
                setTimeout(() => { iframe.src = ''; }, 100);
              };
            }
          }
          return;
        }
      }
    });

    canvas.addEventListener('wheel', e => {
      this.fov += e.deltaY * 0.05;
      this.fov = Math.max(30, Math.min(120, this.fov));
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
      // Update last interaction for auto-rotate (use performance.now() for consistency)
      if (this.tourPlayer) {
        this.tourPlayer.lastInteraction = performance.now();
      }
    }, { passive: false });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.renderer.scene, this.camera);
  }
}
