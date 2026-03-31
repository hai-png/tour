# Hotspot Editor Tool

A visual editor for placing and orienting hotspots in the HAI PNG Virtual Tour.

## How to Open

Simply open `hotspot-editor.html` in your web browser:

```bash
# Option 1: Direct file open (may have CORS issues with some browsers)
firefox hotspot-editor.html

# Option 2: Using a local server (recommended)
python3 -m http.server 8000
# Then open: http://localhost:8000/hotspot-editor.html

# Option 3: Using Node.js
npx serve .
# Then open: http://localhost:3000/hotspot-editor.html
```

## Features

### Visual Placement
- **Click on panorama** to place hotspots at exact locations
- **Drag to look around** the 360° panorama
- **Scroll to zoom** in/out for precise placement
- **Real-time markers** show hotspot positions in 3D space

### Hotspot Properties
- **Position**: Yaw, Pitch, Distance
- **Target Camera**: Set the view when users click the hotspot
- **Sprite Image**: Configure the hotspot icon
- **Label**: Human-readable name for the hotspot

### Scene Management
- Switch between all scenes in the tour
- View and edit hotspots per scene
- See hotspot count for current scene

### Export
- Save changes to JSON format
- Copy to clipboard or download
- Compatible with existing hotspot system

## Workflow

### 1. Add a New Hotspot
1. Select the scene from the dropdown
2. Click "Add Hotspot" button
3. The hotspot appears at your current view direction

### 2. Position the Hotspot
**Option A - Visual Placement:**
1. Navigate to where you want the hotspot
2. Click directly on the panorama where it should appear
3. Fine-tune using the Yaw/Pitch/Distance inputs

**Option B - Manual Entry:**
1. Enter exact Yaw, Pitch, and Distance values
2. Click "Set from Current View" to use your current camera direction

### 3. Set Target Camera
When users click the hotspot, they'll be taken to this view:

1. Navigate to the desired target view
2. Set the target scene from dropdown
3. Click "Set from Current View" button
4. Adjust FOV if needed (30-100°)

### 4. Configure Appearance
1. Enter the sprite image URL (e.g., `media/tdv-import/hotspots/arrow_01.png`)
2. Set a descriptive label
3. Preview the sprite in the panel

### 5. Save and Export
1. Click "Save Changes" to update the hotspot data
2. Click "Export JSON" to generate the final file
3. Copy the JSON and save to `media/tdv-import/hotspots.json`

## Controls

| Action | Control |
|--------|---------|
| Look Around | Left-click + Drag |
| Zoom | Mouse Wheel |
| Place Hotspot | Click on panorama |
| Select Hotspot | Click from list |

## Data Structure

Each hotspot has this structure:

```json
{
  "id": "hs_0",
  "type": "animated-sprite",
  "position": {
    "yaw": 121.52,
    "pitch": -28.64,
    "distance": 500
  },
  "sprite": {
    "url": "media/tdv-import/hotspots/sprite.png",
    "frameCount": 24,
    "rowCount": 6,
    "colCount": 4,
    "frameDuration": 41,
    "width": 520,
    "height": 420,
    "displayWidth": 60,
    "displayHeight": 60
  },
  "content": {
    "targetSceneId": "scene_...",
    "targetSceneIndex": 3,
    "label": "Arrow to Kitchen",
    "targetYaw": 45.0,
    "targetPitch": -10.0,
    "targetFov": 60
  },
  "tooltip": {
    "text": "Go to Kitchen",
    "visible": true
  },
  "visible": true,
  "sceneIndex": 0,
  "sceneId": "scene_..."
}
```

## Tips

1. **Use consistent distances** (500 works well for most cases)
2. **Place hotspots at eye level** (pitch close to 0)
3. **Test in the actual tour** after exporting
4. **Backup your JSON** before making changes
5. **Use descriptive labels** for easier maintenance

## Troubleshooting

### Hotspots not showing in tour
- Ensure `hotspots.json` is saved to the correct location
- Check that `sceneIndex` matches the target scene
- Verify `visible: true` is set

### Markers not appearing in editor
- Make sure you're on the correct scene
- Check browser console for errors
- Refresh the page and reload data

### CORS errors when loading images
- Use a local server (not file:// protocol)
- Ensure image paths are correct
- Check that images exist

## File Location

After exporting, save the JSON to:
```
media/tdv-import/hotspots.json
```

This is the file that the main tour player reads from.
