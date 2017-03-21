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

class BaseStrategy {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  _prepare(req) {
    return this.decorateRequest(req)
      .catch(httpErrorHandler);
  }

  decorateRequest(req) {
    return req
      .set(baseHeaders);
  }

  get(resource, id) {
    const url = `${addTrailingSlash(this.endpoint)}${resource}/${id}`;
    return this._prepare(
      request
        .get(url)
    );
  }

  getAll(resource, filter) {
    const url = `${addTrailingSlash(this.endpoint)}${resource}/`;
    return this._prepare(
      request
        .get(url)
        .query({where: JSON.stringify(filter)})
    );
  }

  post(resource, content) {
    const url = `${addTrailingSlash(this.endpoint)}${resource}/`;
    return this._prepare(
      request
        .post(url)
        .send(content)
    );
  }

  patch(resource, id, content, etag) {
    const url = `${addTrailingSlash(this.endpoint)}${resource}/${id}`;
    return this._prepare(
      request
        .patch(url)
        .send(content)
        .set('If-Match', etag)
    );
  }

  put(resource, id, content, etag) {
    const url = `${addTrailingSlash(this.endpoint)}${resource}/${id}`;
    return this._prepare(request
      .put(url)
      .send(content)
      .set('If-Match', etag)
    );
  }
}

class CrossSiteSessionStrategy extends BaseStrategy {
  decorateRequest(req) {
    return super.decorateRequest(req)
      .addCredentials();
  }
}

class TokenStrategy extends BaseStrategy {
  constructor(endpoint, {token}) {
    super(endpoint);
    this.authHeaderValue = 'Basic ' + base64.encode(`${token}:`);
  }

  decorateRequest(req) {
    return super.decorateRequest(req)
      .set('Authorization', this.authHeaderValue);
  }
}

exports.default = function (endpoint) {
  return new BaseStrategy(endpoint);
};

exports.crossSiteSession = function (endpoint) {
  return new CrossSiteSessionStrategy(endpoint);
};

exports.token = function (endpoint, token) {
  return new TokenStrategy(endpoint, token);
};
