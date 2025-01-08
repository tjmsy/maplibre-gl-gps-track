import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIManager from "./UIManager.js";
import EventManager from "./EventManager.js";

const DEFAULT_SETTINGS = {
  minHeartRateWidth: 3,
  maxHeartRateWidth: 15,
  speedColors: {
    slow: "#FF0000",
    medium: "#FFFF00",
    fast: "#008000",
  },
  fitBoundsOptions: { duration: 1000 },
};

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
    this.fitBoundsOptions = {
      ...DEFAULT_SETTINGS.fitBoundsOptions,
      ...fitBoundsOptions,
    };
    this.speedColors = DEFAULT_SETTINGS.speedColors;
    this.minHeartRateWidth = DEFAULT_SETTINGS.minHeartRateWidth;
    this.maxHeartRateWidth = DEFAULT_SETTINGS.maxHeartRateWidth;
    this.isSpeedColorEnabled = isSpeedColorEnabled;
    this.isHeartRateWidthEnabled = isHeartRateWidthEnabled;

    this.container = null;
    this.map = null;
    this.uiManager = new UIManager();
    this.eventManager = null;

    this.isGPXLoaded = false;
    this.isHeartRateExist = false;
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
      this.speedColors.slow,
      MID_SPEED,
      this.speedColors.medium,
      this.maxSpeedKmPerHour,
      this.speedColors.fast,
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

  updateRange(
    features,
    propertyName,
    minInputId,
    maxInputId,
    stateKeys,
    existenceKey
  ) {
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
    this.updateRange(features, "speed", "min-speed-input", "max-speed-input", {
      min: "minSpeedKmPerHour",
      max: "maxSpeedKmPerHour",
    });
  }

  getFeatureBounds(features) {
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

  fitMapToBounds = (features) => {
    const { minLat, maxLat, minLng, maxLng } = this.getFeatureBounds(features);

    this.map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      this.fitBoundsOptions
    );
  };

  updateSpeedProperties(features) {
    this.updateSpeedRange(features);
    this.uiManager.setSpeedContainerVisibility(true);
    this.updateSpeedColorLayer();
  }

  updateHeartRateProperties(features) {
    this.updateHeartRateRange(features);
    if (this.isHeartRateExist) {
      this.uiManager.setHeartRateContainerVisibility(true);
      this.updateHeartRateWidthLayer();
    } else {
      this.uiManager.setHeartRateContainerVisibility(false);
    }
  }

  updateLineProperties(features) {
    if (this.isSpeedColorEnabled) {
      this.updateSpeedProperties(features);
    }
    if (this.isHeartRateWidthEnabled) {
      this.updateHeartRateProperties(features);
    }
  }

  renderLine = ({ geojson }) => {
    this.isGPXLoaded = true;
    this.removeLineIfExists();
    this.addLine(geojson, this.createLineStyle());
    this.updateLineProperties(geojson.features);
    this.fitMapToBounds(geojson.features);
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
      this.eventManager.attachClickOutsideListener();
    } else {
      fileInput.style.display = "none";
      this.uiManager.setSpeedContainerVisibility(false);
      this.uiManager.setHeartRateContainerVisibility(false);
      showButton.style.display = "block";
      this.eventManager.detachClickOutsideListener();
    }
  };

  attachEventListeners() {
    this.eventManager = new EventManager(this.container, this.uiManager, this);
    this.eventManager.attachListeners();
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
