import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIManager from "./UIManager.js";

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
    this.uiManager = new UIManager();
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

  getRange(features, propertyName) {
    let min = Infinity;
    let max = -Infinity;
    let isPropertyExist = false;
  
    features.forEach((feature) => {
      const value = feature.properties?.[propertyName];
      if (value !== undefined && value !== null) {
        isPropertyExist = true;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    });
  
    return { min, max, isPropertyExist };
  }
  
  updateRange(features, propertyName, minInputId, maxInputId, stateKeys, existenceKey) {
    const range = this.getRange(features, propertyName);
    this[stateKeys.min] = Math.round(range.min);
    this[stateKeys.max] = Math.round(range.max);
  
    if (existenceKey) {
      this[existenceKey] = range.isPropertyExist;
    }
  
    const minInput = this.container.querySelector(`#${minInputId}`);
    const maxInput = this.container.querySelector(`#${maxInputId}`);
  
    if (minInput) {
      minInput.value = this[stateKeys.min];
    }
    if (maxInput) {
      maxInput.value = this[stateKeys.max];
    }
  }
  
  updateHeartRateRange(features) {
    this.updateRange(
      features,
      "heartRate",
      "min-heart-rate-input",
      "max-heart-rate-input",
      { min: "minHeartRate", max: "maxHeartRate" },
      "isHeartRateExist"
    );
  }
  
  updateSpeedRange(features) {
    this.updateRange(
      features,
      "speed",
      "min-speed-input",
      "max-speed-input",
      { min: "minSpeedKmPerHour", max: "maxSpeedKmPerHour" }
    );
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
      this.uiManager.setSpeedContainerVisibility(true);
      this.updateSpeedColorLayer();
    }
    if (this.isHeartRateWidthEnabled) {
      this.updateHeartRateRange(geojson.features);
      if (this.isHeartRateExist) {
        this.uiManager.setHeartRateContainerVisibility(true);
        this.updateHeartRateWidthLayer();
      } else {
        this.uiManager.setHeartRateContainerVisibility(false);
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
      this.uiManager.setSpeedContainerVisibility(
        this.isGPXLoaded && this.isSpeedColorEnabled
      );
      this.uiManager.setHeartRateContainerVisibility(
        this.isGPXLoaded && this.isHeartRateExist
      );
      showButton.style.display = "none";
      document.addEventListener("click", this.closeOnClickOutside);
    } else {
      fileInput.style.display = "none";
      this.uiManager.setSpeedContainerVisibility(false);
      this.uiManager.setHeartRateContainerVisibility(false);
      showButton.style.display = "block";
    }
  };

  attachEventListeners() {
    const inputs = {
      minHeartRate: {
        selector: "#min-heart-rate-input",
        handler: (value) => {
          this.minHeartRate = value;
          this.updateHeartRateWidthLayer();
        },
      },
      maxHeartRate: {
        selector: "#max-heart-rate-input",
        handler: (value) => {
          this.maxHeartRate = value;
          this.updateHeartRateWidthLayer();
        },
      },
      minHeartRateWidth: {
        selector: "#min-heart-rate-width-input",
        handler: (value) => {
          this.minHeartRateWidth = value;
          this.updateHeartRateWidthLayer();
        },
      },
      maxHeartRateWidth: {
        selector: "#max-heart-rate-width-input",
        handler: (value) => {
          this.maxHeartRateWidth = value;
          this.updateHeartRateWidthLayer();
        },
      },
      minSpeed: {
        selector: "#min-speed-input",
        handler: (value) => {
          this.minSpeedKmPerHour = value;
          this.updateSpeedColorLayer();
        },
      },
      maxSpeed: {
        selector: "#max-speed-input",
        handler: (value) => {
          this.maxSpeedKmPerHour = value;
          this.updateSpeedColorLayer();
        },
      },
    };

    const addInputListener = (selector, handler) => {
      const inputElement = this.container.querySelector(selector);
      if (inputElement) {
        inputElement.addEventListener("input", (event) => {
          const inputValue = event.target.value;
          if (inputValue === "") return;
          const value = parseFloat(inputValue);
          if (!isNaN(value)) handler(value);
        });
      }
    };

    for (const key in inputs) {
      const { selector, handler } = inputs[key];
      addInputListener(selector, handler);
    }

    const showButton = this.container.querySelector("#show-button");
    if (showButton) {
      showButton.addEventListener("click", () => {
        this.showHideUI(true);
      });
    }

    const fileInput = this.container.querySelector("#gpx-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", this.onFileChange);
    }
  }

  createUI() {
    this.uiManager.createUIElements();
    this.container = this.uiManager.container;
  }

  onAdd(map) {
    this.map = map;
    this.createUI();
    this.attachEventListeners();
    return this.uiManager.container;
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
