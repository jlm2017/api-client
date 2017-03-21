exports.closeToCoordinates = function whereCloseTo(coordinates, maxDistance = 10000) {
  return {
    coordinates: {
      "$near": {
        "$geometry": {
          type: "Point",
          coordinates: coordinates,
        },
        "$maxDistance": maxDistance
      }
    }
  };
};

exports.or = function or() {
  if (arguments.length == 1 && Array.isArray(arguments[0])) {
    return {"$or": arguments[0]};
  } else {
    return {"$or": [...arguments]};
  }
};

exports.and = function and() {
  if (arguments.length == 1 && Array.isArray(arguments[0])) {
    return {"$and": arguments[0]};
  } else {
    return {"$and": [...arguments]};
  }
};
