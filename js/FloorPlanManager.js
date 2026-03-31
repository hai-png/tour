/**
 * Floor Plan Manager - Multi-floor support with radar, paths, and mini-map
 * ============================================================
 */

export class FloorPlanManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.currentFloorIndex = 0;
    this.currentSceneId = null;
    this.radarRotation = 0;
    this.isMiniMapMode = false;
    this.floorPlanImage = null; // Store loaded image
    this.floorPlanConfig = null; // Store loaded floor plan configuration

    // Floor configuration with image paths (using WebP for better performance)
    this.floors = [
      { id: 'ground', nameKey: 'groundFloor', image: 'floor-plan/ground.webp' },
      { id: 'first', nameKey: 'firstFloor', image: 'floor-plan/first.webp' },
      { id: 'second', nameKey: 'secondFloor', image: 'floor-plan/second.webp' },
      { id: 'third', nameKey: 'thirdFloor', image: 'floor-plan/third.webp' }
    ];

    // Scene to floor mapping based on scene names
    this.sceneFloorMap = {};
    this.scenePositions = {}; // Store scene positions for floor plan markers

    this.buildSceneFloorMap();
    this.loadFloorPlanConfig();

    this.init();
  }

  /**
   * Load floor plan configuration with scene positions
   */
  async loadFloorPlanConfig() {
    try {
      const response = await fetch('floor-plan/floor-plan-config.json');
      if (response.ok) {
        this.floorPlanConfig = await response.json();
        console.log('[FloorPlanManager] Loaded floor plan config:', this.floorPlanConfig.floors.length, 'floors');
        
        // Hide the CSS radar overlay since we're drawing on canvas
        const radarEl = document.getElementById('floor-plan-radar');
        if (radarEl) {
          radarEl.style.display = 'none';
        }
        
        // Build scene position map
        this.floorPlanConfig.floors.forEach((floor, floorIndex) => {
          if (floor.scenes) {
            floor.scenes.forEach(scene => {
              this.scenePositions[scene.sceneId] = {
                floorIndex,
                position: scene.position,
                initialView: scene.initialView
              };
            });
          }
        });
      }
    } catch (error) {
      console.warn('[FloorPlanManager] Could not load floor plan config:', error.message);
      console.log('[FloorPlanManager] Will use default floor configuration without scene markers');
    }
  }

  /**
   * Build scene to floor mapping based on scene names
   */
  buildSceneFloorMap() {
    if (!this.tourPlayer.project) return;
    
    this.tourPlayer.project.scenes.forEach((scene, index) => {
      const name = scene.name.toLowerCase();
      let floorIndex = 0; // Default to ground
      
      // Map scenes to floors based on name patterns
      if (name.includes('ground') || name.startsWith('01_') || name.startsWith('02_')) {
        floorIndex = 0; // Ground floor
      } else if (name.includes('first') || name.startsWith('03_') || name.startsWith('04_') || 
                 name.startsWith('05_') || name.startsWith('06_') || name.startsWith('07_') || 
                 name.startsWith('08_') || name.startsWith('09_')) {
        floorIndex = 1; // First floor
      } else if (name.includes('second') || name.startsWith('10_') || name.startsWith('11_') || 
                 name.startsWith('12_') || name.startsWith('13_') || name.startsWith('14_') ||
                 name.startsWith('15_')) {
        floorIndex = 2; // Second floor (including stair landing)
      } else if (name.includes('third') || name.includes('terrace') || name.startsWith('16_') || 
                 name.startsWith('17_') || name.startsWith('18_')) {
        floorIndex = 3; // Third floor (terrace levels only)
      }
      
      this.sceneFloorMap[scene.id] = {
        floorIndex,
        floorId: this.floors[floorIndex].id,
        sceneIndex: index,
        initialView: scene.initialView || { yaw: 0, pitch: 0, fov: 60 }
      };
    });
  }

  init() {
    this.createFloorPlanUI();
    this.setupInteraction();
    this.loadFloorImage(0);
    this.setupLanguageListener();
  }

  /**
   * Setup language change listener
   */
  setupLanguageListener() {
    window.addEventListener('language-changed', () => {
      this.updateFloorNameLabel();
    });
  }

  createFloorPlanUI() {
    this.canvas = document.getElementById('floor-plan-canvas');

    if (!this.canvas) {
      console.error('[FloorPlanManager] floor-plan-canvas not found');
      return;
    }

    this.canvas.width = this.canvas.offsetWidth || 240;
    this.canvas.height = this.canvas.offsetHeight || 200;
    this.ctx = this.canvas.getContext('2d');
    
    this.radarEl = document.getElementById('floor-plan-radar');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle button
    document.getElementById('floor-plan-toggle')?.addEventListener('click', () => {
      const content = document.getElementById('floor-plan-content');
      const icon = document.querySelector('#floor-plan-toggle i');
      if (content) {
        content.classList.toggle('collapsed');
        if (icon) {
          // Show chevron-down when collapsed (pointing down to expand)
          // Show chevron-up when expanded (pointing up to collapse)
          icon.className = content.classList.contains('collapsed')
            ? 'fas fa-chevron-down'
            : 'fas fa-chevron-up';
        }
      }
    });

    // Initialize collapsed on mobile
    if (window.innerWidth <= 480) {
      const content = document.getElementById('floor-plan-content');
      const icon = document.querySelector('#floor-plan-toggle i');
      if (content) {
        content.classList.add('collapsed');
      }
      if (icon) {
        icon.className = 'fas fa-chevron-down';
      }
    }
  }

  /**
   * Get floor index for a scene
   */
  getFloorForScene(sceneId) {
    const mapping = this.sceneFloorMap[sceneId];
    return mapping ? mapping.floorIndex : 0;
  }

  /**
   * Get initial view for a scene
   */
  getInitialViewForScene(sceneId) {
    const mapping = this.sceneFloorMap[sceneId];
    return mapping ? mapping.initialView : { yaw: 0, pitch: 0, fov: 60 };
  }

  /**
   * Get translated floor name
   */
  getFloorName(floorIndex) {
    const floor = this.floors[floorIndex];
    if (!floor || !floor.nameKey) return '';

    const translationManager = this.tourPlayer.translationManager;
    if (translationManager) {
      return translationManager.t(floor.nameKey);
    }
    return floor.nameKey;
  }

  /**
   * Load floor plan image for current floor
   */
  loadFloorImage(floorIndex) {
    if (floorIndex < 0 || floorIndex >= this.floors.length) return;

    const floor = this.floors[floorIndex];
    const img = new Image();
    img.crossOrigin = '';

    img.onload = () => {
      if (!this.canvas || !this.ctx) return;

      this.canvas.width = this.canvas.offsetWidth || 240;
      this.canvas.height = this.canvas.offsetHeight || 200;
      this.floorPlanImage = img; // Store for redrawing

      // Update floor name in UI with translation
      this.updateFloorNameLabel();

      this.render(); // Draw floor plan + FOV
    };

    img.onerror = () => {
      console.warn(`[FloorPlanManager] Failed to load floor plan: ${floor.image}`);
      this.floorPlanImage = null;
      this.drawPlaceholder();
    };

    img.src = floor.image;
  }

  /**
   * Update floor name label with translation
   */
  updateFloorNameLabel() {
    const floorNameEl = document.getElementById('floor-plan-name');
    if (floorNameEl) {
      floorNameEl.textContent = this.getFloorName(this.currentFloorIndex);
    }
  }

  /**
   * Render floor plan with FOV indicator and scene markers
   */
  render(yaw = null, fov = null) {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw floor plan image if loaded
    if (this.floorPlanImage) {
      const scale = Math.min(width / this.floorPlanImage.width, height / this.floorPlanImage.height);
      const x = (width - this.floorPlanImage.width * scale) / 2;
      const y = (height - this.floorPlanImage.height * scale) / 2;

      this.ctx.drawImage(this.floorPlanImage, x, y, this.floorPlanImage.width * scale, this.floorPlanImage.height * scale);

      // Draw border
      this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, this.floorPlanImage.width * scale, this.floorPlanImage.height * scale);

      // Draw scene markers
      this.drawSceneMarkers(x, y, scale);
    }

    // Draw FOV indicator if yaw provided
    if (yaw !== null) {
      this.drawFOVIndicator(yaw, fov || 60);
    }
  }

  /**
   * Draw placeholder when image fails to load
   */
  drawPlaceholder() {
    if (!this.ctx || !this.canvas) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(10, 10, width - 20, height - 20);
    
    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    this.ctx.font = '12px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Floor Plan', width / 2, height / 2);
  }

  /**
   * Update radar when scene or view changes
   */
  updateRadar(yaw, sceneId) {
    // Store current yaw for radar rotation
    this.radarRotation = yaw;

    // Update the radar direction indicator
    const directionEl = document.getElementById('radar-direction');
    if (directionEl) {
      directionEl.style.transform = `translate(-50%, -50%) rotate(${-yaw}deg)`;
    }

    // Check if floor changed
    if (sceneId && sceneId !== this.currentSceneId) {
      const newFloorIndex = this.getFloorForScene(sceneId);

      if (newFloorIndex !== this.currentFloorIndex) {
        this.currentFloorIndex = newFloorIndex;
        this.loadFloorImage(newFloorIndex);
      }

      this.currentSceneId = sceneId;
    }

    // Render floor plan with FOV indicator
    const fov = this.tourPlayer.viewer?.getFov() || 60;
    this.render(yaw, fov);

    // Update mini-map if active
    if (this.isMiniMapMode) {
      this.updateMiniMap();
    }
  }

  /**
   * Draw FOV indicator showing camera view on floor plan
   */
  drawFOVIndicator(yaw, fov) {
    if (!this.ctx || !this.canvas || !this.floorPlanImage) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Find current scene position
    let centerX = width / 2;
    let centerY = height / 2;

    if (this.currentSceneId && this.floorPlanConfig) {
      const floor = this.floors[this.currentFloorIndex];
      const configFloor = this.floorPlanConfig.floors.find(f => f.id === floor.id);
      
      if (configFloor && configFloor.scenes) {
        const currentSceneConfig = configFloor.scenes.find(s => s.sceneId === this.currentSceneId);
        
        if (currentSceneConfig) {
          const imageWidth = this.floorPlanImage.width;
          const imageHeight = this.floorPlanImage.height;
          const scale = Math.min(width / imageWidth, height / imageHeight);
          const imageX = (width - imageWidth * scale) / 2;
          const imageY = (height - imageHeight * scale) / 2;
          
          // Position at current scene marker
          centerX = imageX + (currentSceneConfig.position.x / 100) * imageWidth * scale;
          centerY = imageY + (currentSceneConfig.position.y / 100) * imageHeight * scale;
        }
      }
    }

    // Convert yaw to radians
    // yaw 0 = up (canvas -PI/2), positive yaw = clockwise
    const yawRad = (-yaw - 90) * Math.PI / 180;
    const fovRad = fov * Math.PI / 180;
    const halfFov = fovRad / 2;
    const coneRadius = Math.min(width, height) * 0.25; // Smaller cone

    const startAngle = yawRad - halfFov;
    const endAngle = yawRad + halfFov;

    // Draw FOV cone (solid, no circles)
    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    // Create gradient for FOV cone
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coneRadius);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

    // Draw FOV sector
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(0, 0, coneRadius, startAngle, endAngle, false);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw view direction arrow (no center dot)
    const arrowLength = coneRadius * 0.9;
    const arrowX = Math.cos(yawRad) * arrowLength;
    const arrowY = Math.sin(yawRad) * arrowLength;

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(arrowX, arrowY);
    this.ctx.strokeStyle = 'rgba(244, 114, 182, 1)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Arrow head
    const headLength = 6;
    const headAngle = Math.PI / 6;
    this.ctx.beginPath();
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - headLength * Math.cos(yawRad - headAngle),
      arrowY - headLength * Math.sin(yawRad - headAngle)
    );
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - headLength * Math.cos(yawRad + headAngle),
      arrowY - headLength * Math.sin(yawRad + headAngle)
    );
    this.ctx.strokeStyle = 'rgba(244, 114, 182, 1)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * Draw scene markers on the floor plan
   */
  drawSceneMarkers(imageX, imageY, scale) {
    if (!this.floorPlanConfig || !this.floors[this.currentFloorIndex]) return;

    const floor = this.floors[this.currentFloorIndex];
    const configFloor = this.floorPlanConfig.floors.find(f => f.id === floor.id);
    
    if (!configFloor || !configFloor.scenes) return;

    const imageWidth = this.floorPlanImage.width;
    const imageHeight = this.floorPlanImage.height;

    configFloor.scenes.forEach(scene => {
      // Skip drawing the current scene marker - it's shown by the FOV indicator
      if (scene.sceneId === this.currentSceneId) return;

      const pos = scene.position;
      
      // Convert percentage position to canvas coordinates
      const x = imageX + (pos.x / 100) * imageWidth * scale;
      const y = imageY + (pos.y / 100) * imageHeight * scale;

      // Check if this is hovered
      const isHovered = this.hoveredScene && this.hoveredScene.sceneId === scene.sceneId;

      // Draw marker
      this.ctx.save();
      
      // Outer glow for hovered scene
      if (isHovered) {
        this.ctx.shadowColor = 'rgba(99, 102, 241, 0.8)';
        this.ctx.shadowBlur = 8;
      }

      // Draw marker circle (larger when hovered)
      const markerRadius = isHovered ? 7 : 5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(99, 102, 241, 0.8)'; // Purple for other scenes
      this.ctx.fill();

      // Draw white center dot
      const centerRadius = isHovered ? 3 : 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, centerRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.fill();

      // Draw tooltip if hovered
      if (isHovered) {
        this.ctx.shadowBlur = 0;
        this.ctx.font = '11px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // Background for tooltip
        const text = scene.sceneName.replace(/^\d+_/, ''); // Remove prefix like "01_"
        const textWidth = this.ctx.measureText(text).width;
        const padding = 4;
        const tooltipX = x;
        const tooltipY = y - markerRadius - 8;
        
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(tooltipX - textWidth / 2 - padding, tooltipY - 14, textWidth + padding * 2, 18, 3);
        this.ctx.fill();
        
        // Text
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.fillText(text, tooltipX, tooltipY);
      }

      this.ctx.restore();
    });
  }

  /**
   * Mini-map functionality
   */
  toggleMiniMap() {
    this.isMiniMapMode = !this.isMiniMapMode;
    if (this.isMiniMapMode) {
      this.showMiniMap();
    } else {
      this.hideMiniMap();
    }
  }

  showMiniMap() {
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
      minimapContainer.classList.add('active');
      this.updateMiniMap();
    }
  }

  hideMiniMap() {
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
      minimapContainer.classList.remove('active');
    }
    this.isMiniMapMode = false;
  }

  updateMiniMap() {
    const minimapCanvas = document.getElementById('minimap-canvas');
    if (!minimapCanvas) return;

    const minimapCtx = minimapCanvas.getContext('2d');
    if (!minimapCtx) return;

    const floor = this.floors[this.currentFloorIndex];
    const img = new Image();
    img.crossOrigin = '';

    img.onload = () => {
      minimapCanvas.width = 200;
      minimapCanvas.height = 200;

      // Draw floor plan (dimmed)
      minimapCtx.globalAlpha = 0.3;
      const scale = Math.min(
        minimapCanvas.width / img.width,
        minimapCanvas.height / img.height
      );
      const x = (minimapCanvas.width - img.width * scale) / 2;
      const y = (minimapCanvas.height - img.height * scale) / 2;
      minimapCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
      minimapCtx.globalAlpha = 1;

      // Draw scene markers on mini-map
      this.drawMiniMapSceneMarkers(minimapCtx, x, y, scale);

      // Draw radar at current scene position
      this.drawMiniMapRadar(minimapCtx, minimapCanvas.width, minimapCanvas.height, x, y, scale);
    };

    img.src = floor.image;
  }

  drawMiniMapSceneMarkers(ctx, imageX, imageY, scale) {
    if (!this.floorPlanConfig || !this.floors[this.currentFloorIndex]) return;

    const floor = this.floors[this.currentFloorIndex];
    const configFloor = this.floorPlanConfig.floors.find(f => f.id === floor.id);
    
    if (!configFloor || !configFloor.scenes) return;

    const imageWidth = this.floorPlanImage?.width || 1;
    const imageHeight = this.floorPlanImage?.height || 1;

    configFloor.scenes.forEach(scene => {
      const pos = scene.position;
      const x = imageX + (pos.x / 100) * imageWidth * scale;
      const y = imageY + (pos.y / 100) * imageHeight * scale;
      
      const isCurrentScene = scene.sceneId === this.currentSceneId;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, isCurrentScene ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isCurrentScene ? 'rgba(244, 114, 182, 1)' : 'rgba(99, 102, 241, 0.8)';
      ctx.fill();
      ctx.restore();
    });
  }

  drawMiniMapRadar(ctx, width, height, imageX, imageY, scale, yaw = null, fov = null) {
    // Find current scene position for mini-map
    let centerX = width / 2;
    let centerY = height / 2;

    if (this.currentSceneId && this.floorPlanConfig) {
      const floor = this.floors[this.currentFloorIndex];
      const configFloor = this.floorPlanConfig.floors.find(f => f.id === floor.id);
      
      if (configFloor && configFloor.scenes) {
        const currentSceneConfig = configFloor.scenes.find(s => s.sceneId === this.currentSceneId);
        
        if (currentSceneConfig && this.floorPlanImage) {
          const imageWidth = this.floorPlanImage.width;
          const imageHeight = this.floorPlanImage.height;
          centerX = imageX + (currentSceneConfig.position.x / 100) * imageWidth * scale;
          centerY = imageY + (currentSceneConfig.position.y / 100) * imageHeight * scale;
        }
      }
    }

    const rotation = yaw !== null ? yaw : this.radarRotation;
    const fovRad = fov !== null ? fov * Math.PI / 180 : 60 * Math.PI / 180;
    const halfFov = fovRad / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-rotation * Math.PI / 180);

    // Draw FOV cone
    const coneLength = 30;
    const coneWidth = Math.tan(halfFov) * coneLength;

    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(coneWidth, coneLength);
    ctx.lineTo(-coneWidth, coneLength);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coneLength);
    gradient.addColorStop(0, 'rgba(244, 114, 182, 0.8)');
    gradient.addColorStop(1, 'rgba(244, 114, 182, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  setupInteraction() {
    if (!this.canvas) return;

    this.hoveredScene = null;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      let hoveredSceneId = null;

      // Check if hovering over a scene marker
      if (this.floorPlanConfig && this.floors[this.currentFloorIndex] && this.floorPlanImage) {
        const floor = this.floors[this.currentFloorIndex];
        const configFloor = this.floorPlanConfig.floors.find(f => f.id === floor.id);
        
        if (configFloor && configFloor.scenes) {
          const imageWidth = this.floorPlanImage.width;
          const imageHeight = this.floorPlanImage.height;
          const scale = Math.min(
            this.canvas.width / imageWidth,
            this.canvas.height / imageHeight
          );
          const imageX = (this.canvas.width - imageWidth * scale) / 2;
          const imageY = (this.canvas.height - imageHeight * scale) / 2;

          for (const scene of configFloor.scenes) {
            const pos = scene.position;
            const markerX = imageX + (pos.x / 100) * imageWidth * scale;
            const markerY = imageY + (pos.y / 100) * imageHeight * scale;
            
            // Check distance to marker (with some padding for easier hovering)
            const dx = x * this.canvas.width - markerX;
            const dy = y * this.canvas.height - markerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 15) {
              hoveredSceneId = scene.sceneId;
              this.hoveredScene = scene;
              this.canvas.style.cursor = 'pointer';
              break;
            }
          }
        }
      }

      if (!hoveredSceneId) {
        this.hoveredScene = null;
        this.canvas.style.cursor = 'default';
      }

      // Redraw to update hover effect
      this.render();
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Check if clicked on a scene marker
      if (this.floorPlanConfig && this.floors[this.currentFloorIndex] && this.hoveredScene) {
        const sceneIndex = this.tourPlayer.project.scenes.findIndex(
          s => s.id === this.hoveredScene.sceneId
        );
        if (sceneIndex !== -1) {
          console.log('[FloorPlanManager] Navigating to scene:', this.hoveredScene.sceneName);
          this.tourPlayer.loadScene(sceneIndex);
          return;
        }
      }

      // If not clicking on a marker, rotate view
      const centerX = 0.5;
      const centerY = 0.5;
      const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;

      if (this.tourPlayer.viewer) {
        this.tourPlayer.viewer.setYaw(angle + 90);
      }
    });
  }
}
