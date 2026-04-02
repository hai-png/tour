# PWA Assets Directory

This directory contains all generated Progressive Web App (PWA) assets for the HAI PNG Virtual Tour.

## Generated Files

### Icons
- `icon-72x72.png` - Android LDPI
- `icon-96x96.png` - Android MDPI
- `icon-128x128.png` - Chrome Web Store
- `icon-144x144.png` - Android HDPI
- `icon-152x152.png` - iOS iPad
- `icon-192x192.png` - Android XHDPI (maskable)
- `icon-384x384.png` - Android XXHDPI
- `icon-512x512.png` - PWA requirement (maskable)

### Apple Touch Icons
- `apple-touch-icon-60x60.png` - iPhone
- `apple-touch-icon-120x120.png` - iPhone Retina
- `apple-touch-icon-76x76.png` - iPad
- `apple-touch-icon-152x152.png` - iPad Retina
- `apple-touch-icon-167x167.png` - iPad Pro
- `apple-touch-icon-180x180.png` - iPhone 6 Plus
- `apple-touch-icon.png` - Default (180x180)

### Splash Screens
- `splash-wide.png` (1280x720) - Landscape orientation
- `splash-narrow.png` (720x1280) - Portrait orientation
- `splash-ipad-pro.png` (2048x2732) - iPad Pro

### Other
- `favicon.ico` - Browser favicon (multi-size)
- `screenshot-wide.png` - PWA screenshot (wide)
- `screenshot-narrow.png` - PWA screenshot (narrow)

## How to Generate

1. Ensure you have the source logo at: `media/tdv-import/skin/logo.png`

2. Install Python dependencies:
   ```bash
   pip install Pillow
   ```

3. Run the generator:
   ```bash
   python generate-pwa-icons.py
   ```

4. All assets will be generated in this directory.

## Manual Creation

If you can't use the script, you can create icons manually:

### Required Sizes (Minimum)
- 192x192 - Android home screen
- 512x512 - PWA manifest requirement

### Recommended Sizes
- 72x72, 96x96, 144x144 - Android various densities
- 152x152, 180x180 - iOS devices
- 384x384 - High-density Android

### Maskable Icons
Icons with `"purpose": "maskable"` in manifest.json should:
- Have important content within center 40% (safe zone)
- Use transparent background
- Allow platform to crop to circle/squircle

## Usage in HTML

```html
<!-- Standard favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="media/pwa/favicon.ico" />

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="media/pwa/apple-touch-icon-180x180.png" />

<!-- PWA Manifest -->
<link rel="manifest" href="manifest.json" />
```

## Best Practices

1. **Source Image**: Use high-resolution PNG (at least 512x512)
2. **Transparent Background**: For maskable icons
3. **Safe Zone**: Keep important content within center 40%
4. **Testing**: Test on actual devices, not just emulators
5. **Updates**: Regenerate all sizes when updating logo

## File Size Guidelines

- Icons: < 50KB each
- Splash screens: < 500KB each
- Total directory: < 5MB

## Troubleshooting

### Icons Not Showing
- Check file paths in manifest.json and HTML
- Ensure files exist and are readable
- Clear browser cache

### Blurry Icons
- Use higher resolution source image
- Ensure correct sizes are generated
- Check device pixel ratio

### iOS Issues
- Use Safari (not Chrome)
- Ensure HTTPS
- Add to Home Screen manually

---

**Note**: This directory should be committed to version control as these are build artifacts required for PWA functionality.
