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
  constructor(requestCreator, basePath, itemClass) {
    this.requestCreator = requestCreator;
    this.basePath = basePath;
    this.itemClass = itemClass;
  }

  _initialize(url, props) {
    const item = new this.itemClass(this.requestCreator, this.basePath, url);
    Object.assign(item, props);
    return item;
  }

  create(props) {
    return this._initialize(null, props);
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
      const url = item.url;
      const props = excludeKeys(item, ['url']);
      return this._initialize(url, props);
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
    return this.requestCreator.get(this.basePath, {query: filters})
      .then((res) => this._createList(res.body));
  }

  getById(id) {
    return this.requestCreator.get(pathJoin(this.basePath, id))
      .then((res) => {
        const _id = res.body._id;
        const props = Object.assign({}, res.body);
        delete props._id;
        return this._initialize(_id, props);
      });
  }
}

class Item {
  constructor(requestCreator, basePath, url) {
    url = url || null;
    Object.defineProperties(this, {
      'url': {value: url},
      '_basePath': {value: basePath},
      '_requestCreator': {value: requestCreator}
    });
  }

  save() {
    if (this.url === null) {
      // creation
      return this._requestCreator.post(this._basePath, {content: this})
        .then(res => {
          Object.defineProperty(this, 'url', {writable: false, enumerable: false, value: res.body.url});
          Object.assign(this, excludeKeys(res.body, ['url']));
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

module.exports = {Resource, Item};
