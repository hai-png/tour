# Multi-Brand Virtual Tour System

This system supports **rebranded virtual tours** for different real estate developers, all hosted on GitHub Pages from a single codebase.

## 🎯 Overview

The brand theming system allows you to:
- Host tours for **multiple real estate developers** from one codebase
- Dynamically apply **brand colors, logos, and content**
- Support **GitHub Pages** hosting (static, no server-side rendering)
- Maintain **separate brand configurations** via JSON files

## 📁 Brand Structure

Each brand has its own directory in `_brands/` with a `brand-config.json` file:

```
_brands/
├── ayat/
│   ├── brand-config.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── ayat_logo.daf534f7.webp
├── demahope/
│   ├── brand-config.json
│   ├── icon-192.png
│   └── icon-512.png
└── [brand-name]/
    └── brand-config.json
```

## 🔧 How It Works

### 1. Brand Detection
The system detects the brand from:
- **URL Path**: `/ayat/`, `/demahope/`, etc.
- **Query Parameter**: `?brand=ayat`

### 2. Config Loading
Once detected, the system loads:
- `/_brands/{brand}/brand-config.json`

### 3. Theme Application
The brand config is applied to:
- ✅ Loading screen colors, logo, and text
- ✅ All tour UI components (buttons, panels, modals)
- ✅ Meta tags (title, description, theme-color)
- ✅ PWA manifest (requires server-side for full support)

## 🎨 Brand Configuration

The `brand-config.json` file contains:

### Brand Identity
```json
{
  "brand": {
    "companyName": "Brand Full Name",
    "shortName": "Short Brand",
    "tagline": "Brand tagline here",
    "logo": "path/to/logo.png",
    "developerLogo": "path/to/developer-logo.png"
  }
}
```

### Color Theme
```json
{
  "theme": {
    "primary": "#7B1E1E",
    "primaryDark": "#4A0F0F",
    "primaryLight": "#A52A2A",
    "primaryAlpha": "rgba(123,30,30,.15)",
    "background": "#f4f5f7",
    "card": "#ffffff",
    "textPrimary": "#1a1a2e",
    "textSecondary": "#555570",
    "textMuted": "#8888a0",
    "borderLight": "rgba(0,0,0,.08)",
    "borderMedium": "rgba(0,0,0,.14)",
    "dark": {
      "background": "#1A0A0A",
      "card": "#2A1515",
      "textPrimary": "#e8e8e8"
    }
  }
}
```

### PWA Settings
```json
{
  "pwa": {
    "name": "Brand Property Tours",
    "shortName": "Brand Tours",
    "description": "Brand description for PWA",
    "themeColor": "#7B1E1E",
    "backgroundColor": "#7B1E1E",
    "icon192": "icon-192.png",
    "icon512": "icon-512.png"
  }
}
```

### Contact Information
```json
{
  "contact": {
    "phones": [
      {
        "label": "Hotline",
        "value": "+251976606060",
        "display": "0976 60 60 60",
        "primary": true
      }
    ],
    "emails": [...],
    "whatsapp": {...},
    "social": {
      "facebook": { "enabled": true, "url": "..." },
      "instagram": { "enabled": true, "url": "..." }
    },
    "address": "Company Address",
    "website": "https://example.com"
  }
}
```

### UI Customization
```json
{
  "ui": {
    "labels": {
      "enterButton": "Explore Now",
      "loadingGeneric": "Loading...",
      "contactButton": "Contact"
    },
    "intro": {
      "loadingText": "Loading Tour...",
      "tagline": "Brand Tagline"
    }
  }
}
```

## 🚀 Usage

### Local Development

1. **Start a local server:**
   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```

2. **Access with brand:**
   - Path-based: `http://localhost:8000/ayat/`
   - Query-based: `http://localhost:8000/?brand=ayat`

3. **Use brand switcher tool:**
   ```
   http://localhost:8000/brand-switcher.html
   ```

### GitHub Pages Deployment

#### Option 1: Single Repository with Subdirectories

1. Create subdirectories for each brand:
   ```bash
   mkdir -p ayat demahope gift hosea metropolitan temer
   ```

2. Copy the tour files to each directory:
   ```bash
   for brand in ayat demahope gift hosea metropolitan temer; do
     cp index.html $brand/
     cp -r js/ $brand/
     cp -r css/ $brand/
     cp -r media/ $brand/
   done
   ```

3. Update `.htaccess` to rewrite URLs:
   ```apache
   RewriteEngine On
   RewriteRule ^(ayat|demahope|gift|hosea|metropolitan|temer)/$ /index.html [L]
   ```

4. Push to GitHub Pages:
   ```bash
   git add .
   git commit -m "Add brand subdirectories"
   git push origin main
   ```

#### Option 2: Query Parameter Approach

Simply access any brand via:
```
https://username.github.io/tour-player/?brand=ayat
```

No file duplication needed!

