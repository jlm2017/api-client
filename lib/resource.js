'use strict';

const {pathJoin} = require('./http');
const {ClientError} = require('./exceptions');

function excludeKeys(obj, props) {
  const res = {};
  for (let key of Object.keys(obj)) {
    if (!props.includes(key)) {
      res[key] = obj[key];
    }
  }
  return res;
}

function isSimpleValue(value) {
  return (
    ['number', 'string', 'boolean', 'undefined'].includes(typeof value) ||
    value === null
  );
}


class Resource {
  constructor(requestCreator, path, itemClass) {
    this.requestCreator = requestCreator;
    this.path = path;
    this.itemClass = itemClass;
  }

  _createItem(props) {
    return this.itemClass._fromProps(this.requestCreator, this.path, props);
  }

  create(props) {
    return this._createItem(props);
  }

  _createListGetterThunk(url) {
    return () => {
      const [path, qs] = url.split('?');
      return this.requestCreator.get(path, {query: qs, absolute: true})
        .then(res => this._createList(res.body));
    };
  }

  _createList(content) {
    const list = content._items.map(item => {
      return this._createItem(item);
    });

    if ('next' in content._links) {
      list.hasNext = true;
      list.getNext = this._createListGetterThunk(content._links.next.href);
    } else {
      list.hasNext = false;
    }

    if ('prev' in content._links) {
      list.hasPrevious = true;
      list.getPrevious = this._createListGetterThunk(content._links.prev.href);
    } else {
      list.hasPrevious = false;
    }

    return list;
  }

  list(filters) {
    return this.requestCreator.get(this.path, {query: filters})
      .then((res) => this._createList(res.body));
  }

  getById(id) {
    return this.requestCreator.get(pathJoin(this.path, id))
      .then((res) => {
        return this._createItem(res.body);
      });
  }
}

function _handleProp(requestCreator, basePath, prop) {
  if (isSimpleValue(prop)) {
    // simple value ==> return as such (TODO: handle dates and urls)
    return prop;
  } else if (Array.isArray(prop)) {
    // for arrays, just map over
    return prop.map(p => _handleProp(requestCreator, basePath, p));
  } else if ('url' in prop) {
    // imbricated items !
    return Item._fromProps(requestCreator, basePath, prop);
  } else {
    // nested objects that are not items
    const res = {};
    for (let [key, val] of Object.entries(prop)) {
      res[key] = _handleProp(requestCreator, basePath, prop[key]);
    }
    return res;
  }
}

class Item {
  constructor(requestCreator, basePath, url) {
    url = url || null;
    Object.defineProperties(this, {
      '_basePath': {value: basePath},
      '_requestCreator': {value: requestCreator}
    });

    this._setUrl(url);
  }

  static _fromProps(requestCreator, basePath, props) {
    return Object.assign(
      new this(requestCreator, basePath, props.url),
      _handleProp(requestCreator, basePath, excludeKeys(props, ['url']))
    );
  }

  _setUrl(url) {
    if (url) {
      Object.defineProperty(this, 'url', {value: url});
    } else {
      this.url = null;
    }
  }

  _contentToAPI() {
    /* conver back to API format */
    return this;
  }

  refresh() {
    if (this.url === null) {
      return Promise.reject(new ClientError('Cannot reload new item'));
    }
    return this._requestCreator.get(this.url)
      .then(res => {
        return Object.assign(this, excludeKeys(res.body, ['url']));
      });
  }

  save() {
    if (this.url === null) {
      // creation
      return this._requestCreator.post(this._basePath, {content: this._contentToAPI()})
        .then(res => {
          this._setUrl(res.body.url);
          return Object.assign(this, excludeKeys(res.body, ['url']));
        });
    }

    return this._requestCreator.patch(this.url, {content: this, absolute: true})
      .then(res => {
        return this;
      });
  }

  clone() {
    const copy = new this.constructor(this._requestCreator, null);
    Object.assign(copy, this);
  }
}

class ExtraRoute {
  constructor(requestCreator, path) {
    this.requestCreator = requestCreator;
    this.path = path;
  }

  put(content) {
    return this.requestCreator.put(this.path, {content})
      .then(res => res.body);
  }

  post(content) {
    return this.requestCreator.post(this.path, {content})
      .then(res => res.body);
  }
}


module.exports = {Resource, Item, ExtraRoute};
