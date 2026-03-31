/**
 * Location Manager - Interactive map with Leaflet.js
 * ============================================================
 */

export class LocationManager {
  constructor(tourPlayer) {
    this.tourPlayer = tourPlayer;
    this.map = null;
    this.marker = null;
    this.isInitialized = false;
    
    // Default location (Port Moresby, PNG - can be customized)
    this.defaultLocation = {
      lat: -9.4431,
      lng: 147.1803,
      address: '123 Virtual Street, Digital City, DC 12345',
      name: 'HAI PNG Property'
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Initialize map when location modal is opened
    document.getElementById('btn-location')?.addEventListener('click', () => {
      setTimeout(() => this.initMap(), 100);
    });

    // Copy address button
    document.getElementById('btn-copy-address')?.addEventListener('click', () => {
      this.copyAddress();
    });

    // Open external map button
    document.getElementById('btn-open-external-map')?.addEventListener('click', () => {
      this.openExternalMap();
    });
  }

  /**
   * Initialize Leaflet map
   */
  initMap() {
    if (this.isInitialized) {
      // Map already initialized, just invalidate size
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
      return;
    }

    const mapContainer = document.getElementById('location-map');
    if (!mapContainer) return;

    try {
      // Initialize map centered on location
      this.map = L.map('location-map', {
        zoomControl: true,
        attributionControl: true
      }).setView([this.defaultLocation.lat, this.defaultLocation.lng], 15);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add custom marker
      this.marker = L.marker([this.defaultLocation.lat, this.defaultLocation.lng]).addTo(this.map);

      // Add popup to marker
      this.marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #6366f1;">${this.defaultLocation.name}</h4>
          <p style="margin: 0; color: #94a3b8;">${this.defaultLocation.address}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            <i class="fas fa-phone" style="color: #6366f1;"></i> +675 1234 5678
          </p>
        </div>
      `);

      // Add click listener to map
      this.map.on('click', (e) => {
        this.marker.setLatLng(e.latlng);
        this.defaultLocation.lat = e.latlng.lat;
        this.defaultLocation.lng = e.latlng.lng;
      });

      this.isInitialized = true;

      // Update address in UI
      const addressEl = document.getElementById('location-address');
      if (addressEl) {
        addressEl.textContent = this.defaultLocation.address;
      }

    } catch (error) {
      console.error('[LocationManager] Error initializing map:', error);
    }
  }

  /**
   * Set location coordinates
   */
  setLocation(lat, lng, address, name) {
    this.defaultLocation = { lat, lng, address, name };

    if (this.map) {
      this.map.setView([lat, lng], 15);
      
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
        this.marker.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #6366f1;">${name}</h4>
            <p style="margin: 0; color: #94a3b8;">${address}</p>
          </div>
        `).openPopup();
      }

      const addressEl = document.getElementById('location-address');
      if (addressEl) {
        addressEl.textContent = address;
      }
    }
  }

  /**
   * Copy address to clipboard
   */
  async copyAddress() {
    try {
      await navigator.clipboard.writeText(this.defaultLocation.address);
      this.showCopySuccess();
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = this.defaultLocation.address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showCopySuccess();
    }
  }

  /**
   * Show copy success message
   */
  showCopySuccess() {
    const btn = document.getElementById('btn-copy-address');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      btn.style.background = 'rgba(16, 185, 129, 0.2)';
      btn.style.borderColor = '#10b981';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 2000);
    }
  }

  /**
   * Open location in external map (Google Maps)
   */
  openExternalMap() {
    const url = `https://www.google.com/maps?q=${this.defaultLocation.lat},${this.defaultLocation.lng}`;
    window.open(url, '_blank');
  }

  /**
   * Get current location
   */
  getLocation() {
    return { ...this.defaultLocation };
  }

  /**
   * Calculate distance from current location to a point
   */
  calculateDistance(lat, lng) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat - this.defaultLocation.lat);
    const dLon = this.toRad(lng - this.defaultLocation.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.defaultLocation.lat)) *
      Math.cos(this.toRad(lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km
  }

  toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * Add multiple markers to the map
   */
  addMarkers(markers) {
    if (!this.map) return;

    markers.forEach(markerData => {
      const marker = L.marker([markerData.lat, markerData.lng]).addTo(this.map);
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }
    });
  }

  /**
   * Add a circle/radius overlay
   */
  addRadiusOverlay(lat, lng, radius, options = {}) {
    if (!this.map) return;

    const circle = L.circle([lat, lng], {
      color: options.color || '#6366f1',
      fillColor: options.fillColor || '#6366f1',
      fillOpacity: options.fillOpacity || 0.2,
      radius: radius // in meters
    }).addTo(this.map);

    return circle;
  }

  /**
   * Fit map bounds to show all markers
   */
  fitBounds(bounds) {
    if (!this.map || !bounds) return;
    this.map.fitBounds(bounds);
  }
}
