import GPSTrackControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-gps/track/src/maplibre-gl-gps-track.js";

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [139.18, 35.94],
  zoom: 11,
  hash: true,
});

map.addControl(new GPSTrackControl(), 'top-left');
