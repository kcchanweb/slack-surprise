require('lodash');
const config = require('config');
const sinon = require('sinon');
const { assert } = require('chai');
const utils = require('../../../api/helpers/utils');

let sandbox;

describe('API model', () => {
  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });
  afterEach(function () {
    sandbox.restore();
  });

  context('getRandomFromArray function', () => {
    it('Should return a item from array', () => {
      assert.deepEqual(utils.getRandomFromArray([{ test: 1 }]), { test: 1 });
    });

    it('Should return undefined if array is empty', () => {
      assert.deepEqual(utils.getRandomFromArray([]), undefined);
    });
  });

  context('getQueryString function', () => {
    it('Should return properly formatted string when the input is a populated object', () => {
      assert.equal(utils.getQueryString({ a: 1, b: '2', c: 'ddd' }), 'a=1&b=2&c=ddd');
    });

    it('Should return an empty string if the input is an empty object', () => {
      assert.equal(utils.getQueryString({}), '');
    });
  });

  context('getRandomMessage function', () => {
    config.allowed_categories.forEach(category => {
      it(`Should return a random message from the configuration when the category is ${category}`, () => {
        assert.include(config.static_random_messages[category], utils.getRandomMessage(category));
      });
    });
  });
});