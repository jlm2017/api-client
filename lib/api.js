'use strict';

const config = require('./config');
const {Resource, Item, ExtraRoute} = require('./resource');
const createRequestCreator = require('./http');
const {pathJoin} = createRequestCreator;

function configureResources(target, configuration, requestCreator, basePath = '/') {
  for (let [resourceName, resourceDescriptor] of Object.entries(configuration)) {
    configureResource(target, resourceName, resourceDescriptor, requestCreator, basePath);
  }
}

function configureResource(target, name, descriptor, requestCreator, basePath) {
  let itemClass;
  if ('itemResources' in descriptor || 'itemExtraRoutes' in descriptor) {
    itemClass = class extends Item {
      _setUrl(url) {
        super._setUrl(url);
        if(url) {
          configureResources(this, descriptor.itemResources, requestCreator, url);
          for (let [routeName, routeDescriptor] of Object.entries(descriptor.itemExtraRoutes)) {
            Object.defineProperty(this, 'routeName', {
              value: new ExtraRoute(pathJoin(url, routeDescriptor.path))
            });
          }
        }
      }
    };
  } else {
    itemClass = Item;
  }

  Object.defineProperty(
    target, name, {value: new Resource(requestCreator, pathJoin(basePath, descriptor.path), itemClass)}
  );

  if ('extraRoutes' in descriptor) {
    for (let [routeName, routeDescriptor] of Object.entries(descriptor.extraRoutes)) {
      target[name][routeName] = new ExtraRoute(requestCreator, pathJoin(basePath, descriptor.path, routeDescriptor.path));
    }
  }
}

class API {
  constructor(options) {
    this.requestCreator = createRequestCreator(options);
    configureResources(this, config.resourceConfiguration, this.requestCreator);
  }
}

module.exports = function api(options) {
  return new API(options);
};
