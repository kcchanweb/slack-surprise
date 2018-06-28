'use strict';
const _ = require('lodash');
const config = require('config');
const HttpStatus = require('http-status-codes');
const model = require('../models/api');
const { getRandomFromArray } = require('../helpers/utils');

module.exports = {
  fetch: (req, res) => {
    const categoryChoices = config.allowed_categories;
    const category = _.get(req, 'body.text', '');
    const channel = _.get(req, 'body.channel_name') || 'general';
    return model.get(category || getRandomFromArray(categoryChoices))
      .then(text => {
        model.postToSlack({ text, channel });
        res.status(HttpStatus.OK).json();
      })
      .catch(e => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json();
      });
  },
};