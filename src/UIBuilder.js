class UIBuilder {
    constructor() {
      this.container = null;
    }
  
    createShowButton() {
      const showButton = document.createElement("button");
      showButton.id = "show-button";
      showButton.innerText = "⌚";
      return showButton;
    }
  
    createFileInput() {
      const fileInput = document.createElement("input");
      fileInput.id = "gpx-file-input";
      fileInput.style.display = "none";
      fileInput.type = "file";
      fileInput.accept = ".gpx";
      return fileInput;
    }
  
    createSpeedInputFields() {
      const speedContainer = document.createElement("div");
      speedContainer.id = "speed-input-fields";
      speedContainer.style.display = "none";
      speedContainer.style.flexDirection = "column";
      speedContainer.style.padding = "8px";
  
      const minSpeedLabel = document.createElement("label");
      minSpeedLabel.innerText = "Min Speed (km/h):";
      const minSpeedInput = document.createElement("input");
      minSpeedInput.type = "number";
      minSpeedInput.value = 0;
      minSpeedInput.style.marginBottom = "8px";
      minSpeedInput.style.width = "60px";
  
      const maxSpeedLabel = document.createElement("label");
      maxSpeedLabel.innerText = "Max Speed (km/h):";
      const maxSpeedInput = document.createElement("input");
      maxSpeedInput.type = "number";
      maxSpeedInput.value = 20;
      maxSpeedInput.style.width = "60px";
  
      speedContainer.appendChild(minSpeedLabel);
      speedContainer.appendChild(minSpeedInput);
      speedContainer.appendChild(maxSpeedLabel);
      speedContainer.appendChild(maxSpeedInput);
  
      return speedContainer;
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
  }

  export default UIBuilder;