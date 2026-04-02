# HAI PNG Virtual Tour - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Test Locally

```bash
# Start a local server
python3 -m http.server 8000

# Open in browser
# http://localhost:8000
```

### 2. Generate PWA Icons

```bash
# Install Pillow
pip install Pillow

# Generate all icons
python generate-pwa-icons.py
```

### 3. Deploy

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production
```

---

## 📱 Install as App

### Desktop (Chrome/Edge)

1. Visit the site
2. Look for install icon in address bar
3. Click "Install"
4. App opens in standalone window

### Android

1. Visit the site in Chrome
2. Tap menu (⋮) → "Install app"
3. Confirm installation
4. App appears in app drawer

### iOS

1. Visit the site in Safari
2. Tap Share button (📤)
3. Tap "Add to Home Screen"
4. Tap "Add" in top right

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `sw.js` | Service Worker (offline support) |
| `manifest.json` | PWA manifest (app info) |
| `offline.html` | Offline fallback page |
| `.htaccess` | Apache config |
| `nginx.conf` | Nginx config |
| `deploy.sh` | Deployment script |
| `deploy.bat` | Windows deployment |
| `generate-pwa-icons.py` | Icon generator |
| `DEPLOYMENT.md` | Full deployment guide |
| `browserconfig.xml` | Windows tile config |

---

## 🔧 Configuration

### Update App Name

Edit `manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Your App",
  ...
}
```

### Change Theme Color

Edit `manifest.json` and `index.html`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-bg-color"
}
```

### Update Icons

Replace `media/tdv-import/skin/logo.png` and run:
```bash
python generate-pwa-icons.py
```

---

## 🌐 Deployment Checklist

- [ ] Generate PWA icons
- [ ] Test locally
- [ ] Configure server (.htaccess or nginx.conf)
- [ ] Enable HTTPS (SSL certificate)
- [ ] Upload files to server
- [ ] Test PWA installation
- [ ] Test offline mode
- [ ] Run Lighthouse audit

---

## 🐛 Troubleshooting

### Service Worker Not Registering

- Ensure HTTPS (or localhost)
- Check browser console for errors
- Clear browser cache

### Install Prompt Not Showing

- Must be HTTPS
- User must visit at least twice
- Wait 5+ seconds between visits
- User must interact with site

### Offline Mode Not Working

- Service Worker must be registered
- Visit site while online first
- Check cache in DevTools → Application

### iOS Issues

- iOS 12.2+ required for PWA
- Use Safari (not Chrome)
- Add to Home Screen manually

---

## 📊 Performance Tips

1. **Optimize Images**: Use WebP format for panoramas
2. **Enable Compression**: Gzip/Brotli on server
3. **Use CDN**: For static assets
4. **Lazy Load**: Load panoramas on demand
5. **Cache Strategically**: Use provided caching strategies

---

## 🔒 Security

- ✅ HTTPS enabled
- ✅ Security headers configured
- ✅ Content Security Policy set
- ✅ Service Worker scope limited

---

## 📖 More Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[FLOOR-PLAN-EDITOR-README.md](FLOOR-PLAN-EDITOR-README.md)** - Floor plan editor
- **[HOTSPOT-EDITOR-README.md](HOTSPOT-EDITOR-README.md)** - Hotspot editor

---

## 🆘 Support

For issues or questions:
1. Check DEPLOYMENT.md
2. Review browser console logs
3. Test in different browsers
4. Verify server configuration

---

**Version**: 4.0 | **Last Updated**: April 2026
