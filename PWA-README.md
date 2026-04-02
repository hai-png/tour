# HAI PNG Virtual Tour - PWA Documentation

## 📱 PWA Features (Version 7.0.0)

This virtual tour application is a fully-featured Progressive Web App (PWA) that provides:

- ✅ **Installable** - Add to home screen on mobile and desktop
- ✅ **Offline Support** - Cached content available without internet
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Fast** - Intelligent caching strategies
- ✅ **Secure** - Requires HTTPS for installation
- ✅ **App-like** - Standalone mode with custom UI

---

## 🚀 Quick Start

### Installation Requirements

1. **HTTPS** - Must be served over HTTPS (or localhost for development)
2. **Modern Browser** - Chrome, Edge, Safari, or Firefox
3. **User Interaction** - User must interact with page before install prompt

### Installing the App

#### Desktop (Chrome/Edge)
1. Visit the site
2. Click anywhere on the page (required for install prompt)
3. Click the "Install App" button that appears
4. Confirm installation in the browser dialog

#### Android (Chrome)
1. Open in Chrome
2. Tap the "Install App" button
3. Or use the browser menu → "Install app"

#### iOS (Safari)
1. Open in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Confirm addition

---

## 📁 File Structure

```
tour-player/
├── manifest.json          # PWA manifest (app metadata)
├── sw.js                  # Service Worker (offline support)
├── offline.html           # Offline fallback page
├── index.html             # Main app page
├── css/
│   └── pwa.css           # PWA-specific styles
├── js/
│   └── PWAManager.js     # PWA management logic
├── media/
│   └── pwa/              # PWA icons and assets
│       ├── icon-*.png    # Android icons
│       ├── apple-touch-icon-*.png  # iOS icons
│       ├── favicon*.png  # Web icons
│       └── splash-*.png  # iOS splash screens
└── generate-pwa-icons.py # Icon generation script
```

---

## 🎨 PWA Icons

### Generated Icons

The `generate-pwa-icons.py` script creates all required icons:

#### Android Icons
- `icon-72x72.png` to `icon-1024x1024.png` - Various sizes for Android devices
- `icon-192x192.png` and `icon-512x512.png` - Marked as maskable

#### iOS Icons
- `apple-touch-icon-60x60.png` to `apple-touch-icon-180x180.png` - Device-specific
- `apple-touch-icon.png` - 1024x1024 for App Store

#### Web Icons
- `favicon-16x16.png`, `favicon-32x32.png` - Browser tabs
- `favicon-192x192.png`, `favicon-512x512.png` - Larger favicons
- `favicon.ico` - Multi-size ICO file

#### Splash Screens
- `splash-iphone-*.png` - Various iPhone models
- `splash-ipad-*.png` - iPad models

### Regenerating Icons

```bash
# Install Pillow if needed
pip install Pillow

# Generate icons from logo
python3 generate-pwa-icons.py

# Or specify a custom source image
python3 generate-pwa-icons.py path/to/logo.png
```

---

## ⚙️ Service Worker

### Caching Strategies

The service worker (`sw.js`) implements three caching strategies:

#### 1. Cache-First
Best for: Static assets (CSS, JS, fonts, logos)
- Returns cached version immediately
- Updates cache in background
- Fastest response time

#### 2. Network-First
Best for: Dynamic content (panoramas, floor plans, galleries)
- Tries network first
- Falls back to cache if offline
- Always shows latest content when available

#### 3. Stale-While-Revalidate
Best for: Configuration files
- Returns cached version immediately
- Fetches update in background
- Updates cache for next time

### Cache Names

```javascript
CACHE_NAMES = {
  static: 'hai-tour-static-v7',   // Static assets
  media: 'hai-tour-media-v7',     // Media files
  cdn: 'hai-tour-cdn-v7',         // CDN resources
  offline: 'hai-tour-offline-v7', // Offline page
  runtime: 'hai-tour-runtime-v7'  // Runtime cache
}
```

### Cache Limits

- **Max Items**: 5000 per cache
- **Max Media Size**: 1GB
- **Static Cache TTL**: 30 days
- **Media Cache TTL**: 90 days
- **CDN Cache TTL**: 30 days

---

## 📥 Offline Download

### Downloading Content for Offline Use

Users can download all content for full offline access:

1. Open the Settings modal
2. Click "Download for Offline"
3. Wait for download to complete
4. Content is now available offline

### What Gets Downloaded

- Panorama thumbnails
- Floor plan images
- Gallery images
- Configuration files
- Hotspot data
- Audio files (if any)

### Offline Status

Check offline readiness:
```javascript
const status = await pwaManager.getOfflineStatus();
console.log(`Cached items: ${status.totalCount}`);
console.log(`Ready for offline: ${status.isReadyForOffline}`);
```

---

## 🔧 PWA Manager API

### Methods

