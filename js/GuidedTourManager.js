/**
 * Guided Tour Manager - Text narration tour system with auto-rotate
 * ============================================================
 */

export class GuidedTourManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.tourType = 'text'; // Text only
    this.steps = [];
    this.currentNarration = null;
    
    // Auto-rotate tracking
    this.rotationStartYaw = 0;
    this.totalRotation = 0;
    this.lastYaw = 0;
    this.rotationComplete = false;
    this.originalAutoRotateDelay = 3000;

    this.init();
  }

  init() {
    this.createTourSteps();
    this.setupEventListeners();
    this.renderSteps();
  }

  createTourSteps() {
    console.log('[GuidedTour] createTourSteps called, project:', this.tourPlayer.project);
    // Create guided tour steps from scenes with detailed narrations
    this.steps = this.tourPlayer.project.scenes.map((scene, index) => ({
      sceneId: scene.id,
      sceneName: scene.name,
      duration: 15000, // 15 seconds minimum for full rotation
      narration: this.getNarrationForScene(index, scene.name),
      view: scene.initialView || { yaw: 0, pitch: 0, fov: 75 }
    }));
    console.log('[GuidedTour] Created', this.steps.length, 'tour steps');
  }

  getNarrationForScene(index, sceneName) {
    // Detailed narrations for each room based on scene names
    const narrations = {
      // Ground Floor
      '01_living': "Welcome to the spacious living room. This elegant space features high ceilings, large windows allowing abundant natural light, and a seamless connection to the dining area. The modern furnishings and refined finishes create a warm and inviting atmosphere perfect for both relaxation and entertaining guests.",
      
      '02_dining & open kitchen': "Moving into the dining area and open kitchen. The dining space comfortably accommodates family gatherings, while the open kitchen design promotes interaction between the cook and guests. Modern appliances and ample counter space make this a functional and stylish culinary hub.",
      
      // First Floor
      '03_first floor family room': "Welcome to the first floor family room. This cozy space serves as a perfect retreat for family members, offering a comfortable area for relaxation, reading, or casual entertainment. The room connects seamlessly to other first-floor bedrooms.",
      
      '04_first floor to bed room': "This corridor on the first floor provides access to the bedrooms. The hallway features elegant finishes and leads you to the private sleeping quarters of the home.",
      
      '05_first floor bed room 1': "This is the first bedroom on the first floor. The room offers a peaceful retreat with comfortable space for a bed and furnishings. Large windows provide natural light and views of the surrounding area.",
      
      '07_first floor to bed room 2': "This hallway connects to another bedroom on the first floor. The corridor maintains the home's consistent design aesthetic with quality finishes throughout.",
      
      '09_first floor hall way from stair': "Here we have the hallway at the top of the stairs on the first floor. This central landing provides access to all first-floor rooms and serves as a transitional space between the bedrooms and family areas.",
      
      // Second Floor
      '10_2nd floor family room': "Welcome to the second floor family room. This additional living space offers versatility for various uses - from a media room to a play area or lounge. The room provides a private retreat on the upper level of the home.",
      
      '11_2nd floor master bed room': "This is the master bedroom on the second floor. The spacious room features ample space for a king-size bed and additional furnishings. Large windows provide excellent natural light and views, creating a serene sleeping environment.",
      
      '12_2nd floor master bed room': "Another view of the master bedroom area. Notice the thoughtful design details including the connection to the master bathroom and dressing room, creating a complete private suite.",
      
      '13_2nd floor master bathroom': "The master bathroom features modern fixtures and finishes. The space includes a vanity area, shower, and premium fittings throughout, providing a spa-like experience in the comfort of your home.",
      
      '14_2nd floor master dressing room': "The master dressing room offers generous storage space with built-in wardrobes and shelving. This walk-in closet provides organized storage for clothing and accessories, completing the master suite.",
      
      '15_2nd floor stair landing': "The stair landing on the second floor connects the upper levels of the home. From this vantage point, you can appreciate the home's vertical circulation and architectural flow.",
      
      // Third Floor (Terrace Level)
      '16_terrace floor': "Welcome to the terrace floor. This outdoor living space extends the home's usable area, perfect for outdoor dining, relaxation, or entertaining. The terrace offers fresh air and open sky views.",
      
      '17_terrace floor office': "This is the office space on the terrace floor. The room provides a quiet, dedicated workspace with natural light and a peaceful environment, ideal for working from home or managing household affairs.",
      
      '18_terrace floor GYM': "The gym on the terrace floor is fully equipped for fitness activities. This dedicated exercise space allows for workouts with ventilation and natural light, promoting a healthy lifestyle at home."
    };

    // Find matching narration based on scene name
    const cleanName = sceneName.replace(/^\d+_/, '');
    
    for (const [key, narration] of Object.entries(narrations)) {
      if (sceneName.includes(key) || cleanName.includes(key.replace(/^\d+_/, ''))) {
        return narration;
      }
    }

    // Fallback narration
    return `Welcome to ${sceneName.replace(/_/g, ' ')}. This space features quality finishes and thoughtful design, contributing to the overall luxury and comfort of this beautiful property.`;
  }

  setupEventListeners() {
    console.log('[GuidedTour] setupEventListeners called');
    // Tour controls - with delay to ensure DOM is ready
    setTimeout(() => {
      const playBtn = document.getElementById('btn-tour-play');
      const pauseBtn = document.getElementById('btn-tour-pause');
      const stopBtn = document.getElementById('btn-tour-stop');
      
      console.log('[GuidedTour] Button elements:', { playBtn, pauseBtn, stopBtn });
      
      playBtn?.addEventListener('click', () => {
        console.log('[GuidedTour] Start button clicked');
        this.startTour();
      });
      
      pauseBtn?.addEventListener('click', () => {
        console.log('[GuidedTour] Pause button clicked');
        this.pauseTour();
      });
      
      stopBtn?.addEventListener('click', () => {
        console.log('[GuidedTour] Stop button clicked');
        this.stopTour();
      });

      // Step clicks
      document.getElementById('guided-tour-steps')?.addEventListener('click', (e) => {
        const stepEl = e.target.closest('.tour-step');
        if (stepEl) {
          const stepIndex = parseInt(stepEl.dataset.index);
          console.log('[GuidedTour] Step clicked:', stepIndex);
          this.goToStep(stepIndex);
        }
      });
    }, 500);
  }

  renderSteps() {
    const container = document.getElementById('guided-tour-steps');
    if (!container) return;

    container.innerHTML = this.steps.map((step, index) => `
      <div class="tour-step" data-index="${index}">
        <div class="tour-step-number">${index + 1}</div>
        <div class="tour-step-info">
          <div class="tour-step-name">${step.sceneName.replace(/^\d+_/, '')}</div>
        </div>
      </div>
    `).join('');
  }

  updateStepHighlight() {
    document.querySelectorAll('.tour-step').forEach((el, index) => {
      el.classList.toggle('active', index === this.currentStep);
    });

    // Update progress
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;
    document.getElementById('tour-progress-fill').style.width = `${progress}%`;
    document.getElementById('tour-progress-text').textContent =
      `${this.currentStep + 1} / ${this.steps.length}`;
  }

  async startTour() {
    if (this.isPlaying) {
      console.log('[GuidedTour] Already playing, ignoring start');
      return;
    }

    console.log('[GuidedTour] Starting tour...');
    this.isPlaying = true;
    this.isPaused = false;
    this.currentStep = 0;

    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('guided-tour-started'));

    // Add class to show room data during guided tour
    document.getElementById('viewer-container')?.classList.add('guided-tour-active');

    // Show guided tour controls in toolbar
    const controlsEl = document.getElementById('guided-tour-controls');
    const guidedTourBtn = document.getElementById('btn-guided-tour');
    if (controlsEl) {
      controlsEl.style.display = 'flex';
      controlsEl.classList.add('active');
    }
    if (guidedTourBtn) guidedTourBtn.style.display = 'none';

    // Close the modal immediately
    if (this.tourPlayer.ui) {
      this.tourPlayer.ui.closeModal('guided-tour');
    }

    // Update UI buttons
    const playBtn = document.getElementById('btn-tour-play');
    const pauseBtn = document.getElementById('btn-tour-pause');
    const stopBtn = document.getElementById('btn-tour-stop');

    if (playBtn) playBtn.disabled = true;
    if (pauseBtn) {
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    if (stopBtn) {
      stopBtn.disabled = false;
      stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }

    // Start playing the first step
    await this.playCurrentStep();
  }

  pauseTour() {
    this.isPaused = !this.isPaused;

    const btn = document.getElementById('btn-tour-pause');

    if (this.isPaused) {
      btn.innerHTML = '<i class="fas fa-play"></i>';
      btn.title = 'Resume';
      // Disable auto-rotate when paused
      if (this.tourPlayer) this.tourPlayer.autoRotate = false;
    } else {
      btn.innerHTML = '<i class="fas fa-pause"></i>';
      btn.title = 'Pause';
      // Re-enable auto-rotate when resuming
      if (this.tourPlayer) {
        this.tourPlayer.autoRotateDelay = 0;
        this.tourPlayer.autoRotate = true;
      }
      this.playCurrentStep();
    }
  }

  stopTour() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    this.rotationComplete = false;

    // Dispatch event for other components to update
    window.dispatchEvent(new CustomEvent('guided-tour-stopped'));

    // Remove class to hide room data
    document.getElementById('viewer-container')?.classList.remove('guided-tour-active');

    // Hide guided tour controls in toolbar, show main button
    const controlsEl = document.getElementById('guided-tour-controls');
    const guidedTourBtn = document.getElementById('btn-guided-tour');
    if (controlsEl) {
      controlsEl.style.display = 'none';
      controlsEl.classList.remove('active');
    }
    if (guidedTourBtn) guidedTourBtn.style.display = 'flex';

    // Restore original auto-rotate settings and disable
    if (this.tourPlayer) {
      if (this.originalAutoRotateDelay !== undefined) {
        this.tourPlayer.autoRotateDelay = this.originalAutoRotateDelay;
      }
      this.tourPlayer.autoRotate = false;
    }

    // Reset UI
    document.getElementById('btn-tour-play').disabled = false;
    document.getElementById('btn-tour-pause').disabled = true;
    document.getElementById('btn-tour-stop').disabled = true;
    document.getElementById('btn-tour-pause').innerHTML = '<i class="fas fa-pause"></i> Pause';

    this.updateStepHighlight();
  }

  async goToStep(index) {
    if (index < 0 || index >= this.steps.length) return;

    this.currentStep = index;
    this.updateStepHighlight();

    const step = this.steps[index];

    // Load scene
    const sceneIndex = this.tourPlayer.project.scenes.findIndex(s => s.id === step.sceneId);
    if (sceneIndex !== -1) {
      this.tourPlayer.loadScene(sceneIndex);
    }

    // Show narration
    this.showNarration(step.narration);
  }

  /**
   * Check if a full 360° rotation has been completed
   */
  checkRotationComplete() {
    if (!this.tourPlayer.viewer) {
      console.log('[GuidedTour] No viewer for rotation check');
      return false;
    }

    const currentYaw = this.tourPlayer.viewer.getYaw();

    // Calculate rotation since start
    let delta = currentYaw - this.lastYaw;

    // Handle wrap-around (e.g., from 359 to 0 degrees)
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    this.totalRotation += Math.abs(delta);
    this.lastYaw = currentYaw;

    // Check if we've rotated at least 360 degrees
    if (this.totalRotation >= 360) {
      this.rotationComplete = true;
      return true;
    }

    return false;
  }

  /**
   * Start auto-rotation for current step
   */
  startAutoRotation() {
    if (this.tourPlayer) {
      // Save original auto-rotate delay and set to 0 for immediate rotation
      this.originalAutoRotateDelay = this.tourPlayer.autoRotateDelay;
      this.tourPlayer.autoRotateDelay = 0; // Start immediately
      this.tourPlayer.enableAutoRotate(true); // Use the new method
      this.rotationStartYaw = this.tourPlayer.viewer.getYaw();
      this.totalRotation = 0;
      this.lastYaw = this.rotationStartYaw;
      this.rotationComplete = false;
      console.log('[GuidedTour] startAutoRotation - yaw:', this.rotationStartYaw);
    }
  }

  async playCurrentStep() {
    if (!this.isPlaying || this.isPaused) {
      console.log('[GuidedTour] playCurrentStep: not playing or paused');
      return;
    }

    const step = this.steps[this.currentStep];
    console.log('[GuidedTour] Playing step', this.currentStep, ':', step.sceneName);
    this.updateStepHighlight();

    // Load scene
    const sceneIndex = this.tourPlayer.project.scenes.findIndex(s => s.id === step.sceneId);
    if (sceneIndex !== -1) {
      this.tourPlayer.loadScene(sceneIndex);
    }

    // Show narration
    this.showNarration(step.narration);

    // Start auto-rotation
    this.startAutoRotation();

    // Wait for rotation to complete (360°)
    const startTime = performance.now();

    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const rotationDone = this.checkRotationComplete();

        // Proceed ONLY when rotation is complete (360°)
        if (rotationDone) {
          console.log('[GuidedTour] Step', this.currentStep, 
            'COMPLETE - time:', Math.round(elapsed), 'ms, rotation:', Math.round(this.totalRotation), '°');
          clearInterval(checkInterval);
          resolve();
        }
      }, 200); // Check every 200ms
    });

    if (this.isPlaying && !this.isPaused) {
      this.currentStep++;

      if (this.currentStep >= this.steps.length) {
        console.log('[GuidedTour] Tour complete!');
        this.stopTour();
      } else {
        this.playCurrentStep();
      }
    }
  }

  showNarration(text) {
    // Update floating info card with narration
    const infoCard = document.getElementById('info-card-description');
    if (infoCard) {
      infoCard.textContent = text;
      infoCard.style.animation = 'none';
      infoCard.offsetHeight; // Trigger reflow
      infoCard.style.animation = 'fadeIn 0.3s ease';
    }
  }
}
