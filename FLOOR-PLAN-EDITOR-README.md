# Floor Plan Radar Editor

A visual editor for placing and orienting radar markers on floor plans in the HAI PNG Virtual Tour.

## How to Open

```bash
# From your tour-player directory:
python3 -m http.server 8000
```

Then open: `http://localhost:8000/floor-plan-editor.html`

## Features

### Visual Placement
- **Click on floor plan** to place radar markers at exact positions
- **Drag markers** to reposition them
- **Real-time preview** of marker positions and direction arrows
- **Percentage-based positioning** (X, Y) for responsive floor plans

### Radar Orientation
- **Set yaw angle** to orient the radar direction indicator
- **Configure initial view** (yaw, pitch, FOV) for when users click the marker
- **Visual direction arrow** shows which way the radar is pointing

### Floor Management
- **Switch between floors**: Ground, First, Second, Third
- **Per-floor markers**: Each floor has its own set of scene markers
- **Scene association**: Link markers to specific scenes in your tour

### Export
- **Save changes** to update marker data
- **Export JSON** format compatible with `floor-plan/floor-plan-config.json`
- **Copy to clipboard** for easy saving

## Workflow

### 1. Select a Floor
1. Choose the floor from the dropdown (Ground, First, Second, Third)
2. The floor plan image loads automatically
3. Existing markers appear as cyan circles with direction arrows

### 2. Add a New Marker
1. Click "Add" button to create a new marker
2. The marker appears at the center of the floor plan (50%, 50%)
3. Select the marker from the list to edit it

### 3. Position the Marker
**Option A - Click to Place:**
1. Click anywhere on the floor plan
2. The X, Y position inputs update automatically
3. If a marker is selected, it moves to that position

**Option B - Drag to Move:**
1. Click and drag an existing marker
2. Release to drop at the new position
3. Position updates automatically

**Option C - Manual Entry:**
1. Enter exact X, Y percentage values
2. X: 0% = left edge, 100% = right edge
3. Y: 0% = top edge, 100% = bottom edge

### 4. Set Radar Orientation
1. Select the marker you want to orient
2. Enter the **Yaw** angle (0-360°)
3. The direction arrow rotates to show the orientation
4. This yaw is used for the radar rotation in the tour

### 5. Configure Initial View
When users click the floor plan marker, they'll be taken to this view:

- **Yaw**: Camera horizontal rotation
- **Pitch**: Camera vertical angle
- **FOV**: Field of view (zoom level, 30-100°)

### 6. Set Scene Properties
- **Scene ID**: Unique identifier (auto-generated or from project)
- **Scene Name**: Human-readable name (e.g., "01_living")
- **Scene Index**: Position in the project's scene array

### 7. Save and Export
1. Click "Save Changes" to update the marker data
2. Click "Export JSON" to generate the configuration
3. Copy the JSON and save to `floor-plan/floor-plan-config.json`

## Controls

| Action | Control |
|--------|---------|
| Place Marker | Click on floor plan |
| Move Marker | Click + Drag |
| Select Marker | Click from list |
| Zoom Browser | Ctrl/Cmd + Scroll |

## Data Structure

Each floor in the config has this structure:

```json
{
  "id": "first",
  "name": "First Floor",
  "image": "floor-plan/first.png",
  "scenes": [
    {
      "sceneId": "scene_DC5E97BE_D774_C17B_41E0_24BA91992222",
      "sceneName": "03_first floor family room",
      "sceneIndex": 2,
      "position": { "x": 70, "y": 50 },
      "initialView": { "yaw": 0, "pitch": 0, "fov": 60 }
    }
  ]
}
```

### Position Values
- **x**: Horizontal position as percentage (0-100)
- **y**: Vertical position as percentage (0-100)

### Initial View Values
- **yaw**: Camera rotation in degrees (0-360)
- **pitch**: Camera tilt in degrees (-90 to 90)
- **fov**: Field of view in degrees (30-100)

## Tips

1. **Use reference images**: Enable floor plan reference images to see where scenes should be placed
2. **Consistent positioning**: Use round numbers (e.g., 50, 75) for cleaner positioning
3. **Test in tour**: Always test marker positions in the actual virtual tour
4. **Direction matters**: Set yaw to match the direction users should face when they click
5. **Backup config**: Save a backup of your config before making major changes

## Troubleshooting

### Markers not showing in tour
- Ensure `floor-plan-config.json` is saved to the correct location
- Check that `sceneId` matches exactly with your project
- Verify the floor plan image path is correct

### Markers in wrong position
- Double-check X, Y percentages (0-100, not pixels)
- Ensure floor plan image aspect ratio is consistent
- Test with different screen sizes

### Direction arrow pointing wrong way
- Adjust yaw value (0° = up, 90° = right, 180° = down, 270° = left)
- Remember: yaw rotates clockwise

### Floor plan image not loading
- Check that image paths are correct relative to HTML file
- Ensure images are accessible (not blocked by CORS)
- Use a local server instead of file:// protocol

## File Location

After exporting, save the JSON to:
```
floor-plan/floor-plan-config.json
```

This is the file that the main tour player reads from.

## Integration with Main Tour

The floor plan editor works with the existing `FloorPlanManager.js` which:
1. Loads `floor-plan/floor-plan-config.json`
2. Reads scene positions for each floor
3. Renders radar markers at the specified positions
4. Rotates radar based on initialView.yaw
5. Navigates to scene when marker is clicked

## Complete Example

```json
{
  "floors": [
    {
      "id": "ground",
      "name": "Ground Floor",
      "image": "floor-plan/ground.png",
      "scenes": [
        {
          "sceneId": "scene_ABC123",
          "sceneName": "01_living",
          "sceneIndex": 0,
          "position": { "x": 62, "y": 65 },
          "initialView": { "yaw": 45, "pitch": -10, "fov": 60 }
        }
      ]
    }
  ]
}
```

This places a radar marker at 62% from left, 65% from top on the ground floor, with the camera facing northeast (45° yaw) when clicked.
