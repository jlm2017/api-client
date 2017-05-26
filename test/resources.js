const expect = require('chai').expect;
const request = require('superagent');
const mock = require('superagent-mocker')(request);

const {Resource, Item} = require('../lib/resource');

const createRequestCreator = require('../lib/http');

const TEST_DOMAIN = 'http://testdomain/';

const sampleResourceItems = ['A', 'B', 'C', 'D', 'E'].map(function (_id, id) {
  return {
    _id, id,
    url: `${TEST_DOMAIN}${_id}/`
  };
});

describe('Resource', function () {
  before(function () {
    this.requestCreator = createRequestCreator({endpoint: TEST_DOMAIN});
    this.resource = new Resource(this.requestCreator, 'resource', Item);

    mock.get(`${TEST_DOMAIN}resource/`, (req) => {
      const page = +req.query.page || 1;
      const max_results = +req.query.max_results || 10;
      if ((page - 1) * max_results > sampleResourceItems.length) {
        return {status: '404'};
      }

      const first = (page === 1);
      const last = (page * max_results > sampleResourceItems.length);
      const _links = {};
      if (!last) {
        _links.next = {href: `${TEST_DOMAIN}resource/?page=${page + 1}&max_results=${max_results}`};
      }
      if (!first) {
        _links.prev = {href: `${TEST_DOMAIN}resource/?page=${page - 1}&max_results=${max_results}`};
      }

      return {
        body: {
          _items: sampleResourceItems.slice((page - 1) * max_results, page * max_results), _links
        }
      };
    });
  });

  describe('#list', function () {
    it('should return the full list of events', function () {
      return this.resource.list().then((list) => {
        expect(list).to.have.lengthOf(sampleResourceItems.length);
        expect(list).to.be.an('array');
        list.map((item) => {
          expect(item).to.be.an.instanceOf(Item);
        });
      });
    });

    it('should set correctly hasNext and hasPrevious', async function () {
      let wholeList = await this.resource.list();
      expect(wholeList).to.contain.all.keys(['hasNext', 'hasPrevious']);
      expect(wholeList.hasNext).to.be.false;
      expect(wholeList.hasPrevious).to.be.false;

      let firstPageList = await this.resource.list({page: 1, max_results: Math.ceil(sampleResourceItems.length/2)});
      expect(firstPageList).to.contain.all.keys(['hasNext', 'hasPrevious']);
      expect(firstPageList.hasNext).to.be.true;
      expect(firstPageList.hasPrevious).to.be.false;

      let secondPageList = await this.resource.list({page: 2, max_results: Math.ceil(sampleResourceItems.length/2)});
      expect(secondPageList).to.contain.all.keys(['hasNext', 'hasPrevious']);
      expect(secondPageList.hasNext).to.be.false;
      expect(secondPageList.hasPrevious).to.be.true;
      expect(secondPageList).to.contain.keys('getPrevious');
    });

    it('should allow fetching the next and the previous pages', async function() {
      let firstPageList = await this.resource.list({page: 1, max_results: Math.ceil(sampleResourceItems.length/2)});
      expect(firstPageList).to.contain.keys('getNext');
      expect(firstPageList.getNext).to.be.a('function');

      let nextPageList = await firstPageList.getNext();
      expect(nextPageList).to.contain.keys('getPrevious');
      expect(nextPageList.getPrevious).to.be.a('function');

      let prevPageList = await nextPageList.getPrevious();
      expect(firstPageList).to.deep.equal(prevPageList);
    });
  });

  describe('#getById', function () {
    it('should return a specific event');
  });

  describe('#create', function () {
    it('should be possible to create an event');
  });
});
