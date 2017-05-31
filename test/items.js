const expect = require('chai').expect;
const request = require('superagent');
const mock = require('superagent-mocker')(request);

const {Resource, Item} = require('../lib/resource');

const createRequestCreator = require('../lib/http');

const TEST_DOMAIN = 'http://testdomain/';

