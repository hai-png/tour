/**
 * Hotspot Manager - Handles hotspot rendering and interaction
 * ============================================================
 */

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

export class HotspotManager {
  constructor(viewer) {
    this.viewer = viewer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hotspotElements = new Map();
    this.animatedHotspots = new Map();
    this.hotspotData = null;
    this.setupInteraction();
    this.loadHotspotData();
  }

  async loadHotspotData() {
    try {
      const response = await fetch('media/tdv-import/hotspots.json');
      if (response.ok) {
        this.hotspotData = await response.json();
        console.log(`[HotspotManager] Loaded ${this.hotspotData.totalHotspots} animated hotspots`);
      }
    } catch (error) {
      console.log('[HotspotManager] No external hotspot data found, using scene data only');
    }
  }

  renderHotspots(sceneData) {
    // Remove existing hotspot elements
    document.querySelectorAll('.hotspot-sprite').forEach(el => el.remove());
    document.querySelectorAll('.hotspot-animated').forEach(el => el.remove());
    this.hotspotElements.clear();
    this.animatedHotspots.clear();

    // Remove existing Three.js hotspots
    this.viewer.sceneGroup.children.forEach(child => {
      if (child.userData.isHotspot) {
        this.viewer.sceneGroup.remove(child);
      }
    });

    // Render ONLY animated hotspots from 3DVista data
    if (this.hotspotData && this.hotspotData.hotspots) {
      this.renderAnimatedHotspots(sceneData);
    }
  }

  renderAnimatedHotspots(sceneData) {
    if (!this.hotspotData) return;

    // Find hotspots for current scene by filtering the flat hotspots array
    const sceneIndex = this.viewer.tourPlayer.currentSceneIndex;
    const sceneHotspots = this.hotspotData.hotspots.filter(
      hs => hs.sceneIndex === sceneIndex && hs.visible !== false
    );

    console.log(`[HotspotManager] Rendering ${sceneHotspots.length} animated hotspots for scene ${sceneIndex}`);

    // Render hotspots immediately (images will load asynchronously)
    sceneHotspots.forEach((hs) => {
      if (!hs.sprite || !hs.sprite.url) return;
      this.renderSingleHotspot(hs);
    });
  }

  renderSingleHotspot(hs) {
    const hotspotEl = this.createAnimatedHotspot(hs);
    const yawRad = -hs.position.yaw * Math.PI / 180;
    const pitchRad = hs.position.pitch * Math.PI / 180;

    const position = new THREE.Vector3(
      hs.position.distance * Math.sin(yawRad) * Math.cos(pitchRad),
      hs.position.distance * Math.sin(pitchRad),
      hs.position.distance * Math.cos(yawRad) * Math.cos(pitchRad)
    );

    hotspotEl.userData = {
      targetSceneId: hs.content.targetSceneId,
      targetSceneIndex: hs.content.targetSceneIndex,
      tooltip: hs.tooltip.text,
      position: position,
      isAnimated: true
    };

    this.animatedHotspots.set(hs.id, hotspotEl);
    this.hotspotElements.set(hs.id, hotspotEl);
    document.getElementById('viewer-container').appendChild(hotspotEl);

    this.animateHotspot(hs.id, hs.sprite);
  }

  createAnimatedHotspot(hs) {
    const el = document.createElement('div');
    el.className = 'hotspot-animated';
    // Use consistent size for all hotspots
    el.style.width = '60px';
    el.style.height = '60px';
    el.innerHTML = `
      <div class="hotspot-animated-container">
        <canvas class="hotspot-sprite-canvas" width="120" height="120"></canvas>
      </div>
    `;
    return el;
  }

