const expect = require('chai').expect;

const api = require('../index');
const {Resource, Item, ExtraRoute} = require('../lib/resource');

describe('API', function () {
  before('initialize API', function () {
    this.client = api.createClient();
  });

  describe('endpoints', function () {
    it('should have created basic endpoints', function () {
      ['events', 'groups', 'people', 'clients'].map((endpoint) => {
        expect(this.client).has.property(endpoint);
        expect(this.client[endpoint]).to.be.an.instanceOf(Resource);
        expect(this.client[endpoint].path).to.equal('/'+endpoint + '/');
      });
    });

    it('should have created bulk route on events items', function () {
      this.skip();
    });
  });
});
