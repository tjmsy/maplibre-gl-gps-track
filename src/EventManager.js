class EventManager {
  constructor(container, uiManager, context) {
    this.container = container;
    this.uiManager = uiManager;
    this.context = context;
  }

  attachFileInputListener() {
    const fileInput = this.container.querySelector("#gpx-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", this.context.onFileChange);
    }
  }

  attachShowButtonListener() {
    const showButton = this.container.querySelector("#show-button");
    if (showButton) {
      showButton.addEventListener("click", () => {
        this.context.showHideUI(true);
      });
    }
  }

  attachInputListeners(inputs) {
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
  }

  attachListeners() {
    const inputs = {
      minHeartRate: {
        selector: "#min-heart-rate-input",
        handler: (value) => {
          this.context.minHeartRate = value;
          this.context.updateHeartRateWidthLayer();
        },
      },
      maxHeartRate: {
        selector: "#max-heart-rate-input",
        handler: (value) => {
          this.context.maxHeartRate = value;
          this.context.updateHeartRateWidthLayer();
        },
      },
      minHeartRateWidth: {
        selector: "#min-heart-rate-width-input",
        handler: (value) => {
          this.context.minHeartRateWidth = value;
          this.context.updateHeartRateWidthLayer();
        },
      },
      maxHeartRateWidth: {
        selector: "#max-heart-rate-width-input",
        handler: (value) => {
          this.context.maxHeartRateWidth = value;
          this.context.updateHeartRateWidthLayer();
        },
      },
      minSpeed: {
        selector: "#min-speed-input",
        handler: (value) => {
          this.context.minSpeedKmPerHour = value;
          this.context.updateSpeedColorLayer();
        },
      },
      maxSpeed: {
        selector: "#max-speed-input",
        handler: (value) => {
          this.context.maxSpeedKmPerHour = value;
          this.context.updateSpeedColorLayer();
        },
      },
    };

    this.attachInputListeners(inputs);
    this.attachShowButtonListener();
    this.attachFileInputListener();
  }

  attachClickOutsideListener() {
    const closeOnClickOutside = (event) => {
      if (!this.container.contains(event.target)) {
        this.context.showHideUI(false);
        document.removeEventListener("click", closeOnClickOutside);
      }
    };

    document.addEventListener("click", closeOnClickOutside);
  }

  detachClickOutsideListener() {
    document.removeEventListener("click", this.closeOnClickOutside);
  }
}

export default EventManager;