  animateHotspot(hotspotId, spriteConfig) {
    const hotspotEl = this.animatedHotspots.get(hotspotId);
    if (!hotspotEl) return;

    const canvas = hotspotEl.querySelector('.hotspot-sprite-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Build sprite URL - check if it exists, fallback to placeholder if not (using WebP for better performance)
    let spriteUrl = spriteConfig.url;
    if (!spriteUrl.startsWith('http') && !spriteUrl.startsWith('data:')) {
      // Relative path - check if from 3DVista export
      if (spriteUrl.includes('hai-png.github.io-main')) {
        // Map to local path
        spriteUrl = spriteUrl.replace('hai-png.github.io-main/', '');
      }
      // Convert PNG to WebP for better performance
      if (spriteUrl.endsWith('.png')) {
        spriteUrl = spriteUrl.replace('.png', '.webp');
      }
    }

    img.onload = () => {
      const { rowCount, colCount, frameCount, frameDuration } = spriteConfig;
      const frameWidth = spriteConfig.width / colCount;
      const frameHeight = spriteConfig.height / rowCount;
      
      let currentFrame = 0;
      let lastFrameTime = 0;

      const animate = (currentTime) => {
        if (!this.animatedHotspots.has(hotspotId)) return;

        if (currentTime - lastFrameTime > frameDuration) {
          currentFrame = (currentFrame + 1) % frameCount;
          lastFrameTime = currentTime;

          const row = Math.floor(currentFrame / colCount);
          const col = currentFrame % colCount;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            0, 0, canvas.width, canvas.height
          );
        }

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    img.onerror = () => {
      console.warn(`[HotspotManager] Failed to load sprite: ${spriteUrl}`);
      // Show placeholder
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('→', canvas.width / 2, canvas.height / 2);
    };

    img.src = spriteUrl;
  }

  update(deltaTime) {
    // Update hotspot positions based on camera view
    const camera = this.viewer.camera;
    const canvas = this.viewer.renderer.domElement;
    const container = document.getElementById('viewer-container');
    const containerRect = container.getBoundingClientRect();

    this.hotspotElements.forEach((hotspotEl, id) => {
      const position = hotspotEl.userData.position;

      // Project 3D position to 2D screen
      const vec = position.clone();
      vec.project(camera);

      // Check if behind camera
      if (vec.z > 1) {
        hotspotEl.style.display = 'none';
        return;
      }

      hotspotEl.style.display = 'block';

      // Convert to screen coordinates
      const x = (vec.x * 0.5 + 0.5) * canvas.clientWidth;
      const y = (-vec.y * 0.5 + 0.5) * canvas.clientHeight;

      // Scale based on distance for depth effect (subtle scaling)
      const distance = position.length();
      const scale = Math.max(0.7, Math.min(1.3, 500 / distance));

      hotspotEl.style.left = `${x + containerRect.left}px`;
      hotspotEl.style.top = `${y + containerRect.top}px`;
      hotspotEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
  }

  setupInteraction() {
    const canvas = this.viewer.renderer.domElement;

    // Handle hotspot clicks via event delegation
    document.getElementById('viewer-container').addEventListener('click', (e) => {
      const hotspot = e.target.closest('.hotspot-sprite, .hotspot-animated');
      if (hotspot && hotspot.userData.targetSceneId) {
        const targetId = hotspot.userData.targetSceneId;
        const targetIndex = this.viewer.tourPlayer.project.scenes.findIndex(
          s => s.id === targetId
        );
        if (targetIndex !== -1) {
          this.viewer.tourPlayer.loadScene(targetIndex);
        }
      }
    });

    // Handle hotspot hover for cursor
    document.getElementById('viewer-container').addEventListener('mouseover', (e) => {
      const hotspot = e.target.closest('.hotspot-sprite, .hotspot-animated');
      if (hotspot) {
        canvas.style.cursor = 'pointer';
      }
    });

    document.getElementById('viewer-container').addEventListener('mouseout', (e) => {
      const hotspot = e.target.closest('.hotspot-sprite, .hotspot-animated');
      if (hotspot) {
        canvas.style.cursor = 'grab';
      }
    });
  }

  /**
   * Get all hotspots count for statistics
   */
  getHotspotCount() {
    return this.hotspotElements.size;
  }

  /**
   * Get animated hotspots count
   */
  getAnimatedHotspotCount() {
    return this.animatedHotspots.size;
  }
}
