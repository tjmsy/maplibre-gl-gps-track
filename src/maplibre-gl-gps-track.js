import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIBuilder from "./UIBuilder.js";

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
      this.renderLine({
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

  createSpeedColorExpression = () => {
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
        "line-color": this.createSpeedColorExpression(),
        "line-width": 3,
      },
    };
  };

  updateLineStyle = () => {
    const minSpeed = this.minSpeedKmPerHour;
    const maxSpeed = this.maxSpeedKmPerHour;

    if (maxSpeed < minSpeed) {
      return;
    }

    if (this.map.getLayer(GPSTrackControl.LAYER_ID)) {
      this.map.setPaintProperty(
        GPSTrackControl.LAYER_ID,
        "line-color",
        this.createSpeedColorExpression()
      );
    }
  };

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

  moveMap = (features) => {
    const { minLat, maxLat, minLng, maxLng } = this.getBounds(features);

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

  closeOnClickOutside = (event) => {
    if (!this.container.contains(event.target)) {
      this.showHideUI(false);
      document.removeEventListener("click", this.closeOnClickOutside);
    }
  };

  showHideUI = (isVisible) => {
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
      this.showHideUI(true);
    });

    fileInput.addEventListener("change", this.onFileChange);

    minSpeedInput.addEventListener("input", (event) => {

      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.minSpeedKmPerHour = value;
        this.updateLineStyle();
      }
    });
    
    maxSpeedInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.maxSpeedKmPerHour = value;
        this.updateLineStyle();
      }

    });
  }

  createUI() {
    this.uiBuilder.createUIElements();
    this.container = this.uiBuilder.container;
  }

  onAdd(map) {
    this.map = map;
    this.createUI();
    this.attachEventListeners();
    return this.uiBuilder.container;
  }

  onRemove() {
    if (this.map) {
      this.removeLineIfExists();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.map = null;
  }
}

export default GPSTrackControl;
