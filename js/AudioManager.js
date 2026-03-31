/**
 * Audio Manager - Background music and audio narration
 * ============================================================
 */

export class AudioManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.backgroundMusic = null;
    this.narrationAudio = null;
    this.isMusicPlaying = false;
    this.isNarrationPlaying = false;
    this.currentTrackIndex = 0;
    this.volume = 0.5;
    this.isMuted = false;
    this.playlist = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPlaylist();
  }

  /**
   * Load music playlist
   */
  loadPlaylist() {
    // Sample ambient music tracks - replace with actual audio files
    this.playlist = [
      {
        id: 1,
        title: 'Ambient Lounge',
        artist: 'Background Music',
        // Using a placeholder - replace with actual audio file URL
        url: '' // Add your audio file URL here
      },
      {
        id: 2,
        title: 'Peaceful Atmosphere',
        artist: 'Ambient Sounds',
        url: ''
      },
      {
        id: 3,
        title: 'Modern Living',
        artist: 'Chill Beats',
        url: ''
      }
    ];
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Music player toggle
    document.getElementById('music-play')?.addEventListener('click', () => {
      this.toggleMusic();
    });

    // Volume control in settings
    const volumeSlider = document.getElementById('settings-volume');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }

    // Mute toggle
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.toggleMute();
      });
    }

    // Keyboard shortcut for mute (M key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        this.toggleMute();
      }
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.toggleMusic();
      }
    });
  }

  /**
   * Initialize background music player
   */
  initMusicPlayer() {
    if (!this.backgroundMusic) {
      this.backgroundMusic = new Audio();
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = this.volume;
      
      this.backgroundMusic.addEventListener('ended', () => {
        this.playNextTrack();
      });

      this.backgroundMusic.addEventListener('error', (e) => {
        console.warn('[AudioManager] Music playback error:', e);
        // Show visual feedback that audio is not available
        this.showAudioNotAvailable();
      });

      this.backgroundMusic.addEventListener('canplay', () => {
        console.log('[AudioManager] Music ready to play');
      });
    }
  }

  /**
   * Toggle music playback
   */
  toggleMusic() {
    if (!this.backgroundMusic) {
      this.initMusicPlayer();
    }

    // Check if we have a valid audio source
    if (!this.playlist[this.currentTrackIndex]?.url) {
      this.showAudioNotAvailable();
      return;
    }

    if (this.isMusicPlaying) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  /**
   * Play music
   */
  async playMusic() {
    if (!this.backgroundMusic) {
      this.initMusicPlayer();
    }

    const track = this.playlist[this.currentTrackIndex];
    if (!track?.url) {
      this.showAudioNotAvailable();
      return;
    }

    try {
      this.backgroundMusic.src = track.url;
      await this.backgroundMusic.play();
      this.isMusicPlaying = true;
      this.updateMusicPlayerUI();
      console.log('[AudioManager] Playing:', track.title);
    } catch (error) {
      console.warn('[AudioManager] Playback failed:', error);
      this.showAudioNotAvailable();
    }
  }

  /**
   * Pause music
   */
  pauseMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.isMusicPlaying = false;
      this.updateMusicPlayerUI();
      console.log('[AudioManager] Music paused');
    }
  }

  /**
   * Stop music
   */
  stopMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.isMusicPlaying = false;
      this.updateMusicPlayerUI();
    }
  }

  /**
   * Play next track
   */
  playNextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    if (this.isMusicPlaying) {
      this.playMusic();
    }
  }

  /**
   * Play previous track
   */
  playPreviousTrack() {
    this.currentTrackIndex = this.currentTrackIndex - 1;
    if (this.currentTrackIndex < 0) {
      this.currentTrackIndex = this.playlist.length - 1;
    }
    if (this.isMusicPlaying) {
      this.playMusic();
    }
  }

  /**
   * Set volume
   */
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.volume;
    }
    if (this.narrationAudio) {
      this.narrationAudio.volume = this.volume;
    }

    // Update volume display
    const volumeDisplay = document.getElementById('settings-volume-value');
    if (volumeDisplay) {
      volumeDisplay.textContent = `${Math.round(this.volume * 100)}%`;
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = this.isMuted;
    }
    if (this.narrationAudio) {
      this.narrationAudio.muted = this.isMuted;
    }

    this.updateMuteUI();
  }

  /**
   * Update music player UI
   */
  updateMusicPlayerUI() {
    const playBtn = document.getElementById('music-play');
    if (!playBtn) return;

    if (this.isMusicPlaying) {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      playBtn.classList.add('playing');
    } else {
      playBtn.innerHTML = '<i class="fas fa-play" style="font-size:14px;margin-left:2px;"></i>';
      playBtn.classList.remove('playing');
    }
  }

  /**
   * Update mute UI
   */
  updateMuteUI() {
    const muteBtn = document.getElementById('btn-mute');
    const musicPlayBtn = document.getElementById('music-play');
    
    if (muteBtn) {
      muteBtn.innerHTML = this.isMuted 
        ? '<i class="fas fa-volume-mute"></i>' 
        : '<i class="fas fa-volume-up"></i>';
      muteBtn.classList.toggle('muted', this.isMuted);
    }

    // Also update music player if muted
    if (musicPlayBtn && this.isMuted) {
      musicPlayBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (!this.isMuted) {
      this.updateMusicPlayerUI();
    }
  }

  /**
   * Show audio not available message
   */
  showAudioNotAvailable() {
    const musicInfo = document.querySelector('.music-info');
    if (musicInfo) {
      const title = musicInfo.querySelector('.music-title');
      const artist = musicInfo.querySelector('.music-artist');
      
      if (title) title.textContent = 'No Audio Available';
      if (artist) artist.textContent = 'Add audio files to enable music';
    }

    // Show toast notification
    this.showToast('Add audio files to enable background music');
  }

  /**
   * Show toast notification
   */
  showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.audio-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'audio-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 24px;
      color: var(--text);
      font-size: 13px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOutDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Play narration audio
   */
  async playNarration(url, onEnded) {
    if (!url) return;

    // Stop any existing narration
    this.stopNarration();

    this.narrationAudio = new Audio(url);
    this.narrationAudio.volume = this.volume;
    this.narrationAudio.muted = this.isMuted;

    if (onEnded) {
      this.narrationAudio.addEventListener('ended', onEnded);
    }

    try {
      await this.narrationAudio.play();
      this.isNarrationPlaying = true;
      
      // Lower background music volume during narration (ducking)
      if (this.backgroundMusic && this.isMusicPlaying) {
        this.backgroundMusic.volume = this.volume * 0.3;
      }
      
      console.log('[AudioManager] Playing narration');
    } catch (error) {
      console.warn('[AudioManager] Narration playback failed:', error);
    }
  }

  /**
   * Stop narration
   */
  stopNarration() {
    if (this.narrationAudio) {
      this.narrationAudio.pause();
      this.narrationAudio = null;
      this.isNarrationPlaying = false;
      
      // Restore background music volume
      if (this.backgroundMusic && this.isMusicPlaying) {
        this.backgroundMusic.volume = this.volume;
      }
      
      console.log('[AudioManager] Narration stopped');
    }
  }

  /**
   * Pause narration
   */
  pauseNarration() {
    if (this.narrationAudio) {
      this.narrationAudio.pause();
      this.isNarrationPlaying = false;
    }
  }

  /**
   * Resume narration
   */
  resumeNarration() {
    if (this.narrationAudio) {
      this.narrationAudio.play();
      this.isNarrationPlaying = true;
    }
  }

  /**
   * Get current music state
   */
  getMusicState() {
    return {
      isPlaying: this.isMusicPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      currentTrack: this.playlist[this.currentTrackIndex]
    };
  }

  /**
   * Set music state
   */
  setMusicState(state) {
    if (state.volume !== undefined) {
      this.setVolume(state.volume);
    }
    if (state.isMuted !== undefined && state.isMuted !== this.isMuted) {
      this.toggleMute();
    }
  }
}
