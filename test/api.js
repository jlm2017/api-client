const expect = require('chai').expect;
const request = require('superagent');

const api = require('../index');
const {Resource, Item, ExtraRoute} = require('../lib/resource');

const TEST_DOMAIN = 'http://testdomain/';
const mock = require('superagent-mocker')(request);

const SAMPLE_RESOURCES = [0, 1, 2, 3].map(i => ({
  _id: i,
  name: `Resource n°${i}`,
  related: {
    url: `${TEST_DOMAIN}other_resource/${i}/`,
    prop: 'incredible related'
  }
}));

function resourceList(urlBuilder) {
  return (req) => ({
    body: {
      _items: SAMPLE_RESOURCES.map(item => Object.assign({url: urlBuilder(item)}, item)),
      _links: {}
    },
    status: 200
  });
}

function resourceItem(urlBuilder) {
  return req => {
    const i = +req.params.id;
    if (i >= SAMPLE_RESOURCES.length) {
      throw {
        status: 404
      };
    }

    return {
      status: 200,
      body: Object.assign({url: urlBuilder(SAMPLE_RESOURCES[i])}, SAMPLE_RESOURCES[i])
    };
  };
}

describe('api', function () {
  describe('default configuration', function () {
    before('initialize API', function () {
      this.client = api.createClient();
    });

    describe('endpoints', function () {
      it('should have created basic endpoints', function () {
        ['events', 'groups', 'people', 'clients'].map((endpoint) => {
          expect(this.client).has.property(endpoint);
          expect(this.client[endpoint]).to.be.an.instanceOf(Resource);
          expect(this.client[endpoint].path).to.equal('/' + endpoint + '/');
        });
      });

      it('should have created bulk route on events items', function () {
        this.skip();
      });
    });
  });

  describe('#createClient()', function () {
    before(function () {
      const resourceUrlBuilder = (item) => `${TEST_DOMAIN}resource/${item._id}/`;
      const otherResourceUrlBuilder = (item) => `${TEST_DOMAIN}other_resource/${item._id}/`;

      mock.get(`${TEST_DOMAIN}resource/`, resourceList(resourceUrlBuilder));

      mock.put(`${TEST_DOMAIN}resource/resource_extra/`, (req) => (
        {status: 200, body: {message: 'OK'}}
      ));

      mock.get(`${TEST_DOMAIN}resource/:id/`, resourceItem(resourceUrlBuilder));

      mock.put(`${TEST_DOMAIN}resource/:id/item_extra/`, req => (
        {status: 200, body: {message: `OK for ${req.params.id}`}}
      ));

      mock.get(`${TEST_DOMAIN}resource/:pid/other_resource/`, resourceList(otherResourceUrlBuilder));
      mock.get(`${TEST_DOMAIN}resource/:pid/other_resource/:id/`, resourceItem(otherResourceUrlBuilder));

      mock.get(`${TEST_DOMAIN}other_resource/`, resourceList(otherResourceUrlBuilder));
      mock.get(`${TEST_DOMAIN}other_resource/:id/`, resourceItem(otherResourceUrlBuilder));

      this.client = api.createClient({
        endpoint: TEST_DOMAIN,
        configuration: {
          r: {
            path: 'resource',
            extraRoutes: {
              'e': {path: 'resource_extra'}
            },
            itemResources: {
              'ir': {
                path: 'other_resource'
              }
            },
            itemExtraRoutes: {
              'e': {path: 'item_extra'}
            }
          }
        }
      });
    });

    it('should be possible to create a resource with the configuration', function () {
      expect(this.client).to.have.property('r');
      expect(this.client.r).to.be.an.instanceOf(Resource);
    });

    it('should be possible to use the extra resource route', function () {
      expect(this.client.r).to.have.property('e');
      expect(this.client.r.e).to.be.an.instanceOf(ExtraRoute);

      return this.client.r.e.put({})
        .then(content => {
          expect(content.message).to.equal('OK');
        });
    });

    it('should be possible to list the items', function() {
      return this.client.r.list()
        .then(l => {
          expect(l).to.be.an('array');
          expect(l).to.have.lengthOf(SAMPLE_RESOURCES.length);
        });
    });

    it('should be possible to get a specific item', function() {
      return this.client.r.getById(1)
        .then(i => {
          expect(i).to.be.an.instanceOf(Item);
          expect(i).to.contain.keys(['name']);
        });
    });

    it('should be possible to use an item\'s extra route', function() {
      return this.client.r.getById(2)
        .then(i => {
          return i.e.put({});
        })
        .then(c => {
          expect(c).to.have.keys(['message']);
        });
    });

    it('should be possible to use an item\'s sub resources', function() {
      return this.client.r.getById(3)
        .then(i => {
          return i.ir.list();
        })
        .then(l => {
          expect(l).to.be.an('array');
          l.map(i => {
            expect(i).to.be.an.instanceOf(Item);
          });
        });
    });

    it('should be possible to use an item\'s related fields', function() {
      return this.client.r.getById(0)
        .then(i => {
          expect(i).to.contains.keys(['related']);
          expect(i.related).to.be.an.instanceOf(Item);

          return i.related.refresh();
        })
        .then(r => {
          expect(r).to.contains.key(['name']);
        });
    });

    after('resetting superagent mock', function () {
      mock.clearRoutes();
    });

  });
});
