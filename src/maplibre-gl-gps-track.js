import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";
import UIBuilder from "./UIBuilder.js";

class GPSTrackControl {
  static SOURCE_ID = "gps-source";
  static LAYER_ID = "gps-layer";

  constructor() {
    this.container = null;
    this.map = null;
    this.minSpeedKmPerHour = 0;
    this.maxSpeedKmPerHour = 20;
    this.minHeartRateBpm = 50;
    this.maxHeartRateBpm = 200;
    this.uiBuilder = new UIBuilder();
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

  calculateBounds(features) {
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
    const { minLat, maxLat, minLng, maxLng } = this.calculateBounds(features);

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

  renderLine = ({ geojson }) => {
    this.removeLineIfExists();
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
    const speedInputFields = this.container.querySelector("div");
    const showButton = this.container.querySelector("button");

    if (isVisible) {
      fileInput.style.display = "block";
      speedInputFields.style.display = "block";
      showButton.style.display = "none";

      document.addEventListener("click", this.closeOnClickOutside);
    } else {
      fileInput.style.display = "none";
      speedInputFields.style.display = "none";
      showButton.style.display = "block";
    }
  };

  attachEventListeners() {
    const showButton = this.container.querySelector("#show-button");
    const fileInput = this.container.querySelector("#gpx-file-input");
    const speedInputFields = this.container.querySelector(
      "#speed-input-fields"
    );

    showButton.addEventListener("click", () => {
      this.showHideUI(true);
    });

    fileInput.addEventListener("change", this.onFileChange);

    speedInputFields.addEventListener("input", () => {
      this.updateLineStyle();
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