#### Option 3: Separate Repositories (Full Isolation)

1. Fork the repository for each brand
2. Update `_brands/{brand}/brand-config.json` as the default
3. Deploy each to its own GitHub Pages site

## 🎯 Testing Brands

### Quick Test
Open the brand switcher:
```
http://localhost:8000/brand-switcher.html
```

### Manual Testing
Test each brand individually:
```
http://localhost:8000/ayat/
http://localhost:8000/demahope/
http://localhost:8000/gift/
http://localhost:8000/hosea/
http://localhost:8000/metropolitan/
http://localhost:8000/temer/
```

### Verify Brand Application
Check that the following are brand-specific:
- ✅ Loading screen background color
- ✅ Loading screen logo
- ✅ Loading screen title and subtitle
- ✅ All UI element colors (buttons, panels, modals)
- ✅ Brand logo in top-left corner
- ✅ Contact information
- ✅ Meta tags (inspect page source)

## 🛠️ Adding a New Brand

1. **Create brand directory:**
   ```bash
   mkdir -p _brands/newbrand
   ```

2. **Create brand-config.json:**
   - Copy an existing config as template
   - Update all brand-specific values
   - Minimum required fields: `brand`, `theme`, `pwa`

3. **Add brand assets:**
   ```
   _brands/newbrand/
   ├── brand-config.json
   ├── icon-192.png  (192x192 PWA icon)
   ├── icon-512.png  (512x512 PWA icon)
   └── logo.png      (Brand logo)
   ```

4. **Test locally:**
   ```
   http://localhost:8000/?brand=newbrand
   ```

5. **Deploy to GitHub Pages**

## 📊 Architecture

### Files Created/Modified

#### New Files
- `js/BrandLoader.js` - Core brand loading and theming logic
- `css/brand-theming.css` - CSS variables and brand-specific styles
- `brand-switcher.html` - Development tool for testing brands

#### Modified Files
- `index.html` - Added brand loader script in `<head>`
- `js/main.js` - Integrated brand loader with tour player

### Loading Sequence

1. **Page Load**
   ```
   HTML → Head scripts execute
   ```

2. **Brand Detection**
   ```
   BrandLoader.detectBrandFromURL()
   ```

3. **Config Load**
   ```
   BrandLoader.loadBrandConfig() → Fetch JSON
   ```

4. **Theme Application**
   ```
   BrandLoader.applyTheme() → Set CSS variables
   BrandLoader.updateLoadingScreen() → Update logos/text
   BrandLoader.applyLoadingScreenStyles() → Inject CSS
   ```

5. **Tour Initialization**
   ```
   TourPlayer.init() → Apply tour UI styles
   ```

## 🎨 CSS Custom Properties

The system uses CSS custom properties for dynamic theming:

```css
/* Light Mode */
--brand-primary: #7B1E1E;
--brand-primary-dark: #4A0F0F;
--brand-primary-light: #A52A2A;
--brand-background: #f4f5f7;
--brand-text-primary: #1a1a2e;

/* Dark Mode */
--brand-dark-background: #1A0A0A;
--brand-dark-card: #2A1515;
--brand-dark-text-primary: #e8e8e8;
```

These are set as inline styles by `BrandLoader.js` and used in `brand-theming.css`.

## ⚠️ Limitations & Workarounds

### PWA Manifest
**Issue**: GitHub Pages can't dynamically generate `manifest.json`

**Workarounds**:
1. Use a single brand for PWA (set in `manifest.json`)
2. Use a build script to generate brand-specific manifests
3. Accept generic PWA branding

### Server-Side Rendering
**Issue**: URL path-based branding requires server rewrites

**Solution**: Use query parameters (`?brand=ayat`) for static hosting

### Asset Paths
**Issue**: Brand logos use relative paths

**Solution**: Ensure all paths are relative to the HTML file location

## 🔍 Troubleshooting

### Brand Not Loading
1. Check browser console for errors
2. Verify `_brands/{brand}/brand-config.json` exists
3. Check network tab for 404 errors
4. Ensure URL path or query param is correct

### Styles Not Applying
1. Check if `brand-theming.css` is loaded
2. Inspect CSS variables in DevTools
3. Verify `BrandLoader.applyTheme()` was called

### Wrong Logo Displaying
1. Check logo path in brand config
2. Ensure logo file exists at specified path
3. Check for fallback logos in HTML

## 📝 Example URLs

### Local Development
```
http://localhost:8000/?brand=ayat
http://localhost:8000/ayat/
http://localhost:8000/brand-switcher.html
```

### GitHub Pages
```
https://username.github.io/tour-player/?brand=ayat
https://username.github.io/tour-player/ayat/
```

## 🤝 Contributing

To improve the branding system:

1. Update brand config files with complete information
2. Test changes across all 6 brands
3. Ensure dark mode works for all themes
4. Verify responsive design on all screen sizes

## 📄 License

This branding system is part of the virtual tour player project.