```javascript
// Check if installed
pwaManager.isAppInstalled()

// Check if online
pwaManager.isAppOnline()

// Get offline status
await pwaManager.getOfflineStatus()

// Download for offline
await pwaManager.downloadForOffline(onProgress, onComplete)

// Clear cache
await pwaManager.clearCache()

// Check if install prompt available
pwaManager.canShowInstallPrompt()

// Prompt to install
await pwaManager.promptInstall()
```

### Events

```javascript
// Service Worker events
window.addEventListener('pwa-check-install', () => {
  // Check for install prompt
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Install prompt available
});

window.addEventListener('appinstalled', () => {
  // App was installed
});

window.addEventListener('online', () => {
  // Back online
});

window.addEventListener('offline', () => {
  // Went offline
});
```

---

## 🧪 Testing PWA

### Chrome DevTools

1. **Application Tab**
   - Check Manifest → No errors
   - Check Service Workers → Registered and active
   - Check Cache Storage → Caches populated

2. **Lighthouse**
   - Run PWA audit
   - Should pass all PWA checks
   - Score should be 100 for PWA category

3. **Testing Install Prompt**
   ```
   chrome://serviceworker-internals/
   ```
   - Check service worker status
   - Manually trigger update check

### Testing Offline Mode

1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Reload page
4. Should show offline.html or cached content

### Testing on Real Devices

#### Android
1. Deploy to HTTPS server
2. Open in Chrome
3. Look for install prompt in address bar
4. Or use "Add to Home Screen" in menu

#### iOS
1. Deploy to HTTPS server
2. Open in Safari
3. Tap Share → Add to Home Screen
4. App appears on home screen

---

## 🐛 Troubleshooting

### Install Prompt Not Showing

**Check:**
1. Is it HTTPS? (or localhost)
2. Has user interacted with page?
3. Is manifest.json valid?
4. Is service worker registered?
5. Check browser console for errors

**Fix:**
```javascript
// Check in console
console.log('Secure context:', window.isSecureContext);
console.log('Manifest:', document.querySelector('link[rel="manifest"]'));
console.log('Service Worker:', 'serviceWorker' in navigator);
```

### Manifest Errors

**Common Issues:**
- Icon paths incorrect (use absolute `/media/pwa/...`)
- `start_url` not in scope
- Missing required fields

**Validate:**
```bash
curl https://your-domain.com/manifest.json
```

### Service Worker Not Registering

**Check:**
1. Console for registration errors
2. `chrome://serviceworker-internals/`
3. HTTPS is enabled

**Fix:**
```javascript
// Clear all caches and reload
caches.keys().then(names => names.forEach(n => caches.delete(n)));
// Then hard reload (Ctrl+Shift+R)
```

### Icons Not Showing

**Check:**
1. Icon files exist
2. Paths in manifest are correct
3. Icon sizes meet requirements (192x192, 512x512)
4. Icon files are valid PNG

**Fix:**
```bash
# Regenerate icons
python3 generate-pwa-icons.py
```

---

## 📊 Browser Support

| Browser | Install | Offline | Notes |
|---------|---------|---------|-------|
| Chrome Desktop | ✅ | ✅ | Full support |
| Chrome Android | ✅ | ✅ | Full support |
| Edge Desktop | ✅ | ✅ | Full support |
| Safari iOS | ⚠️ | ✅ | Manual install only |
| Safari Desktop | ❌ | ⚠️ | Limited support |
| Firefox | ⚠️ | ✅ | Limited install support |

---

## 🎯 Best Practices

### Installation UX
1. ✅ Wait for user interaction before showing install prompt
2. ✅ Provide clear value proposition
3. ✅ Make install button dismissible
4. ✅ Don't show repeatedly if dismissed
5. ✅ Handle all platforms (desktop, Android, iOS)

### Offline Support
1. ✅ Cache critical assets first
2. ✅ Provide offline fallback page
3. ✅ Show clear offline status
4. ✅ Allow manual offline download
5. ✅ Handle network errors gracefully

### Performance
1. ✅ Use appropriate cache strategies
2. ✅ Limit cache sizes
3. ✅ Clean old caches on update
4. ✅ Pre-cache critical assets
5. ✅ Lazy load non-critical content

---

## 📝 Version History

### Version 7.0.0 (Current)
- ✅ Complete PWA revamp
- ✅ Modern caching strategies
- ✅ Enhanced offline page
- ✅ Improved install flow
- ✅ Better progress indicators
- ✅ Icon generation script
- ✅ Comprehensive documentation

### Previous Versions
- v6: Basic offline support
- v5: Initial PWA implementation

---

## 📚 Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [Web App Manifest](https://web.dev/add-manifest/)
- [Service Workers](https://web.dev/service-workers-cache-and-storage-best-practices/)

---

## 🤝 Support

For issues or questions:
1. Check console logs for errors
2. Review this documentation
3. Test in Chrome DevTools
4. Verify HTTPS requirement

---

**Last Updated:** April 2026  
**Version:** 7.0.0
