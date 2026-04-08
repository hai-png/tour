/**
 * HAI PNG Virtual Tour - Main Application
 * ============================================================
 */

import { PanoramaViewer } from './PanoramaViewer.js';
import { UIManager } from './UIManager.js';
import { HotspotManager } from './HotspotManager.js';
import { FloorPlanManager } from './FloorPlanManager.js';
import { GuidedTourManager } from './GuidedTourManager.js';
import { LocationManager } from './LocationManager.js';
import { TranslationManager } from './TranslationManager.js';
import { GalleryManager } from './GalleryManager.js';
import { AudioManager } from './AudioManager.js';
import { CaptureViewManager } from './CaptureViewManager.js';
import { PWAManager } from './PWAManager.js';
import { VRModeManager } from './VRModeManager.js';
import { BrandLoader } from './BrandLoader.js';

export class TourPlayer {
  constructor(projectUrl) {
    this.projectUrl = projectUrl;
    this.project = null;
    this.currentSceneIndex = 0;
    this.autoRotate = true;  // Enabled by default
    this.autoRotateDelay = 3000;
    // Initialize to past so auto-rotate can start immediately after scene loads
    this.lastInteraction = -this.autoRotateDelay - 1000; // Use relative time (negative = in the past)
    this.defaultFOV = 60;  // Default zoom level

    this.viewer = null;
    this.ui = null;
    this.hotspotManager = null;
    this.floorPlanManager = null;
    this.brandLoader = null;

    // Room data for display
    this.roomData = this.initializeRoomData();
  }
  
  initializeRoomData() {
    return {
      // Ground Floor
      '01_living': {
        typeKey: 'livingRoom',
        areaKey: 'area_45_sqm',
        featureKeys: ['highCeilings', 'largeWindows', 'naturalLight', 'openPlan']
      },
      '02_dining & open kitchen': {
        typeKey: 'diningKitchen',
        areaKey: 'area_35_sqm',
        featureKeys: ['openKitchen', 'diningArea', 'modernAppliances', 'counterSpace']
      },

      // First Floor
      '03_first floor family room': {
        typeKey: 'familyRoom',
        areaKey: 'area_25_sqm',
        featureKeys: ['cozySpace', 'familyArea', 'relaxationZone', 'firstFloor']
      },
      '04_first floor to bed room': {
        typeKey: 'corridor',
        areaKey: 'area_8_sqm',
        featureKeys: ['hallwayAccess', 'bedroomAccess', 'elegantFinishes', 'transitionalSpace']
      },
      '05_first floor bed room 1': {
        typeKey: 'bedroom',
        areaKey: 'area_20_sqm',
        featureKeys: ['peacefulRetreat', 'naturalLight', 'comfortableSpace', 'private']
      },
      '07_first floor to bed room 2': {
        typeKey: 'corridor',
        areaKey: 'area_6_sqm',
        featureKeys: ['hallwayAccess', 'bedroomAccess', 'qualityFinishes', 'connectionSpace']
      },
      '09_first floor hall way from stair': {
        typeKey: 'hallway',
        areaKey: 'area_10_sqm',
        featureKeys: ['centralLanding', 'stairAccess', 'roomConnections', 'transitional']
      },

      // Second Floor
      '10_2nd floor family room': {
        typeKey: 'familyRoom',
        areaKey: 'area_30_sqm',
        featureKeys: ['additionalLiving', 'versatileSpace', 'upperLevel', 'privateRetreat']
      },
      '11_2nd floor master bed room': {
        typeKey: 'masterBedroom',
        areaKey: 'area_35_sqm',
        featureKeys: ['spacious', 'kingSizeCapacity', 'naturalLight', 'sereneEnvironment']
      },
      '12_2nd floor master bed room': {
        typeKey: 'masterBedroom',
        areaKey: 'area_35_sqm',
        featureKeys: ['masterSuite', 'designDetails', 'bathroomAccess', 'dressingRoomAccess']
      },
      '13_2nd floor master bathroom': {
        typeKey: 'masterBathroom',
        areaKey: 'area_12_sqm',
        featureKeys: ['modernFixtures', 'vanityArea', 'shower', 'premiumFittings']
      },
      '14_2nd floor master dressing room': {
        typeKey: 'dressingRoom',
        areaKey: 'area_10_sqm',
        featureKeys: ['walkInCloset', 'builtInWardrobes', 'organizedStorage', 'masterSuite']
      },
      '15_2nd floor stair landing': {
        typeKey: 'stairLanding',
        areaKey: 'area_8_sqm',
        featureKeys: ['upperLevels', 'verticalCirculation', 'architecturalFlow', 'connection']
      },

      // Third Floor (Terrace Level)
      '16_terrace floor': {
        typeKey: 'terrace',
        areaKey: 'area_50_sqm',
        featureKeys: ['outdoorLiving', 'freshAir', 'openSky', 'entertainmentSpace']
      },
      '17_terrace floor office': {
        typeKey: 'office',
        areaKey: 'area_15_sqm',
        featureKeys: ['dedicatedWorkspace', 'naturalLight', 'quietEnvironment', 'homeOffice']
      },
      '18_terrace floor GYM': {
        typeKey: 'gym',
        areaKey: 'area_20_sqm',
        featureKeys: ['fitnessArea', 'fullyEquipped', 'ventilation', 'healthyLifestyle']
      }
    };
  }

