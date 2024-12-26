class FileHandler {
    static readFile(file, onLoad, onError) {
      const reader = new FileReader();
      reader.onload = onLoad;
      reader.onerror = onError;
      reader.readAsText(file);
    }
  
    static parseXML(xmlText) {
      const parser = new DOMParser();
      return parser.parseFromString(xmlText, "application/xml");
    }
  }

  export default FileHandler;