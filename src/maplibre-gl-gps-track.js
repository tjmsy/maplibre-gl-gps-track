import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIBuilder from "./UIBuilder.js";

class GPSTrackControl {
  static SOURCE_ID = "gps-source";
  static LAYER_ID = "gps-layer";

  constructor({
    paintOptions,
    fitBoundsOptions,
    isSpeedColorEnabled = true,
    isHeartRateWidthEnabled = false,
  } = {}) {
    this.paintOptions = { "line-width": 4, ...paintOptions };
    this.fitBoundsOptions = { duration: 1000, ...fitBoundsOptions };
    this.isSpeedColorEnabled = isSpeedColorEnabled;
    this.isHeartRateWidthEnabled = isHeartRateWidthEnabled;

    this.container = null;
    this.map = null;
    this.uiBuilder = new UIBuilder();
    this.isGPXLoaded = false;
    this.isHeartRateExist = false;

    this.minHeartRateWidth = 3;
    this.maxHeartRateWidth = 15;
  }

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

  onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  };

  onFileError = (error) => {
    alert(`Failed to load file. Reason: ${error.message || "Unknown error"}`);
    console.error("Error reading file:", error);
  };

  createHeartRateWidthExpression = () => {
    return [
      "interpolate",
      ["linear"],
      ["get", "heartRate"],
      this.minHeartRate,
      this.minHeartRateWidth,
      this.maxHeartRate,
      this.maxHeartRateWidth,
    ];
  };

  updateHeartRateWidthLayer = () => {
    const minHeartRate = this.minHeartRate;
    const maxHeartRate = this.maxHeartRate;

    if (maxHeartRate < minHeartRate) {
      return;
    }

    if (this.map.getLayer(GPSTrackControl.LAYER_ID)) {
      this.map.setPaintProperty(
        GPSTrackControl.LAYER_ID,
        "line-width",
        this.createHeartRateWidthExpression()
      );
    }
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

  updateSpeedColorLayer = () => {
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

  createLineStyle = () => {
    return {
      id: GPSTrackControl.LAYER_ID,
      type: "line",
      source: GPSTrackControl.SOURCE_ID,
      paint: this.paintOptions,
    };
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

  getHeartRateRange(features) {
    let minHeartRate = Infinity;
    let maxHeartRate = -Infinity;

    features.forEach((feature) => {
      const heartRate = feature.properties?.heartRate;

      if (heartRate !== null) {
        this.isHeartRateExist = true;
        minHeartRate = Math.min(minHeartRate, heartRate);
        maxHeartRate = Math.max(maxHeartRate, heartRate);
      } else {
        this.isHeartRateExist = false;
        return;
      }
    });

    return { minHeartRate, maxHeartRate };
  }

  updateHeartRateRange(features) {
    const heartRateRange = this.getHeartRateRange(features);
    this.minHeartRate = Math.round(heartRateRange.minHeartRate);
    this.maxHeartRate = Math.round(heartRateRange.maxHeartRate);

    const minHeartRateInput = this.container.querySelector(
      "#min-heart-rate-input"
    );
    const maxHeartRateInput = this.container.querySelector(
      "#max-heart-rate-input"
    );

    if (minHeartRateInput) {
      minHeartRateInput.value = this.minHeartRate;
    }
    if (maxHeartRateInput) {
      maxHeartRateInput.value = this.maxHeartRate;
    }
  }

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
      this.fitBoundsOptions
    );
  };

  renderLine = ({ geojson }) => {
    this.isGPXLoaded = true;
    this.removeLineIfExists();
    this.addLine(geojson, this.createLineStyle());
    if (this.isSpeedColorEnabled) {
      this.updateSpeedRange(geojson.features);
      this.uiBuilder.setSpeedContainerVisibility(true);
      this.updateSpeedColorLayer();
    }
    if (this.isHeartRateWidthEnabled) {
      this.updateHeartRateRange(geojson.features);
      if (this.isHeartRateExist) {
        this.uiBuilder.setHeartRateContainerVisibility(true);
        this.updateHeartRateWidthLayer();
      } else {
        this.uiBuilder.setHeartRateContainerVisibility(false);
      }
    }
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
    const showButton = this.container.querySelector("#show-button");

    if (isVisible) {
      fileInput.style.display = "block";
      this.uiBuilder.setSpeedContainerVisibility(
        this.isGPXLoaded && this.isSpeedColorEnabled
      );
      this.uiBuilder.setHeartRateContainerVisibility(
        this.isGPXLoaded && this.isHeartRateExist
      );
      showButton.style.display = "none";
      document.addEventListener("click", this.closeOnClickOutside);
    } else {
      fileInput.style.display = "none";
      this.uiBuilder.setSpeedContainerVisibility(false);
      this.uiBuilder.setHeartRateContainerVisibility(false);
      showButton.style.display = "block";
    }
  };

  attachEventListeners() {
    const showButton = this.container.querySelector("#show-button");
    const fileInput = this.container.querySelector("#gpx-file-input");
    const minSpeedInput = this.container.querySelector("#min-speed-input");
    const maxSpeedInput = this.container.querySelector("#max-speed-input");
    const minHeartRateInput = this.container.querySelector(
      "#min-heart-rate-input"
    );
    const maxHeartRateInput = this.container.querySelector(
      "#max-heart-rate-input"
    );
    const minHeartRateWidthInput = this.container.querySelector(
      "#min-heart-rate-width-input"
    );
    const maxHeartRateWidthInput = this.container.querySelector(
      "#max-heart-rate-width-input"
    );

    showButton.addEventListener("click", () => {
      this.showHideUI(true);
    });

    fileInput.addEventListener("change", this.onFileChange);

    minHeartRateInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.minHeartRate = value;
        this.updateHeartRateWidthLayer();
      }
    });

    minHeartRateWidthInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.minHeartRateWidth = value;
        this.updateHeartRateWidthLayer();
      }
    });

    maxHeartRateInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.maxHeartRate = value;
        this.updateHeartRateWidthLayer();
      }
    });

    maxHeartRateWidthInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.maxHeartRateWidth = value;
        this.updateHeartRateWidthLayer();
      }
    });

    minSpeedInput.addEventListener("input", (event) => {
      const inputValue = event.target.value;
      if (inputValue === "") {
        return;
      }
      const value = parseFloat(inputValue);
      if (!isNaN(value)) {
        this.minSpeedKmPerHour = value;
        this.updateSpeedColorLayer();
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
        this.updateSpeedColorLayer();
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
