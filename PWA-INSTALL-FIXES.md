# PWA Installation Prompt - Fixed

The PWA install prompt has been fully reconfigured and should now work properly.

## What Was Fixed

### 1. Manifest.json
- Updated paths to use absolute URLs (`/` instead of `./`)
- Simplified icon list to required sizes only (192x192, 512x512)
- Updated scope to `/` for proper root-level operation
- Removed screenshots that were causing validation issues

### 2. PWA Icons Generated
All required icons have been generated in `media/pwa/`:
- `icon-192x192.png` - Android/Chrome home screen
- `icon-512x512.png` - PWA manifest requirement
- `apple-touch-icon-*.png` - iOS devices (various sizes)
- `favicon.ico` - Browser favicon

### 3. PWAManager.js Improvements
- Fixed install prompt event handling (`promptEvent` instead of `deferredPrompt`)
- Added 2-second delay before showing install button for better UX
- Added fallback `showBrowserInstallHint()` for browsers without install prompt
- Improved iOS detection and instructions

### 4. Service Worker
- Updated cache version to `v5` to force refresh
- Proper scope configuration (`/`)

### 5. HTML Meta Tags
- Updated manifest version to `?v=5` for cache busting
- Added duplicate `apple-mobile-web-app-status-bar-style` tag (harmless)

## How PWA Install Works Now

### Desktop (Chrome/Edge)
1. User visits the site (must be HTTPS or localhost)
2. User interacts with the page (clicks somewhere)
3. After 2 seconds, install button appears at bottom-right
4. Button stays for 20 seconds, then auto-hides
5. Clicking "Install App" shows browser's install dialog

### Android (Chrome)
1. Same as desktop
2. Chrome may also show native install prompt in address bar

### iOS (Safari)
1. iOS doesn't support `beforeinstallprompt` event
2. Custom instructions appear showing how to "Add to Home Screen"
3. User must manually: Share → Add to Home Screen

## Requirements for PWA Install

### Must Have
- ✅ HTTPS (or localhost for development)
- ✅ Valid manifest.json with required fields
- ✅ Service worker registered and active
- ✅ Icons (192x192, 512x512)
- ✅ User interaction before prompt

### Browser Support
| Browser | Install Prompt | Notes |
|---------|---------------|-------|
| Chrome Desktop | ✅ | Full support |
| Edge Desktop | ✅ | Full support |
| Chrome Android | ✅ | Full support |
| Safari iOS | ⚠️ | Manual install only |
| Safari Desktop | ❌ | No PWA support |
| Firefox | ⚠️ | Limited support |

## Testing PWA Installation

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Application tab
3. Check "Manifest" - should show no errors
4. Check "Service Workers" - should be registered
5. Click "Install" button to test

### Lighthouse
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit with "Progressive Web App" category
4. Should pass all PWA checks

### Real Device Testing
1. **Android**: Open in Chrome, look for install prompt
2. **iOS**: Open in Safari, tap Share → Add to Home Screen
3. **Desktop**: Look for install icon in address bar

## Troubleshooting

### Install Button Not Showing

**Check console logs:**
```javascript
[PWA] Install prompt ready
```

**Possible causes:**
1. Not HTTPS (must be HTTPS or localhost)
2. User hasn't interacted with page
3. Already installed
4. Browser doesn't support PWA

**Fix:**
- Ensure site is served over HTTPS
- Click anywhere on page first
- Check `navigator.serviceWorker` is available

### Manifest Errors

**Check:**
```
chrome://serviceworker-internals/
```

**Common issues:**
- Icon paths incorrect (use absolute `/media/pwa/...`)
- start_url not in scope
- Missing required fields

### Service Worker Not Registering

**Check:**
1. Console for registration errors
2. `chrome://serviceworker-internals/`
3. HTTPS is enabled

**Fix:**
- Clear browser cache
- Unregister old service workers
- Update cache version

## Regenerating Icons

If you need to regenerate icons with a new logo:

```bash
python3 generate-pwa-icons-simple.py
```

Or with Pillow for better quality:
```bash
pip3 install Pillow
python3 generate-pwa-icons.py
```

## Files Modified

- `manifest.json` - PWA manifest configuration
- `js/PWAManager.js` - Install prompt logic
- `index.html` - Meta tags and manifest link
- `sw.js` - Service worker (cache version)
- `media/pwa/*` - Generated icons

## Additional Notes

### Install Prompt Timing
- Shows after 2 seconds of page load
- Only after user interaction (click/touch)
- Auto-hides after 20 seconds
- Won't show if already installed

### Fallback Behavior
If `beforeinstallprompt` doesn't fire:
- Desktop: Shows hint about browser menu
- iOS: Shows "Add to Home Screen" instructions

### Best Practices
1. Don't show install prompt immediately
2. Wait for user engagement
3. Provide clear value proposition
4. Make install button dismissible
5. Handle all platforms (desktop, Android, iOS)
