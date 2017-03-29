const request = require('superagent');
const base64 = require('js-base64').Base64;

const exceptions = require('./exceptions');

function addTrailingSlash(url) {
  return url.charAt(url.length - 1) === '/' ? url : url + '/';
}

const baseHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

function httpErrorHandler(err) {
  if(!err.status) {
    throw new exceptions.NetworkError('could not reach server');
  }

  if(err.status === 404) {
    throw new exceptions.NotFoundError('object does not exist', err.response);
  } else if(err.status === 403 || err.status === 401) {
    throw new exceptions.AuthorizationError('not authorized to do that', err.response);
  } else if(err.status === 412) {
    throw new exceptions.EtagError('bad etag', err.response);
  } else if(err.status === 422) {
    throw new exceptions.ValidationError('validation error', err.response);
  } else if(err.response.statusType === 4) {
    throw new exceptions.UnknownClientError('unknown client error', err.response);
  } else if(err.response.statusType === 5) {
    throw new exceptions.UnknownServerError('unknown server error', err.response);
  }

  // None of the situations above ?! throw again
  throw err;
}

const writeMethods = ['post', 'put', 'patch', 'delete'];

class BaseStrategy {
  constructor(endpoint, writeEndpoint) {
    writeEndpoint = writeEndpoint || endpoint;

    this.endpoint = endpoint;
    this.writeEndpoint = writeEndpoint;
  }

  _prepare(method, req) {
    return this.decorateRequest(method, req)
      .catch(httpErrorHandler);
  }

  decorateRequest(method, req) {
    return req
      .set(baseHeaders);
  }

  collectionRequest(method, resource, options = {}) {
    const endpoint = method in writeMethods ? this.writeEndpoint : this.endpoint;
    const url = `${addTrailingSlash(endpoint)}${resource}/`;

    let req = request[method](url);
    if('content' in options) {
      req = req.send(content);
    }
    if('where' in options) {
      req = req.query({where: JSON.stringify(options.where)});
    }

    return this._prepare(method, req);
  }

  itemRequest(method, resource, id, options = {}) {
    const endpoint = method in writeMethods ? this.writeEndpoint : this.endpoint;
    const url = `${addTrailingSlash(endpoint)}${resource}/${id}`;

    let req = request[method](url);
    if('content' in options) {
      req = req.send(options.content);
    }
    if('etag' in options) {
      req = req.set('If-Match', options.etag);
    }

    return this._prepare(method, req);
  }

  get(resource, id) {
    return this.itemRequest('get', resource, id);
  }

  getAll(resource, filter) {
    const options = {};
    if (filter) { options.where = filter; }
    return this.collectionRequest('get', resource, options);
  }

  post(resource, content) {
    return this.collectionRequest('post', resource, {content});
  }

  patch(resource, id, content, etag) {
    return this.itemRequest('patch', resource, id, {content, etag});
  }

  put(resource, id, content, etag) {
    return this.itemRequest('put', resource, id, {content, etag});
  }

  del(resource, id, etag) {
    return this.itemRequest('delete', resource, id, {etag});
  }
}

class CrossSiteSessionStrategy extends BaseStrategy {
  decorateRequest(method, req) {
    return super.decorateRequest(method, req)
      .addCredentials();
  }
}

class BasicTokenStrategy extends BaseStrategy {
  constructor(endpoint, writeEndpoint, token) {
    super(endpoint, writeEndpoint);
    this.authHeaderValue = 'Basic ' + base64.encode(`${token}:`);
  }

  decorateRequest(method, req) {
    return super.decorateRequest(method, req)
      .set('Authorization', this.authHeaderValue);
  }
}

exports.default = function (endpoint, writeEndpoint) {
  return new BaseStrategy(endpoint, writeEndpoint);
};

exports.crossSiteSession = function (endpoint, writeEndpoint) {
  return new CrossSiteSessionStrategy(endpoint, writeEndpoint);
};

exports.basicToken = function (endpoint, writeEndpoint, {token}) {
  return new BasicTokenStrategy(endpoint, writeEndpoint, token);
};
