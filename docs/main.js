import GPSTrackControl from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-gps-track@v0.1.1/src/maplibre-gl-gps-track.js";

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: [0, 0],
  zoom: 1,
  hash: true,
});

map.addControl(new GPSTrackControl({isHeartRateWidthEnabled: true})), 'top-left');
