import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";

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
  }

  onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      FileHandler.readFile(file, this.onFileLoad, this.onFileError);
    }
  };

  onFileLoad = (event) => {
    const xml = FileHandler.parseXML(event.target.result);
    const geojsonData = convertGpxToGeojsonWithMetrics(xml);
    this.updateLine({
      geojson: geojsonData,
    });
  };

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

  closeOnClickOutside = (event) => {
    if (!this.container.contains(event.target)) {
      this.toggleGPXUploadVisibility(false);
      document.removeEventListener("click", this.closeOnClickOutside);
    }
  };

  toggleGPXUploadVisibility = (isVisible) => {
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
      this.toggleGPXUploadVisibility(true);
    });

    fileInput.addEventListener("change", this.onFileChange);

    speedInputFields.addEventListener("input", () => {
      this.updateLineStyle();
    });
  }

  createSpeedInputFields() {
    const speedContainer = document.createElement("div");
    speedContainer.style.display = "none";
    speedContainer.style.flexDirection = "column";
    speedContainer.style.padding = "8px";
    speedContainer.id = "speed-input-fields";

    const minSpeedLabel = document.createElement("label");
    minSpeedLabel.innerText = "Min Speed (km/h):";
    const minSpeedInput = document.createElement("input");
    minSpeedInput.type = "number";
    minSpeedInput.value = this.minSpeedKmPerHour;
    minSpeedInput.style.marginBottom = "8px";
    minSpeedInput.style.width = "60px";

    const maxSpeedLabel = document.createElement("label");
    maxSpeedLabel.innerText = "Max Speed (km/h):";
    const maxSpeedInput = document.createElement("input");
    maxSpeedInput.type = "number";
    maxSpeedInput.value = this.maxSpeedKmPerHour;
    maxSpeedInput.style.width = "60px";

    speedContainer.appendChild(minSpeedLabel);
    speedContainer.appendChild(minSpeedInput);
    speedContainer.appendChild(maxSpeedLabel);
    speedContainer.appendChild(maxSpeedInput);

    return speedContainer;
  }

  createFileInput() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "gpx-file-input";
    fileInput.accept = ".gpx";
    fileInput.style.display = "none";
    return fileInput;
  }

  createShowButton() {
    const showButton = document.createElement("button");
    showButton.id = "show-button";
    showButton.innerText = "⌚";
    return showButton;
  }

  createUIElements() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    const showButton = this.createShowButton();
    const fileInput = this.createFileInput();
    const speedInputFields = this.createSpeedInputFields();

    this.container.appendChild(showButton);
    this.container.appendChild(fileInput);
    this.container.appendChild(speedInputFields);
  }

  onAdd(map) {
    this.map = map;
    this.createUIElements();
    this.attachEventListeners();
    return this.container;
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
