const request = require('superagent');
const base64 = require('js-base64').Base64;

const config = require('./config');
const exceptions = require('./exceptions');

function pathJoin() {
    return Array.prototype.map.call(arguments, function(path){
        if(path[0] === "/"){
            path = path.slice(1);
        }
        if(path[path.length - 1] === "/"){
            path = path.slice(0, path.length - 1);
        }
        return path;
    }).join("/");
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

class RequestCreator {
  constructor(endpoint, authStrategy) {
    this.endpoint = endpoint;
    this.authStrategy = authStrategy;
  }

  _prepare(req) {
    return this.decorateRequest(req)
      .catch(httpErrorHandler);
  }

  decorateRequest(req) {
    return this.authStrategy.decorateRequest(req.set(baseHeaders));
  }

  _request(method, path, options) {
    options = options || {};
    let {query, content, absolute} = options;
    absolute = absolute || false;

    const url = absolute ? path :  pathJoin(this.endpoint, path);
    let req = request[method](url);

    if (query) {
      req = req.query(query);
    }
    if (content) {
      req = req.send(content);
    }

    return this._prepare(req);
  }
}

for (let method of ['get', 'post', 'put', 'patch', 'delete']) {
  RequestCreator.prototype[method] = function(path, options) {
    return this._request(method, path, options);
  };
}

class NoAuthStrategy {
  decorateRequest(req) {
    return req;
  }
}

class AccessTokenStrategy {
  constructor(token) {
    this.token = token;
  }

  decorateRequest(req) {
    return req.set('Authorization', `Bearer ${this.token}`);
  }
}

class ClientStrategy {
  constructor(id, secret) {
    this.header = `Basic ${base64.encode(`${id}:${secret}`)}`;
  }

  decorateRequest(req) {
    return req.set('Authorization', this.header);
  }
}

module.exports = function(opts={}) {
  const endpoint = opts.endpoint || config.defaultEndpoint;
  if ('accessToken' in opts) {
    return new RequestCreator(endpoint, new AccessTokenStrategy(opts.accessToken));
  }

  if ('clientId' in opts && 'clientSecret' in opts) {
    return new RequestCreator(endpoint, new ClientStrategy(opts.clientId, opts.clientSecret));
  }

  return new RequestCreator(endpoint, new NoAuthStrategy());
};

module.exports.pathJoin = pathJoin;
