class UIManager {
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

  createInputContainer(id, inputs) {
    const container = document.createElement("div");
    container.id = id;
    container.style.display = "none";
    container.style.flexDirection = "column";
    container.style.width = "120x";
    container.style.padding = "8px";
  
    inputs.forEach(({ label, id, type, value, style, accept }) => {
      if (label) {
        const inputLabel = document.createElement("label");
        inputLabel.innerText = label;
        inputLabel.style.display = "block";
        inputLabel.style.marginBottom = "8px";
        container.appendChild(inputLabel);
      }
  
      if (type) {
        const input = document.createElement("input");
        input.id = id;
        input.type = type;
        if (value !== undefined) input.value = value;
        if (accept) input.accept = accept;
  
        Object.assign(input.style, style);
  
        container.appendChild(input);
        this[id] = input;
      }
    });
  
    return container;
  }
  
  createFileInput() {
    return this.createInputContainer("gpx-file-input", [
      {
        label: "GPS Visualizer",
        id: null,
      },
      {
        type: "file",
        id: "file-input",
        accept: ".gpx",
        style: {},
      },
    ]);
  }
  
  createHeartRateContainer() {
    return this.createInputContainer("heart-rate-container", [
      {
        label: "HeartRate Min:",
        id: "min-heart-rate-input",
        type: "number",
        style: { marginBottom: "8px", width: "60px" },
      },
      {
        label: "Width:",
        id: "min-heart-rate-width-input",
        type: "number",
        value: this.minHeartRateWidth,
        style: { marginBottom: "8px", width: "60px" },
      },
      {
        label: "HeartRate Max:",
        id: "max-heart-rate-input",
        type: "number",
        style: { width: "60px" },
      },
      {
        label: "Width:",
        id: "max-heart-rate-width-input",
        type: "number",
        value: this.maxHeartRateWidth,
        style: { marginBottom: "8px", width: "60px" },
      },
    ]);
  }

  createSpeedContainer() {
    return this.createInputContainer("speed-container", [
      {
        label: "Speed Min (km/h):",
        id: "min-speed-input",
        type: "number",
        style: { marginBottom: "8px", width: "60px" },
      },
      {
        label: "Speed Max (km/h):",
        id: "max-speed-input",
        type: "number",
        style: { width: "60px" },
      },
    ]);
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

export default UIManager;
