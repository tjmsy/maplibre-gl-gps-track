import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIBuilder from "./UIBuilder.js"

class GPSTrackControl {
  static SOURCE_ID = "gps-source";
  static LAYER_ID = "gps-layer";

  constructor() {
    this.container = null;
    this.map = null;
    this.minHeartRateBpm = 50;
    this.maxHeartRateBpm = 200;
    this.uiBuilder = new UIBuilder();
    this.isGPXLoaded = false;
  }

  onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  };

  async handleFile(file) {
    try {
      const fileContent = await FileHandler.readFile(file);
      const xml = FileHandler.parseXML(fileContent);
      const geojsonData = convertGpxToGeojsonWithMetrics(xml);
      this.updateLine({
        geojson: geojsonData,
      });
    } catch (error) {
      this.onFileError(error);
    }
  }

  onFileError = (error) => {
    alert(`Failed to load file. Reason: ${error.message || "Unknown error"}`);
    console.error("Error reading file:", error);
  };

  calculateLineColor = () => {
    const MID_SPEED = (this.minSpeedKmPerHour + this.maxSpeedKmPerHour) / 2;
    return [
      "interpolate",
      ["linear"],
      ["get", "speed"],
      this.minSpeedKmPerHour,
      "#FF0000",
      MID_SPEED,
      "#FFFF00",
      this.maxSpeedKmPerHour,
      "#008000",
    ];
  };

  createLineStyle = () => {
    return {
      id: GPSTrackControl.LAYER_ID,
      type: "line",
      source: GPSTrackControl.SOURCE_ID,
      layout: {
        "line-cap": "square",
      },
      paint: {
        "line-color": this.calculateLineColor(),
        "line-width": 3,
      },
    };
  };

  updateLineStyle = () => {
    if (this.map.getLayer(GPSTrackControl.LAYER_ID)) {
      this.map.setPaintProperty(
        GPSTrackControl.LAYER_ID,
        "line-color",
        this.calculateLineColor()
      );
    }
  };

