const {NotFoundError, EtagError} = require('./exceptions')

const readMethods = {
  get: function (id) {
    return this.strategy.get(this.name, id)
      .then((res) => {
        if (res.ok) {
          return res.body;
        }
      });
  },

  getAll: function getAll(filter) {
    return this.strategy.getAll(this.name, filter)
      .then((res) => {
        return res.body._items;
      });
  },
};

function forceWrite(instance, method, id, content) {
  return instance.get(id)
    .then((current) => {
      if (current === null) {
        throw new Error(`Tried to ${method} non existent ${instance.name}/${id}`);
      } else {
        return instance.strategy[method](instance.name, id, content, current._etag);
      }
    });
}

const writeMethods = {
  post(content) {
    return this.strategy.post(this.name, content)
    // request won't start without then call
    // if this empty then was not there, the post request would
    // never be made if then was never called on the Promise
      .then(null, null);
  },

  patch: function patch(id, content, options) {
    options = options || {};
    const {overwriteIfChanged, etag} = options;

    if (etag) {
      // if we got an etag, we can try to directly patch
      return this.strategy.patch(this.name, id, content, etag)
        .catch((err) => {
          // EVE Python gives back status code 428 if the etag
          // was not up to date
          if (err instanceof EtagError && overwriteIfChanged) {
            // In this case, we just try patching again with the new etag
            return forceWrite(this, 'patch', id, content);
          }
          throw err;
        });
    } else if (overwriteIfChanged) {
      return forceWrite(this, 'patch', id, content);
    } else {
      throw new Error('Either set overwriteIfChanged to true or provide etag');
    }
  },


  put(id, content, options) {
    options = options || {};
    const {overwriteIfChanged, etag} = options;

    if (etag) {
      // if we got an etag, we can try to directly patch
      return this.strategy.put(this.name, id, content, etag)
        .catch((err) => {
          // EVE Python gives back status code 428 if the etag
          // was not up to date
          if (err instanceof EtagError && overwriteIfChanged) {
            // In this case, we just try patching again with the new etag
            return forceWrite(this, 'put', id, content);
          }
          throw err;
        });
    } else if (overwriteIfChanged) {
      return forceWrite(this, 'put', id, content);
    } else {
      throw new Error('Either set overwriteIfChanged to true or provide etag');
    }
  }
};

function resource(name, strategy, readOnly) {
  const resource = {name, strategy};
  Object.assign(resource, readMethods);
  if (!readOnly) Object.assign(resource, writeMethods);

  return resource;
}

module.exports = resource;
