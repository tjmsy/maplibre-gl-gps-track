/**
 * Converts GPX data to GeoJSON with speed and slope metrics.
 * @param {!XMLDocument} gpxData The GPX data as an XML document.
 * @return {!Object} A GeoJSON FeatureCollection with additional metrics.
 * @throws {Error} If GPX data is invalid.
 */
export const convertGpxToGeojsonWithMetrics = (gpxData) => {
  if (!gpxData) {
    throw new Error("Invalid GPX data. Please provide a valid GPX document.");
  }
  const geoJson = convertGpxToGeoJson(gpxData);
  const pointFeatures = extractPointFeatures(geoJson);
  const featureCollection = createFeatureCollectionWithMetrics(pointFeatures);
  return featureCollection;
};

/**
 * Converts GPX data to GeoJSON.
 * @param {XMLDocument} gpxData - The GPX data to convert.
 * @returns {Object} The GeoJSON representation of the GPX data.
 */
const convertGpxToGeoJson = (gpxData) => {
  return toGeoJSON.gpx(gpxData);
};

/**
 * Extracts Point features from LineString features in the GeoJSON.
 * @param {Object} geoJson - The GeoJSON object containing LineString features.
 * @returns {Array} An array of Point features.
 */
const extractPointFeatures = (geoJson) => {
  return geoJson.features.flatMap((feature) => {
    if (feature.geometry.type === "LineString") {
      const heartRates = feature.properties.heartRates || [];
      const coordTimes = feature.properties.coordTimes || [];

      return feature.geometry.coordinates.map((coord, index) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coord,
        },
        properties: {
          time: coordTimes[index] || null,
          heartRate: heartRates[index] || null,
        },
      }));
    }
    return [];
  });
};

/**
 * Creates a FeatureCollection with metrics such as speed and slope.
 * @param {Array} pointFeatures - The Point features to process.
 * @returns {Object} A FeatureCollection with speed and slope metrics.
 */
const createFeatureCollectionWithMetrics = (pointFeatures) => {
  const featureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  pointFeatures.forEach((pointA, i) => {
    const pointB = pointFeatures[i + 1];
    if (!pointB) return; // Skip if no next point exists

    const distance = calculateDistance(pointA, pointB);
    if (distance === 0) return; // Skip if distance is zero

    const speed = calculateSpeed(pointA, pointB, distance);
    const slope = calculateSlope(pointA, pointB, distance);
    const time = pointB.properties.time || null;
    const heartRate = pointB.properties.heartRate || null;

    featureCollection.features.push(
      createLineStringFeature([pointA, pointB], speed, slope, time, heartRate)
    );
  });

  return featureCollection;
};

/**
 * Calculates the distance between two points using turf.js.
 * @param {!Object} pointA The starting point.
 * @param {!Object} pointB The ending point.
 * @return {number} The distance in kilometers.
 */
const calculateDistance = (pointA, pointB) =>
  turf.distance(pointA.geometry.coordinates, pointB.geometry.coordinates);

/**
 * Calculates the speed between two points.
 * @param {!Object} pointA The starting point.
 * @param {!Object} pointB The ending point.
 * @param {number} distance The distance between the points in kilometers.
 * @return {number} The speed in kilometers per hour.
 */
const calculateSpeed = (pointA, pointB, distance) => {
  const timeDeltaMilliseconds =
    new Date(pointB.properties.time) - new Date(pointA.properties.time);

    if (timeDeltaMilliseconds <= 0) return 0;

    const timeDeltaSeconds = timeDeltaMilliseconds / 1000;
    const speedInKmPerSecond = distance / timeDeltaSeconds;
    const speedInKmPerHour = speedInKmPerSecond * 3600;
  
    return speedInKmPerHour;
};

/**
 * Calculates the slope between two points.
 * @param {Object} pointA - The starting point, containing `geometry.coordinates`.
 * @param {Object} pointB - The ending point, containing `geometry.coordinates`.
 * @param {number} distance - The horizontal distance between the points in kilometers.
 * @returns {number} The slope as a ratio (elevation change per horizontal distance).
 */
const calculateSlope = (pointA, pointB, distance) => {
  const elevationDeltaMeters =
    pointB.geometry.coordinates[2] - pointA.geometry.coordinates[2]; // elevation in the third coordinate

    if (distance <= 0) return 0;

    const distanceInMeters = distance * 1000;
  
    const slope = elevationDeltaMeters / distanceInMeters;
  
    return slope;
};

/**
 * Creates a GeoJSON LineString feature with speed and slope properties.
 * @param {!Array<!Object>} points The two points defining the LineString.
 * @param {number} speed The calculated speed.
 * @param {number} slope The calculated slope.
 * @return {!Object} A GeoJSON LineString feature.
 */
const createLineStringFeature = (points, speed, slope, time, heartRate) => ({
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: points.map((point) => point.geometry.coordinates),
  },
  properties: {
    speed,
    slope,
    time,
    heartRate,
  },
});