<<<<<<< HEAD
  calculateBounds(features) {
=======
  addLine = (geojson, lineStyle) => {
    if (!geojson || !geojson.type || geojson.type !== "FeatureCollection") {
      console.error(
        "Invalid GeoJSON data. Expected a FeatureCollection but received:",
        geojson
      );
      return;
    }
    this.map.addSource(GPSTrackControl.SOURCE_ID, {
      type: "geojson",
      data: geojson,
    });
    this.map.addLayer(lineStyle);
  };

  removeLineIfExists = () => {
    if (this.map.getSource(GPSTrackControl.SOURCE_ID)) {
      this.map.removeLayer(GPSTrackControl.LAYER_ID);
      this.map.removeSource(GPSTrackControl.SOURCE_ID);
    }
  };

  getSpeedRange(features) {
    let minSpeed = Infinity;
    let maxSpeed = -Infinity;

    features.forEach((feature) => {
      const speed = feature.properties?.speed;

      if (speed !== undefined) {
        minSpeed = Math.min(minSpeed, speed);
        maxSpeed = Math.max(maxSpeed, speed);
      }
    });

    return { minSpeed, maxSpeed };
  }

  updateSpeedRange(features) {
    const speedRange = this.getSpeedRange(features);
    this.minSpeedKmPerHour = Math.round(speedRange.minSpeed);
    this.maxSpeedKmPerHour = Math.round(speedRange.maxSpeed);

    const minSpeedInput = this.container.querySelector("#min-speed-input");
    const maxSpeedInput = this.container.querySelector("#max-speed-input");

    if (minSpeedInput) {
      minSpeedInput.value = this.minSpeedKmPerHour;
    }
    if (maxSpeedInput) {
      maxSpeedInput.value = this.maxSpeedKmPerHour;
    }
  }

  getBounds(features) {
>>>>>>> 8a5b7a4 (feat: add speed range handling and initialize it as hidden)
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    features.forEach((feature) => {
      const coordinates = feature.geometry.coordinates;

      coordinates.forEach(([lng, lat]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });
    return { minLat, maxLat, minLng, maxLng };
  }

<<<<<<< HEAD
  addLine = (geojson, lineStyle) => {
    if (!geojson || !geojson.type || geojson.type !== "FeatureCollection") {
      console.error(
        "Invalid GeoJSON data. Expected a FeatureCollection but received:",
        geojson
      );
      return;
    }
    this.map.addSource(GPSTrackControl.SOURCE_ID, {
      type: "geojson",
      data: geojson,
    });
    this.map.addLayer(lineStyle);
  };

  removeOldLine = () => {
    if (this.map.getSource(GPSTrackControl.SOURCE_ID)) {
      this.map.removeLayer(GPSTrackControl.LAYER_ID);
      this.map.removeSource(GPSTrackControl.SOURCE_ID);
    }
  };

  updateLine = ({ geojson }) => {
    this.removeOldLine();
    const lineStyle = this.createLineStyle();
    this.addLine(geojson, lineStyle);

    const { minLat, maxLat, minLng, maxLng } = this.calculateBounds(
      geojson.features
    );
=======
  moveMap = (features) => {
    const { minLat, maxLat, minLng, maxLng } = this.getBounds(features);
>>>>>>> 8a5b7a4 (feat: add speed range handling and initialize it as hidden)

    this.map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
      }
    );
  };

<<<<<<< HEAD
=======
  updateSpeedInputs = () => {
    const minSpeedInput = document.getElementById("min-speed-input");
    const maxSpeedInput = document.getElementById("max-speed-input");

    minSpeedInput.value = this.minSpeedKmPerHour;
    maxSpeedInput.value = this.maxSpeedKmPerHour;
  };

  showSpeedRangeFieldIfGPXLoaded = () => {
    const speedContainer = this.container.querySelector("#speed-container");
    if (this.isGPXLoaded) {
      speedContainer.style.display = "flex";
    }
  };

  renderLine = ({ geojson }) => {
    this.isGPXLoaded = true;
    this.removeLineIfExists();
    this.updateSpeedRange(geojson.features);
    this.uiBuilder.setSpeedContainerVisibility(this.isGPXLoaded);
    this.addLine(geojson, this.createLineStyle());
    this.moveMap(geojson.features);
  };

>>>>>>> 8a5b7a4 (feat: add speed range handling and initialize it as hidden)
  closeOnClickOutside = (event) => {
    if (!this.container.contains(event.target)) {
      this.toggleGPXUploadVisibility(false);
      document.removeEventListener("click", this.closeOnClickOutside);
    }
  };

  toggleGPXUploadVisibility = (isVisible) => {
    const fileInput = this.container.querySelector("#gpx-file-input");
    const speedContainer = this.container.querySelector("#speed-container");
    const showButton = this.container.querySelector("#show-button");

    if (isVisible) {
      fileInput.style.display = "block";
      this.uiBuilder.setSpeedContainerVisibility(this.isGPXLoaded);
      showButton.style.display = "none";
      document.addEventListener("click", this.closeOnClickOutside);
    } else {
      fileInput.style.display = "none";
      this.uiBuilder.setSpeedContainerVisibility(false);
      showButton.style.display = "block";
    }
  };

  attachEventListeners() {
    const showButton = this.container.querySelector("#show-button");
    const fileInput = this.container.querySelector("#gpx-file-input");
    const minSpeedInput = this.container.querySelector("#min-speed-input");
    const maxSpeedInput = this.container.querySelector("#max-speed-input");

    showButton.addEventListener("click", () => {
      this.toggleGPXUploadVisibility(true);
    });

    fileInput.addEventListener("change", this.onFileChange);

    minSpeedInput.addEventListener("input", (event) => {
      this.minSpeedKmPerHour = parseFloat(event.target.value);
      this.updateLineStyle();
    });

    maxSpeedInput.addEventListener("input", (event) => {
      this.maxSpeedKmPerHour = parseFloat(event.target.value);
      this.updateLineStyle();
    });
  }

  createUI(){
    this.uiBuilder.createUIElements();
    this.container = this.uiBuilder.container;
  }

  onAdd(map) {
    this.map = map;
    this.createUI()
    this.attachEventListeners();
    return this.uiBuilder.container;
  }

  onRemove() {
    if (this.map) {
      this.removeOldLine();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.map = null;
  }
}

export default GPSTrackControl;
