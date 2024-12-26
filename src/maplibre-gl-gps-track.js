import { convertGpxToGeojsonWithMetrics } from "./convertGpxToGeojsonWithMetrics.js";
import FileHandler from "./FileHandler.js";

class GPSTrackControl {
  static SOURCE_ID = "gps-source";
  static LAYER_ID = "gps-layer";

  minSpeedKmPerHour = 0;
  maxSpeedKmPerHour = 20;

  minHeartRateBpm = 50;
  maxHeartRateBpm = 200;

  constructor() {
    this.container = null;
    this.map = null;
  }

  createSpeedInputFields = () => {
    const speedContainer = document.createElement("div");
    speedContainer.style.display = "flex";
    speedContainer.style.flexDirection = "column";
    speedContainer.style.padding = "8px";

    const minSpeedLabel = document.createElement("label");
    minSpeedLabel.innerText = "Min Speed (km/h):";
    const minSpeedInput = document.createElement("input");
    minSpeedInput.type = "number";
    minSpeedInput.value = this.minSpeedKmPerHour;
    minSpeedInput.style.marginBottom = "8px";
    minSpeedInput.style.width = "60px";
    minSpeedInput.addEventListener("input", (event) => {
      this.minSpeedKmPerHour = parseFloat(event.target.value) || 0;
      this.updateLineStyle();
    });

    const maxSpeedLabel = document.createElement("label");
    maxSpeedLabel.innerText = "Max Speed (km/h):";
    const maxSpeedInput = document.createElement("input");
    maxSpeedInput.type = "number";
    maxSpeedInput.value = this.maxSpeedKmPerHour;
    maxSpeedInput.style.width = "60px";
    maxSpeedInput.addEventListener("input", (event) => {
      this.maxSpeedKmPerHour = parseFloat(event.target.value) || 0;
      this.updateLineStyle();
    });

    speedContainer.appendChild(minSpeedLabel);
    speedContainer.appendChild(minSpeedInput);
    speedContainer.appendChild(maxSpeedLabel);
    speedContainer.appendChild(maxSpeedInput);

    return speedContainer;
  };

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
  };

  toggleGPXUploadVisibility = (isVisible) => {
    const input = document.getElementById("gpx-file-input");
    const speedInputFields = this.container.querySelector("div");
    const showButton = this.container.querySelector("button");

    if (isVisible) {
      input.style.display = "block";
      speedInputFields.style.display = "block";
      showButton.style.display = "none";

      const closeOnClickOutside = (event) => {
        if (!this.container.contains(event.target)) {
          this.toggleGPXUploadVisibility(false);
          document.removeEventListener("click", closeOnClickOutside);
        }
      };

      document.addEventListener("click", closeOnClickOutside);
    } else {
      input.style.display = "none";
      speedInputFields.style.display = "none";
      showButton.style.display = "block";
    }
  };

  addGPXLoadButton = () => {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    const showButton = document.createElement("button");
    showButton.innerText = "⌚";

    showButton.addEventListener("click", () => {
      this.toggleGPXUploadVisibility(true);
    });

    const input = document.createElement("input");
    input.type = "file";
    input.id = "gpx-file-input";
    input.accept = ".gpx";
    input.style.display = "none";

    input.addEventListener("change", this.onFileChange);

    const speedInputFields = this.createSpeedInputFields();
    speedInputFields.style.display = "none";
    speedInputFields.classList.add("speed-input-fields");

    this.container.appendChild(showButton);
    this.container.appendChild(input);
    this.container.appendChild(speedInputFields);
  };

  onAdd(map) {
    this.map = map;
    this.addGPXLoadButton();
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
