class UIBuilder {
  constructor() {
    this.container = null;
    this.minSpeedInput = null;
    this.maxSpeedInput = null;
    this.minHeartRateInput = null;
    this.maxHeartRateInput = null;
    this.minHeartRateWidth = 3;
    this.maxHeartRateWidth = 15;
  }

  createShowButton() {
    const showButton = document.createElement("button");
    showButton.id = "show-button";
    showButton.innerText = "⌚";
    return showButton;
  }

  createFileInput() {
    const fileInputContainer = document.createElement("div");
    fileInputContainer.style.display = "none";
    fileInputContainer.id = "gpx-file-input";

    const label = document.createElement("label");
    label.innerText = "GPS Visualizer";
    label.style.display = "block";
    label.style.marginBottom = "8px";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".gpx";

    fileInputContainer.appendChild(label);
    fileInputContainer.appendChild(fileInput);

    return fileInputContainer;
  }

  createHeartRateContainer() {
    const heartRateContainer = document.createElement("div");
    heartRateContainer.id = "heart-rate-container";
    heartRateContainer.style.display = "none";
    heartRateContainer.style.flexDirection = "column";
    heartRateContainer.style.padding = "8px";

    const minHeartRateLabel = document.createElement("label");
    minHeartRateLabel.innerText = "Min HeartRate:";
    this.minHeartRateInput = document.createElement("input");
    this.minHeartRateInput.id = "min-heart-rate-input";
    this.minHeartRateInput.type = "number";
    this.minHeartRateInput.style.marginBottom = "8px";
    this.minHeartRateInput.style.width = "60px";

    const minHeartRateWidthLabel = document.createElement("label");
    minHeartRateWidthLabel.innerText = "Width:";
    this.minHeartRateWidthInput = document.createElement("input");
    this.minHeartRateWidthInput.id = "min-heart-rate-width-input";
    this.minHeartRateWidthInput.type = "number";
    this.minHeartRateWidthInput.value = this.minHeartRateWidth;
    this.minHeartRateWidthInput.style.marginBottom = "8px";
    this.minHeartRateWidthInput.style.width = "60px";

    const maxHeartRateLabel = document.createElement("label");
    maxHeartRateLabel.innerText = "Max HeartRate:";
    this.maxHeartRateInput = document.createElement("input");
    this.maxHeartRateInput.id = "max-heart-rate-input";
    this.maxHeartRateInput.type = "number";
    this.maxHeartRateInput.style.width = "60px";

    const maxHeartRateWidthLabel = document.createElement("label");
    maxHeartRateWidthLabel.innerText = "Width:";
    this.maxHeartRateWidthInput = document.createElement("input");
    this.maxHeartRateWidthInput.id = "max-heart-rate-width-input";
    this.maxHeartRateWidthInput.type = "number";
    this.maxHeartRateWidthInput.value = this.maxHeartRateWidth;
    this.maxHeartRateWidthInput.style.marginBottom = "8px";
    this.maxHeartRateWidthInput.style.width = "60px";

    heartRateContainer.appendChild(minHeartRateLabel);
    heartRateContainer.appendChild(this.minHeartRateInput);
    heartRateContainer.appendChild(minHeartRateWidthLabel);
    heartRateContainer.appendChild(this.minHeartRateWidthInput);
    heartRateContainer.appendChild(maxHeartRateLabel);
    heartRateContainer.appendChild(this.maxHeartRateInput);
    heartRateContainer.appendChild(maxHeartRateWidthLabel);
    heartRateContainer.appendChild(this.maxHeartRateWidthInput);

    return heartRateContainer;
  }

  createSpeedContainer() {
    const speedContainer = document.createElement("div");
    speedContainer.id = "speed-container";
    speedContainer.style.display = "none";
    speedContainer.style.flexDirection = "column";
    speedContainer.style.padding = "8px";

    const minSpeedLabel = document.createElement("label");
    minSpeedLabel.innerText = "Min Speed (km/h):";
    this.minSpeedInput = document.createElement("input");
    this.minSpeedInput.id = "min-speed-input";
    this.minSpeedInput.type = "number";
    this.minSpeedInput.style.marginBottom = "8px";
    this.minSpeedInput.style.width = "60px";

    const maxSpeedLabel = document.createElement("label");
    maxSpeedLabel.innerText = "Max Speed (km/h):";
    this.maxSpeedInput = document.createElement("input");
    this.maxSpeedInput.id = "max-speed-input";
    this.maxSpeedInput.type = "number";
    this.maxSpeedInput.style.width = "60px";

    speedContainer.appendChild(minSpeedLabel);
    speedContainer.appendChild(this.minSpeedInput);
    speedContainer.appendChild(maxSpeedLabel);
    speedContainer.appendChild(this.maxSpeedInput);

    return speedContainer;
  }

  createUIElements() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    const showButton = this.createShowButton();
    const fileInput = this.createFileInput();
    const speedContainer = this.createSpeedContainer();
    const heartRateContainer = this.createHeartRateContainer();

    this.container.appendChild(showButton);
    this.container.appendChild(fileInput);
    this.container.appendChild(speedContainer);
    this.container.appendChild(heartRateContainer);
  }

  setHeartRateContainerVisibility = (isVisible) => {
    const heartRateContainer = this.container.querySelector(
      "#heart-rate-container"
    );
    heartRateContainer.style.display = isVisible ? "flex" : "none";
  };

  setSpeedContainerVisibility = (isVisible) => {
    const speedContainer = this.container.querySelector("#speed-container");
    speedContainer.style.display = isVisible ? "flex" : "none";
  };
}

export default UIBuilder;
