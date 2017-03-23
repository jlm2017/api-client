const config = require('./config');
const resource = require('./resource');
const strategies = require('./strategies');

const defaultOptions = {
  readOnly: true,
  endpoint: config.defaultEndpoint,
  auth: 'default',
};

const authStrategies = {
  'crossSiteSession': strategies.crossSiteSession,
  'basicToken': strategies.basicToken,
  'default': strategies.default
};

class API {
  constructor(options) {
    const {readOnly, endpoint, writeEndpoint, auth, token} = Object.assign({}, defaultOptions, options);

    if (! auth in authStrategies) {
      throw new Error(`Unkwnown auth strategy: ${auth}`)
    }

    let strategy = authStrategies[auth](endpoint, writeEndpoint, {token});

    for (let resourceDescr of config.resources) {
      this[resourceDescr.name] = resource(resourceDescr.apiUrl, strategy, resourceDescr.readOnly)
    }
  }
}

module.exports = function api(options) { return new API(options); };