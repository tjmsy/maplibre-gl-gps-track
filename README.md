# maplibre-gl-gps-track
A [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js/)  plugin for displaying GPS tracks with customizable styling and metrics visualization.

## Features:
- Basic functionality for displaying GPX data.
- Speed-based color visualization.
- Heart rates visualization with line-width.


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
