'use strict';

const {pathJoin} = require('./http');

function excludeKeys(obj, props) {
  const res = {};
  for (let key of Object.keys(obj)) {
    if (!props.includes(key)) {
      res[key] = obj[key];
    }
  }
  return res;
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
      excludeKeys(props, ['url'])
    );
  }

  _setUrl(url) {
    if (url) {
      Object.defineProperty(this, 'url', {value: url});
    } else {
      this.url = null;
    }
  }

  save() {
    if (this.url === null) {
      // creation
      return this._requestCreator.post(this._basePath, {content: this})
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
    return this.requestCreator.put(this.path, {content});
  }

  post(content) {
    return this.requestCreator.post(this.path, {content});
  }
}


module.exports = {Resource, Item, ExtraRoute};
