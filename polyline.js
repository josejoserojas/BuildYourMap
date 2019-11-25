/**
 * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 *
 * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
 * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
 *
 */

var polyline = {};

function py2_round(value) {
  // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
  return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 */
var polylineDecode = function (str, precision) {
  var index = 0,
    lat = 0,
    lng = 0,
    coordinates = [],
    shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change,
    factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

  // Coordinates have variable length when encoded, so just keep
  // track of whether we've hit the end of the string. In each
  // loop iteration, a single coordinate is decoded.
  while (index < str.length) {

    // Reset shift, result, and byte
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};

function flipped(coords) {
  var flipped = [];
  for (var i = 0; i < coords.length; i++) {
    flipped.push(coords[i].slice().reverse());
  }
  return flipped;
}

/**
 * Decodes to a GeoJSON LineString geometry.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Object}
 */
var polylineToGeoJSON = function (str, precision) {
  var coords = polylineDecode(str, precision);
  return {
    type: 'LineString',
    coordinates: flipped(coords)
  };
};

var getColor = function (ty) {
  switch (ty) {
    case 1: return 'orange'
    case 2: return 'red'
    case 3: return 'brown'
  }
  return 'gray'
}

var getSpeed = function (ty) {

  switch (ty) {
    case 1: return 50 // Fast!
    case 2: return 95 // Not that fast...
    case 3: return 200 // Slow....
  }
  return 1000; // VERY SLOW...
}

var getWidth = function (zoom) {
  zoom = Math.floor(zoom);
  return 3 + (zoom / 4);
}

var currentCount = 0;
var linesAnimation = [];
var addAnimation = function (map, array) {
  for (const interval of linesAnimation) {
    clearInterval(interval);
  }
  linesAnimation = [];
  steps = [];

  // remove the current arrays from the map
  for (i = 0; i < currentCount; i++) {
    map.removeLayer('line' + i);
    map.removeSource('line' + i);
  }
  currentCount = 0;
  for (const line of array) {
    var layer = {
      'id': 'line' + currentCount,
      'type': 'line',
      'source': {
        'type': 'geojson',
        'data': line.geojson
      },
      'layout': {
        'line-join': 'round',
        'line-cap': 'round'
      },
      'paint': {
        'line-blur': 1,
        'line-color': getColor(line.ty),
        'line-width': getWidth(map.getZoom()),
        "line-dasharray": [0, 4, 3]
      }
    }
    map.addLayer(layer);
    steps[currentCount] = 0;
    linesAnimation.push(setInterval(animateLines, getSpeed(line.ty), map, currentCount));
    currentCount++;
  }
};

/* I had this snippet from StackOverFlow. Can't find the link to give attribution.
   Do you know ?
*/
var steps = [];
let dashArraySeq = [
  [0, 4, 3],
  [1, 4, 2],
  [2, 4, 1],
  [3, 4, 0],
  [0, 1, 3, 3],
  [0, 2, 3, 2],
  [0, 3, 3, 1]];
var animateLines = function (map, index) {
  steps[index] = (steps[index] + 1) % dashArraySeq.length;
  map.setPaintProperty('line' + index, 'line-dasharray', dashArraySeq[steps[index]]);
}