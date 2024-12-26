# maplibre-gl-gps-track

(WIP) A [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js/)  plugin for displaying GPS tracks with customizable styling and metrics visualization.

## Already Implemented:
- Basic functionality for displaying GPX data.
- Speed-based color visualization for GPX tracks
- Input fields for adjusting speed range.

## Demo:
[Demo](https://tjmsy.github.io/maplibre-gl-gps-track/)

![image](https://github.com/user-attachments/assets/19506a47-dce1-4126-ba00-3a2841b651b4)

## Usage  

Import from CDN.

```javascript
import GPSTrackControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-gps-track/src/maplibre-gl-gps-track.js";
```

Add control.

```javascript
map.addControl(new GPSTrackControl(), 'top-left');
```

## TODO:
- Warp to the GPS position when loading a GPS track.
- Visualize heart rates or slopes in combination with speed, using line-width interpolation or potentially other properties  (ideas to be explored).
- Implement support for additional file formats (e.g., KML, GeoJSON, TCX) besides GPX.
- Implement animation for visualizing the movement of the GPS track.
- Refine code style and improve readability.
- Implement additional features.
- Enhance UI.
- Add documentation.

## Current Status:
This project is currently on hold as I’m focusing on other development tasks. However, I welcome contributions! If you have ideas or improvements, feel free to submit a pull request or open an issue. 

Thank you for your interest and support!
