class UIBuilder {
  constructor() {
    this.container = null;
    this.minSpeedInput = null;
    this.maxSpeedInput = null;
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
    label.innerText = "GPX File Loader";
    label.style.display = "block";
    label.style.marginBottom = "8px";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".gpx";

    fileInputContainer.appendChild(label);
    fileInputContainer.appendChild(fileInput);

    return fileInputContainer;
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

    this.container.appendChild(showButton);
    this.container.appendChild(fileInput);
    this.container.appendChild(speedContainer);
  }
  setSpeedContainerVisibility = (isVisible) => {
    const speedContainer = this.container.querySelector("#speed-container");
    speedContainer.style.display = isVisible ? "flex" : "none";
  };
}

export default UIBuilder;
