const sinon = require('sinon');
const model = require('../../../api/models/api');
const controller = require('../../../api/controllers/surprise');
const utils = require('../../helpers/utils');
const { assert } = require('chai');

let sandbox, response, request, responseStub;

describe('Surprise controller', () => {
  beforeEach(function () {
    sandbox = sinon.createSandbox();
    responseStub = sandbox.stub();
    response = utils.createResponseObject(responseStub);
    responseStub.returns(response);
  });
  afterEach(function () {
    sandbox.restore();
  });

  context('fetch function', () => {
    context('When the request succeeds', () => {
      before(() => {
        request = {};
      });

      context('When request body contains a category', () => {
        before(() => {
          request = { body: { text: 'dog', channel_name: 'test-channel' } };
        });
        it('Should call model get function with category as parameter and model postToSlack function', () => {
          const modelGetResult = 'test-result';
          const category = 'dog';
          const mockModelGet = sandbox.mock(model)
            .expects('get')
            .once()
            .withArgs(category)
            .resolves(modelGetResult);
          const mockModelPost = sandbox.mock(model)
            .expects('postToSlack')
            .once()
            .withArgs({ text: modelGetResult, channel: 'test-channel' })
            .resolves({});
          return controller.fetch(request, response)
            .then(() => {
              mockModelGet.verify();
              mockModelPost.verify();
              assert.deepEqual(responseStub.args, [[200], []]);
            });
        });
      });

      context('When request body does not contain a category nor channel_name', () => {
        before(() => {
          request = { body: { text: '', channel_name: '' } };
        });
        it('Should call model get function and call postToSlack with general as destination channel', () => {
          const modelGetResult = 'test-result';
          const mockModelGet = sandbox.mock(model)
            .expects('get')
            .once()
            .resolves(modelGetResult);
          const mockModelPost = sandbox.mock(model)
            .expects('postToSlack')
            .once()
            .withArgs({ text: modelGetResult, channel: 'general' })
            .resolves({});
          return controller.fetch(request, response)
            .then(() => {
              mockModelGet.verify();
              mockModelPost.verify();
              assert.deepEqual(responseStub.args, [[200], []]);
            });
        });
      });
    });

    context('When the request fails', () => {
      before(() => {
        request = {};
      });

      context('When request body contains a category', () => {
        before(() => {
          request = { body: { text: 'a failed request' } };
        });

        it('Should return http 500', () => {
          const modelGetError = 'model error';
          const mockModelGet = sandbox.mock(model)
            .expects('get')
            .once()
            .rejects(modelGetError);
          const mockModelPost = sandbox.mock(model)
            .expects('postToSlack')
            .never();
          return controller.fetch(request, response)
            .then(res => {
              mockModelGet.verify();
              mockModelPost.verify();
              assert.deepEqual(responseStub.args, [[500], []]);
            });
        });
      })
    });
  });
});