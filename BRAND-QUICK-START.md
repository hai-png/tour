# Multi-Brand Virtual Tour - Quick Start Guide

## 🚀 What Was Built

A complete multi-brand theming system for hosting rebranded virtual tours for different real estate developers on GitHub Pages.

## 📦 Files Created

### Core System Files
1. **`js/BrandLoader.js`** - Brand detection, config loading, and theme application
2. **`css/brand-theming.css`** - CSS variables and brand-specific component styles
3. **`brand-switcher.html`** - Development tool to test all brands visually
4. **`test-brands.html`** - Diagnostic page for debugging brand loading
5. **`deploy-multi-brand.sh`** - Deployment automation script
6. **`BRAND-GUIDE.md`** - Complete documentation

### Modified Files
1. **`index.html`** - Added brand loader in `<head>` and brand-theming.css
2. **`js/main.js`** - Integrated BrandLoader with TourPlayer

## 🎯 How It Works

```
User visits URL
     ↓
BrandLoader detects brand (?brand=ayat or /ayat/)
     ↓
Loads _brands/{brand}/brand-config.json
     ↓
Applies theme to CSS variables
     ↓
Updates loading screen (logo, colors, text)
     ↓
Applies tour UI styles (buttons, panels, modals)
     ↓
Tour displays with full brand theming
```

## 🧪 Testing

### Quick Test (Local)
```bash
# Start a local server
python -m http.server 8000

# Open brand switcher
open http://localhost:8000/brand-switcher.html

# Or test individual brands
open http://localhost:8000/?brand=ayat
open http://localhost:8000/?brand=demahope
open http://localhost:8000/?brand=metropolitan
```

### Test All 6 Brands
Visit `test-brands.html` to see diagnostic info for each brand.

## 🌐 GitHub Pages Deployment

### Option 1: Query Parameter (Easiest) ✅ Recommended
No file duplication needed! Just push and access via:
```
https://username.github.io/repo/?brand=ayat
https://username.github.io/repo/?brand=demahope
```

### Option 2: Subdirectory Method
Run the deployment script:
```bash
./deploy-multi-brand.sh
```
This creates subdirectories for clean URLs:
```
https://username.github.io/repo/ayat/
https://username.github.io/repo/demahope/
```

### Option 3: Single Brand
Set one brand as default by copying its config:
```bash
cp _brands/ayat/brand-config.json default-config.json
```

## 🎨 Supported Brands

| Brand | Primary Color | Tagline |
|-------|--------------|---------|
| **Ayat** | `#7B1E1E` (Burgundy) | Pioneer Real Estate Developer |
| **Demahope** | `#2D4CF5` (Blue) | Elevate Your Lifestyle |
| **GIFT** | `#2E7D32` (Green) | We Build Community! |
| **Hosea** | `#1a5276` (Navy) | High-quality apartments |
| **Metropolitan** | `#0B1B35` (Dark Blue) | Discover Luxury, Quality and Safety |
| **Temer** | `#8b5cf6` (Purple) | Luxury living redefined |

## 🎯 What Gets Branded

✅ **Loading Screen**
- Background gradient colors
- Logo image
- Company name and tagline
- Progress bar colors
- Button colors
- Stat card styling

✅ **Tour UI**
- Brand container (top-left logo area)
- Room list horizontal bar
- Floor plan panel
- Gallery widget
- Navigation arrows
- Quick tools sidebar
- Top center controls
- All modals (property info, contact, share, settings)
- Buttons and interactive elements

✅ **Meta Tags**
- Page title
- Meta description
- Theme color
- PWA name

## 🛠️ Adding a New Brand

1. Create directory: `_brands/newbrand/`
2. Add `brand-config.json` (copy from existing brand)
3. Add PWA icons: `icon-192.png`, `icon-512.png`
4. Add logo image
5. Test: `/?brand=newbrand`

## 📋 Brand Config Structure

Minimum required fields in `brand-config.json`:

```json
{
  "brand": {
    "companyName": "Full Name",
    "shortName": "Short",
    "tagline": "Tagline",
    "logo": "path/to/logo.png"
  },
  "theme": {
    "primary": "#7B1E1E",
    "primaryDark": "#4A0F0F",
    "primaryLight": "#A52A2A",
    "primaryAlpha": "rgba(123,30,30,.15)"
  },
  "pwa": {
    "name": "Brand Tours",
    "shortName": "Brand",
    "themeColor": "#7B1E1E"
  }
}
```

## 🔧 Customization

### Per-Brand Overrides
Add brand-specific CSS in `brand-theming.css`:
```css
body.brand-ayat {
  /* Ayat-specific styles */
}

body.brand-demahope {
  /* Demahope-specific styles */
}
```

### UI Labels
Customize text in brand config:
```json
"ui": {
  "labels": {
    "enterButton": "Explore Now",
    "contactButton": "Contact Us"
  },
  "intro": {
    "loadingText": "Loading Tour...",
    "tagline": "Brand Tagline"
  }
}
```

## ⚠️ Known Limitations

### PWA Manifest
- **Issue**: Can't dynamically update `manifest.json` on GitHub Pages
- **Impact**: PWA install will use generic branding
- **Workaround**: Use build script to generate brand-specific manifests

### Server Rewrites
- **Issue**: Clean URLs (`/ayat/`) need server configuration
- **Solution**: Use query parameters (`?brand=ayat`) for static hosting

## 🐛 Troubleshooting

### Brand Not Loading
1. Open browser console (F12)
2. Check for `[BrandLoader]` messages
3. Verify `_brands/{brand}/brand-config.json` exists
4. Check Network tab for 404 errors

### Wrong Colors
1. Inspect element and check CSS variables
2. Look for `--brand-primary`, etc. in DevTools
3. Verify brand config has correct color values

### Logo Not Showing
1. Check logo path in brand config
2. Ensure logo file exists
3. Check for `onerror` fallback in HTML

## 📚 Documentation

- **Full Guide**: `BRAND-GUIDE.md`
- **Test Page**: `test-brands.html`
- **Brand Switcher**: `brand-switcher.html`

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Loading screen shows brand-specific logo and colors
- ✅ Company name appears in loading screen
- ✅ All UI elements match brand colors
- ✅ Brand logo appears in top-left corner
- ✅ Contact info matches brand config
- ✅ Works for all 6 brands

## 🚀 Next Steps

1. Test locally with all brands
2. Deploy to GitHub Pages
3. Share branded URLs
4. Monitor analytics per brand
5. Add new brands as needed

---

**Need help?** Check `BRAND-GUIDE.md` for detailed documentation.
