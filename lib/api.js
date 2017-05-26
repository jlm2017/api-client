const config = require('./config');
const {Resource, Item} = require('./resource');
const createRequestCreator = require('./http');
const {pathJoin} = createRequestCreator;

function configureResources(target, configuration, requestCreator, basePath='/') {
    for(let [resourceName, resourceDescriptor] of Object.entries(configuration)) {
      configureResource(target, resourceName, resourceDescriptor, requestCreator, basePath);
    }

}

function configureResource(target, name, descriptor, requestCreator, basePath) {
  let itemClass;
  if ('itemResources' in descriptor) {
    itemClass = class extends Item {
      constructor(requestCreator, basePath, _id) {
        super(requestCreator, basePath, _id);
        configureResources(this, descriptor.itemResources, requestCreator, pathJoin());
      }
    };
  } else {
    itemClass = Item;
  }

  Object.defineProperty(target, name, {
    value: new Resource(requestCreator, pathJoin(basePath, descriptor.basePath), itemClass),
    enumerable: false
  });
}

class API {
  constructor(options) {
    this.requestCreator = createRequestCreator(options);
    configureResources(this, config.resourceConfiguration, this.requestCreator);
  }
}

module.exports = function api(options) { return new API(options); };