  async init() {
    try {
      // Initialize brand loader
      this.brandLoader = window.brandLoader || new BrandLoader();
      if (this.brandLoader.isBrandLoaded()) {
        console.log(`[TourPlayer] Brand loaded: ${this.brandLoader.getBrandSlug()}`);
        // Apply tour UI styles after DOM is ready
        this.brandLoader.applyTheme();
        
        // Update contact, share, location from brand config
        this.brandLoader.updateContactInfo();
        this.brandLoader.updateShareInfo();
        this.brandLoader.updateLocationInfo();
      }

      // Load project data
      const response = await fetch(this.projectUrl);
      this.project = await response.json();
      console.log(`[TourPlayer] Loaded: ${this.project.name} (${this.project.scenes.length} scenes)`);

      // Initialize components
      this.viewer = new PanoramaViewer('viewer-container', 'panorama-canvas', this);
      this.ui = new UIManager(this);
      this.hotspotManager = new HotspotManager(this.viewer);
      this.floorPlanManager = new FloorPlanManager(this);
      this.guidedTourManager = new GuidedTourManager(this);
      this.locationManager = new LocationManager(this);
      this.translationManager = new TranslationManager();
      this.galleryManager = new GalleryManager(this);
      this.audioManager = new AudioManager(this);
      this.captureViewManager = new CaptureViewManager(this);
      this.pwaManager = new PWAManager(this);
      this.vrModeManager = new VRModeManager(this);

      // Apply initial translations
      this.translationManager.applyTranslations();

      // Setup guided tour state listener
      this.setupGuidedTourListener();

      // Load first scene
      this.loadScene(0);

      // Update gallery widget
      this.ui.updateGalleryWidget();

      // Start animation loop
      this.lastTime = performance.now();
      this.animate();

      // Update loading stats
      this.updateLoadingStats();

      // Show loading screen (no intro controls needed)
      setTimeout(() => {
        const loadingStats = document.querySelector('.loading-stats');
        if (loadingStats) {
          loadingStats.style.opacity = '1';
        }
      }, 500);

      console.log('[TourPlayer] Initialized');
    } catch (error) {
      console.error('[TourPlayer] Initialization failed:', error);
      const loading = document.getElementById('loading');
      if (loading) {
        loading.innerHTML = `
          <div style="color:#fff;text-align:center;padding:20px;">
            <h3>Error Loading Tour</h3>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  updateLoadingStats() {
    // Update stats display
    const scenesEl = document.getElementById('stat-total-scenes');
    const hotspotsEl = document.getElementById('stat-total-hotspots');
    const floorsEl = document.getElementById('stat-total-floors');

    if (scenesEl) scenesEl.textContent = this.project.scenes.length;
    if (hotspotsEl) {
      // Get hotspot count from hotspot manager after data loads
      setTimeout(() => {
        const count = this.hotspotManager.getHotspotCount();
        hotspotsEl.textContent = count > 0 ? count : this.project.scenes.length * 2; // Estimate if not loaded
      }, 1000);
    }
    if (floorsEl) floorsEl.textContent = Math.ceil(this.project.scenes.length / 5); // Estimate floors
  }

  /**
   * Setup guided tour state listener
   */
  setupGuidedTourListener() {
    window.addEventListener('guided-tour-started', () => {
      // Show room data when tour starts
      this.updateRoomData(this.project.scenes[this.currentSceneIndex]?.name);
    });

    window.addEventListener('guided-tour-stopped', () => {
      // Hide room data when tour stops
      this.updateRoomData(this.project.scenes[this.currentSceneIndex]?.name);
    });
  }

  loadScene(index) {
    if (index < 0 || index >= this.project.scenes.length) return;

    this.currentSceneIndex = index;
    const scene = this.project.scenes[index];

    // Update room data display
    this.updateRoomData(scene.name);

    // Update UI
    this.ui.updateSceneList(index);
    this.ui.updateNavLabels(index, this.project.scenes);
    this.ui.updateFloatingInfoCard(scene);

    // Load panorama
    this.viewer.loadScene(scene, () => {
      // On load complete
      this.hotspotManager.renderHotspots(scene);

      // Update floor plan
      this.floorPlanManager.updateRadar(this.viewer.getYaw(), scene.id);
    });
  }
  
  updateRoomData(sceneName) {
    const roomData = this.roomData[sceneName];
    const isGuidedTour = this.guidedTourManager?.isPlaying || false;

    // Only show room data (type, area, features) during guided tour
    const showRoomData = isGuidedTour;

    if (roomData) {
      // Get translation manager
      const translationManager = this.translationManager;

      // Update room name (always visible)
      const nameEl = document.getElementById('current-room-name');
      if (nameEl) {
        // Format room name: remove numbers, keep floor for family rooms
        let formattedName = sceneName.replace(/^\d+_\s*/, '');
        const isFamilyRoom = formattedName.toLowerCase().includes('family room');
        if (!isFamilyRoom) {
          formattedName = formattedName.replace(/^(first|1st|second|2nd|third|3rd|fourth|4th)\s+floor\s+/i, '');
        }
        formattedName = formattedName.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        nameEl.textContent = formattedName;
      }

      // Update room data container visibility
      const roomDataEl = document.getElementById('current-room-data');
      if (roomDataEl) {
        roomDataEl.style.display = showRoomData ? 'block' : 'none';
      }

      if (showRoomData) {
        // Update room type using translation
        const typeEl = document.getElementById('room-type');
        if (typeEl && roomData.typeKey) {
          typeEl.textContent = translationManager.t(roomData.typeKey);
        }

        // Update room area using translation
        const areaEl = document.getElementById('room-area');
        if (areaEl && roomData.areaKey) {
          areaEl.textContent = translationManager.t(roomData.areaKey);
        }

        // Update room features using translations
        const featuresEl = document.getElementById('room-features');
        if (featuresEl && roomData.featureKeys) {
          const translatedFeatures = roomData.featureKeys.map(key => translationManager.t(key));
          featuresEl.textContent = translatedFeatures.join(' • ');
        }
      }
    }
  }

  nextScene() {
    this.loadScene(this.currentSceneIndex + 1);
  }

  prevScene() {
    this.loadScene(this.currentSceneIndex - 1);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.autoRotate) {
      // Force auto-rotate to start immediately by setting lastInteraction to past (relative time)
      this.lastInteraction = performance.now() - this.autoRotateDelay - 1000;
    }
    return this.autoRotate;
  }

  /**
   * Enable auto-rotate directly (for guided tour)
   */
  enableAutoRotate(immediate = true) {
    this.autoRotate = true;
    if (immediate) {
      // Set lastInteraction to 5 seconds in the PAST so rotation starts immediately
      this.lastInteraction = performance.now() - this.autoRotateDelay - 5000;
    }
  }

  /**
   * Disable auto-rotate directly
   */
  disableAutoRotate() {
    this.autoRotate = false;
  }

  setFOV(fov) {
    // Store default FOV
    this.defaultFOV = fov;
    
    // Set FOV for current and all scenes
    this.project.scenes.forEach(scene => {
      if (scene.initialView) {
        scene.initialView.fov = fov;
      }
    });
    
    // Apply to current view immediately
    if (this.viewer) {
      this.viewer.fov = fov;
      this.viewer.setFov(fov);  // This also calls updateCamera()
      console.log(`[TourPlayer] FOV set to ${fov}°`);
    }
  }

  resetView() {
    this.viewer.setView(0, 0, this.defaultFOV);
  }

  animate(currentTime = performance.now()) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Auto-rotate (faster speed for better visibility)
    // Use performance.now() for lastInteraction comparison
    const timeSinceInteraction = currentTime - this.lastInteraction;
    const shouldRotate = this.autoRotate && timeSinceInteraction > this.autoRotateDelay;

    if (shouldRotate) {
      const newYaw = this.viewer.getYaw() + 0.015 * deltaTime;
      this.viewer.setYaw(newYaw);
    }

    // Update floor plan radar
    this.floorPlanManager.updateRadar(this.viewer.getYaw(), this.project.scenes[this.currentSceneIndex]?.id);

    // Update hotspot animations
    this.hotspotManager.update(deltaTime);

    // Update compass
    this.ui.updateCompass(this.viewer.getYaw());

    requestAnimationFrame((t) => this.animate(t));
  }
}

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.tourPlayer = new TourPlayer('media/tdv-import/project.json');
  window.tourPlayer.init();
});
