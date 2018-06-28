const _ = require('lodash');
const config = require('config');
const sinon = require('sinon');
const model = require('../../../api/models/api');
const request = require('request-promise-native');
const { assert } = require('chai');

let sandbox;

describe('API model', () => {
  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });
  afterEach(function () {
    sandbox.restore();
  });

  context('get function', () => {
    it('Should call the _getBreakingBadQuote function when category is `breakingbad`', () => {
      const getBreakingBadFunctionMock = sandbox.mock(model)
        .expects('_getBreakingBadQuote')
        .once()
        .resolves({});
      return model.get('breakingbad')
        .then(() => {
          getBreakingBadFunctionMock.verify();
        });
    });

    it('Should call the _getDog function when category is `dog`', () => {
      const getDogFunctionMock = sandbox.mock(model)
        .expects('_getDog')
        .once()
        .resolves({});
      return model.get('dog')
        .then(() => {
          getDogFunctionMock.verify();
        });
    });

    it('Should call the _getStock function when category is `stock`', () => {
      const getStockFunctionMock = sandbox.mock(model)
        .expects('_getStock')
        .once()
        .resolves({});
      return model.get('stock')
        .then(() => {
          getStockFunctionMock.verify();
        });
    });

    it('Should call the _getFootball function when category is `football`', () => {
      const getFootballFunctionMock = sandbox.mock(model)
        .expects('_getFootball')
        .once()
        .resolves({});
      return model.get('football')
        .then(() => {
          getFootballFunctionMock.verify();
        });
    });
  });

  context('postToSlack function', () => {
    it('Should call request function with the right input data', () => {
      process.env.slack_key = 'test-token';
      const randomMock = sandbox.mock(_)
        .expects('random')
        .once()
        .returns(512);
      const getRandomNameMock = sandbox.mock(model)
        .expects('_getRandomName')
        .once()
        .returns('test-name');
      const getReqMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('https://slack.com/api/chat.postMessage?token=test-token&channel=test-channel&text=test-text&username=test-name&icon_url=https://picsum.photos/512/512/?random')
        .resolves({});
      return model.postToSlack({ text: 'test-text', channel: 'test-channel' })
        .then(() => {
          randomMock.verify();
          getRandomNameMock.verify();
          getReqMock.verify();
        });
    });
  });

  context('_getRandomName function', () => {
    it('Should return a name from the list of names defined in the configs', () => {
      assert.include(config.random_names, model._getRandomName());
    });
  });

  context('_getReq function', () => {
    it('Should call the request object function with the right input data', () => {
      const apiResponse = {};
      const requestMock = sandbox.mock(request)
        .expects('get')
        .once()
        .withArgs({ uri: 'test', json: true })
        .resolves(apiResponse);
      return model._getReq('test')
        .then(res => {
          requestMock.verify();
          assert.equal(res, apiResponse);
        });
    });
  });

  context('_getDog function', () => {
    it('Should call the breeds list endpoint and the selected breed images endpoint', () => {
      const getBreedsResults = { status: 'success', message: { 'test-breed': [] } };
      const getBreedsRequestMock = sandbox.mock(model)
        .expects('_getReq')
        .twice()
        .resolves(getBreedsResults);
      return model._getDog()
        .then(res => {
          getBreedsRequestMock.verify();
          assert.equal(res, 'undefined You wish you had a cute test-breed dog like me on your laps now.');
        });
    });
  });

  context('_getBreakingBadQuote function', () => {
    it('Should call _getReq with the right url', () => {
      const getReqMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('https://breaking-bad-quotes.herokuapp.com/v1/quotes')
        .resolves([{ author: 'test-author', quote: 'test-quote' }]);
      return model._getBreakingBadQuote()
        .then(res => {
          getReqMock.verify();
        });
    });

    it('Should throw an error if the API returns an empty array', () => {
      const getReqMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('https://breaking-bad-quotes.herokuapp.com/v1/quotes')
        .resolves([]);
      return model._getBreakingBadQuote()
        .catch(e => {
          getReqMock.verify();
          assert.include(config.static_random_messages.breakingbad, e.toString().replace('Error: ', ''));
        });
    });
  });

  context('_getStock function', () => {
    it('Should call _getReq with the right url', () => {
      const getReqMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('https://ws-api.iextrading.com/1.0/tops')
        .resolves([{ symbol: 'test-symbol', lastSalePrice: '0.01', lastUpdated: 'Sun Dec 30 2018 19:00:00 GMT-0500 (EST)' }]);
      return model._getStock()
        .then(res => {
          getReqMock.verify();
          assert.equal(res, 'test-symbol: $0.01 - last updated on Sun Dec 30 2018 19:00:00 GMT-0500 (EST)');
        });
    });

    it('Should throw an error if the API returns an empty array', () => {
      const getReqMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('https://ws-api.iextrading.com/1.0/tops')
        .resolves([]);
      return model._getStock()
        .catch(e => {
          getReqMock.verify();
          assert.include(config.static_random_messages.stock, e.toString().replace('Error: ', ''));
        });
    });
  });

  context('_getFootball function', () => {
    it('Should return a line from the configuration file when request to get leagues returns no data', () => {
      const getLeaguesRequestMock = sandbox.mock(model)
        .expects('_getReq')
        .once()
        .withArgs('http://api.football-data.org/v1/competitions')
        .resolves([]);
      return model._getFootball()
        .catch(e => {
          getLeaguesRequestMock.verify();
          assert.include(config.static_random_messages.football, e.toString().replace('Error: ', ''));
        });
    });

    it('Should make 2 calls to the Football API when both calls succeed and return expected data', () => {
      const footBallRequestsMock = sandbox.mock(model)
        .expects('_getReq')
        .twice()
        .resolves([{ id: 1 }]);
      return model._getFootball()
        .then(() => {
          footBallRequestsMock.verify();
        });
    });
  });
});