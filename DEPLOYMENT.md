# HAI PNG Virtual Tour - Deployment Guide

Complete guide for deploying the HAI PNG Virtual Tour as a Progressive Web App (PWA) for web, mobile, and desktop platforms.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [PWA Features](#pwa-features)
5. [Deployment Options](#deployment-options)
6. [Server Configuration](#server-configuration)
7. [Offline Support](#offline-support)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Local Development

```bash
# Start a local server
python3 -m http.server 8000

# Or using Node.js
npx serve .

# Open in browser
http://localhost:8000
```

### Generate PWA Icons

```bash
# Install dependencies
pip install Pillow

# Generate all PWA icons
python generate-pwa-icons.py

# Or specify a custom source image
python generate-pwa-icons.py path/to/your/logo.png
```

### Deploy

```bash
# Staging deployment
./deploy.sh staging

# Production deployment
./deploy.sh production
```

---

## Prerequisites

### Minimum Requirements

- **Web Server**: Apache 2.4+, Nginx 1.15+, or any static file server
- **HTTPS**: Required for PWA features (except localhost)
- **Storage**: ~50-200MB depending on panorama count
- **Bandwidth**: 5-10MB initial load, 1-2MB per panorama

### Browser Support

| Browser | Version | Features |
|---------|---------|----------|
| Chrome | 67+ | Full PWA, Offline |
| Firefox | 60+ | Full PWA, Offline |
| Safari | 12.1+ | PWA (iOS 12.2+), Offline |
| Edge | 79+ | Full PWA, Offline |
| Samsung Internet | 9.2+ | Full PWA, Offline |

---

## Project Structure

```
tour-player/
├── index.html              # Main application entry
├── offline.html            # Offline fallback page
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── .htaccess               # Apache configuration
├── nginx.conf              # Nginx configuration
├── deploy.sh               # Linux/Mac deployment script
├── deploy.bat              # Windows deployment script
├── generate-pwa-icons.py   # PWA icon generator
│
├── css/
│   ├── styles.css          # Main styles
│   └── ui-components.css   # UI component styles
│
├── js/
│   ├── main.js             # Application entry point
│   ├── PanoramaViewer.js   # 360° panorama viewer
│   ├── UIManager.js        # User interface manager
│   ├── HotspotManager.js   # Navigation hotspots
│   ├── FloorPlanManager.js # Interactive floor plans
│   ├── GuidedTourManager.js# Automated tour guide
│   ├── PWAManager.js       # PWA functionality
│   └── ...                 # Other managers
│
├── media/
│   ├── pwa/                # Generated PWA assets
│   │   ├── icon-*.png      # App icons (various sizes)
│   │   ├── apple-touch-icon-*.png  # iOS icons
│   │   ├── splash-*.png    # Splash screens
│   │   └── favicon.ico     # Browser favicon
│   ├── tdv-import/
│   │   ├── panoramas/      # 360° panorama images
│   │   ├── hotspots/       # Hotspot sprites
│   │   ├── skin/           # UI skin assets
│   │   └── project.json    # Tour configuration
│   ├── audio/              # Audio files
│   └── ...
│
├── floor-plan/             # Floor plan images
│   └── floor-plan-config.json
│
└── gallery/                # Gallery images
```

---

## PWA Features

### Core Features

✅ **Installable** - Add to home screen on mobile/desktop  
✅ **Offline Support** - Works without internet connection  
✅ **Push Notifications** - Optional engagement feature  
✅ **App Shortcuts** - Quick actions from home screen  
✅ **Share Target** - Receive shared content  
✅ **Responsive** - Works on all screen sizes  

### Caching Strategy

| Asset Type | Strategy | Max Age |
|------------|----------|---------|
| HTML | Network First | 0 (always fresh) |
| Service Worker | Network First | 0 (always fresh) |
| CSS/JS | Cache First | 7 days |
| Images (UI) | Cache First | 30 days |
| Panoramas | Network First | 30 days |
| Floor Plans | Network First | 30 days |
| Config Files | Stale While Revalidate | 1 hour |
| CDN Assets | Cache First | 30 days |

### Cache Names

- `hai-tour-static-{version}` - Core app files
- `hai-tour-media-{version}` - Panoramas and media
- `hai-tour-cdn-{version}` - Third-party CDN assets

---

## Deployment Options

### Option 1: Manual Deployment

1. **Prepare files**
   ```bash
   # Generate PWA icons
   python generate-pwa-icons.py
   
   # Test locally
   python3 -m http.server 8000
   ```

2. **Upload to server**
   ```bash
   # Using SCP
   scp -r * user@server:/var/www/hai-tour/
   
   # Or using FTP client (FileZilla, Cyberduck, etc.)
   ```

3. **Configure server** (see [Server Configuration](#server-configuration))

4. **Enable HTTPS** (Let's Encrypt recommended)
   ```bash
   sudo certbot --nginx -d your-domain.com
   # or
   sudo certbot --apache -d your-domain.com
   ```

### Option 2: Automated Deployment

```bash
# Staging deployment
./deploy.sh staging

# Production deployment (creates package)
./deploy.sh production

# Windows
deploy.bat staging
deploy.bat production
```

### Option 3: CI/CD Integration

#### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.x'
      
      - name: Generate PWA Icons
        run: |
          pip install Pillow
          python generate-pwa-icons.py
      
      - name: Deploy via SSH
        uses: easingthemes/ssh-deploy@v3
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
          REMOTE_HOST: ${{ secrets.HOST }}
          REMOTE_USER: ${{ secrets.USER }}
          TARGET: /var/www/hai-tour
          EXCLUDE: "/dist/, /node_modules/"
```

### Option 4: Cloud Platforms

#### Netlify

1. Connect GitHub repository
2. Build command: `python generate-pwa-icons.py`
3. Publish directory: `/`
4. Enable HTTPS (automatic)

#### Vercel

1. Import project
2. Deploy (automatic HTTPS)

#### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

---

## Server Configuration

### Apache (.htaccess)

The included `.htaccess` file provides:

- ✅ Gzip compression
- ✅ Browser caching
- ✅ Security headers
- ✅ HTTPS redirect
- ✅ SPA routing

**Required modules:**
```apache
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
LoadModule expires_module modules/mod_expires.so
LoadModule deflate_module modules/mod_deflate.so
```

### Nginx

Copy `nginx.conf` to `/etc/nginx/sites-available/hai-tour`:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/hai-tour
sudo ln -s /etc/nginx/sites-available/hai-tour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Key features:**
- HTTP/2 support
- Gzip compression
- Browser caching
- Security headers
- SSL/TLS configuration

### IIS (Windows)

Create `web.config` in root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

---

## Offline Support

### How It Works

1. **First Visit**: Service Worker caches core assets
2. **Subsequent Visits**: Assets served from cache
3. **Offline Mode**: App works with cached content
4. **Reconnection**: Background sync when online

### Offline Capabilities

| Feature | Online | Offline |
|---------|--------|---------|
| Load cached scenes | ✅ | ✅ |
| Navigate between cached rooms | ✅ | ✅ |
| View floor plans | ✅ | ✅ |
| Load new panoramas | ✅ | ❌ |
| Share tour | ✅ | ⚠️ (queued) |
| Capture viewport | ✅ | ⚠️ (queued) |

### Precaching Strategy

To ensure specific content is available offline:

```javascript
// In your JavaScript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active.postMessage({
      type: 'PRECACHE_MEDIA',
      urls: [
        '/media/tdv-import/panorama_1.jpg',
        '/media/tdv-import/panorama_2.jpg',
        // Add critical panoramas
      ]
    });
  });
}
```

### Cache Management

```javascript
// Check cache status
const cacheStatus = await pwaManager.getCacheStatus();
console.log(cacheStatus);

// Clear cache (for updates)
await pwaManager.clearCache();

// Cache specific URLs
await pwaManager.cacheUrls(['/path/to/cache']);
```

---

## Testing

### Local Testing

```bash
# Start local server
python3 -m http.server 8000

# Test service worker
# Open: http://localhost:8000
# Check DevTools > Application > Service Workers

# Test offline mode
# DevTools > Application > Service Workers > Offline checkbox
```

### PWA Validation

1. **Lighthouse** (Chrome DevTools)
   - Open DevTools > Lighthouse
   - Generate report
   - Score should be 90+ for PWA

2. **PWA Builder**
   - Visit: https://www.pwabuilder.com/
   - Enter your URL
   - Get detailed report

3. **Manual Testing**
   ```bash
   # Install on device
   # Test offline functionality
   # Test push notifications
   # Test app shortcuts
   ```

### Cross-Browser Testing

| Test | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Install PWA | ✅ | ✅ | ✅ | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ❌ | ✅ |
| Share Target | ✅ | ❌ | ❌ | ✅ |

### Performance Testing

```bash
# Using Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Using WebPageTest
# Visit: https://www.webpagetest.org/
```

---

## Troubleshooting

### Service Worker Issues

**Problem**: Service Worker not registering

```javascript
// Check browser support
if ('serviceWorker' in navigator) {
  console.log('Service Worker supported');
} else {
  console.log('Service Worker NOT supported');
}
```

**Problem**: Old service worker stuck

```bash
# In Chrome DevTools:
# Application > Service Workers > Unregister
# Or clear site data:
# Application > Storage > Clear site data
```

### PWA Install Issues

**Problem**: Install prompt not showing

**Requirements:**
- ✅ HTTPS (or localhost)
- ✅ Valid manifest.json
- ✅ Service Worker registered
- ✅ Visited at least twice
- ✅ At least 5 seconds between visits

**Fix:**
```javascript
// Force install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Show your install button
});
```

### Offline Issues

**Problem**: App not working offline

**Checklist:**
1. Service Worker registered?
2. Assets cached on first visit?
3. Cache names match in sw.js?
4. No CORS errors in console?

**Debug:**
```javascript
// Check cache
caches.keys().then(names => {
  names.forEach(name => {
    caches.open(name).then(cache => {
      cache.keys().then(requests => {
        console.log(`${name}: ${requests.length} items`);
      });
    });
  });
});
```

### iOS Safari Issues

**Problem**: PWA not installing

**iOS Requirements:**
- iOS 12.2+ for PWA support
- Must be served over HTTPS
- Add to Home Screen manually (no prompt)

**Add meta tags:**
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="HAI Tour" />
<link rel="apple-touch-icon" href="media/pwa/apple-touch-icon-180x180.png" />
```

### Android Chrome Issues

**Problem**: App crashes on launch

**Check:**
1. Manifest start_url is relative or same origin
2. All icon sizes exist
3. Service Worker scope is correct

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Content Security Policy set
- [ ] Service Worker scope limited
- [ ] Sensitive data not cached
- [ ] CORS properly configured
- [ ] Regular dependency updates

---

## Performance Checklist

- [ ] Images optimized (WebP format)
- [ ] Gzip/Brotli compression enabled
- [ ] Browser caching configured
- [ ] CDN for static assets
- [ ] Lazy loading implemented
- [ ] Code minified
- [ ] Critical CSS inlined

---

## Support & Resources

### Documentation

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [WebPageTest](https://www.webpagetest.org/)

### Contact

For support, contact the development team or open an issue on the project repository.

---

**Last Updated**: April 2026  
**Version**: 4.0
