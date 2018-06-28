const _ = require('lodash');
const config = require('config');

module.exports = {
  getRandomFromArray: (items) => {
    const rangeEnd = items.length - 1;
    const randomIndex = _.random(0, rangeEnd);
    return items[randomIndex];
  },

  getQueryString: (params) => {
    return Object.keys(params).map(name => {
      return `${name}=${params[name]}`;
    }).join('&');
  },

  getRandomMessage: (category) => {
    return module.exports.getRandomFromArray(config.static_random_messages[category]);
  }
};