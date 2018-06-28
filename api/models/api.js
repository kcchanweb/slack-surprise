const _ = require('lodash');
const config = require('config');
const HttpStatus = require('http-status-codes');
const request = require('request-promise-native');
const { getRandomFromArray, getQueryString, getRandomMessage } = require('../helpers/utils');

module.exports = {
  get: (category) => {
    return _.get({
      breakingbad: module.exports._getBreakingBadQuote,
      dog: module.exports._getDog,
      stock: module.exports._getStock,
      football: module.exports._getFootball
    }, category)();
  },

  postToSlack: (data) => {
    const queryParams = {
      token: process.env.slack_key,
      channel: data.channel,
      text: data.text,
      username: module.exports._getRandomName(),
      icon_url: config.random_img.replace(/___/g, _.random(512, 2000)),
    };
    return module.exports._getReq(`${config.services.slack_web_api}?${getQueryString(queryParams)}`);
  },

  _getRandomName: () => {
    return getRandomFromArray(config.random_names);
  },

  _getReq: (url) => {
    return request.get({
      uri: url,
      json: true
    });
  },

  _getDog: () => {
    let breed;
    return module.exports._getReq(`${config.services.dog}/breeds/list/all`)
      .then(res => {
        if (res.status === 'success') {
          const breeds = Object.keys(res.message);
          breed = getRandomFromArray(breeds);
          return module.exports._getReq(`${config.services.dog}/breed/${breed}/images`);
        } else {
          throw new Error(getRandomMessage('dog'));
        }
      })
      .then(dogImages => {
        if (dogImages.status === 'success') {
          const imgUrl = getRandomFromArray(dogImages.message);
          return `${imgUrl} You wish you had a cute ${breed} dog like me on your laps now.`;
        } else {
          throw new Error(getRandomMessage('dog'));
        }
      })
      .catch(() => {
        throw new Error(getRandomMessage('dog'));
      });
  },

  _getBreakingBadQuote: () => {
    return module.exports._getReq(`${config.services.breaking_bad}/quotes`)
      .then(res => {
        if (res.length !== 1) {
          throw new Error(getRandomMessage('breakingbad'));
        }
        return `${res[0].author}: ${res[0].quote}`;
      })
  },

  _getStock: () => {
    return module.exports._getReq(`${config.services.iextrading}/tops`)
      .then(res => {
        if (res.length < 1) {
          throw new Error(getRandomMessage('stock'));
        }
        return getRandomFromArray(res);
      })
      .then(randomStock => {
        return `${randomStock.symbol}: $${randomStock.lastSalePrice} - last updated on ${new Date(randomStock.lastUpdated)}`;
      });
  },

  _getFootball: () => {
    // get league data from random competition, with a retry mechanism when the league exists but has no standings data
    const getLeagueDataFromRandomCompetition = (leagues) => {
      const competition = getRandomFromArray(leagues);
      const standingsUrl = `${config.services.football}/competitions/${competition.id}/leagueTable`;
      return module.exports._getReq(standingsUrl)
        .catch(e => {
          if (e.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
            throw new Error(getRandomMessage('football'));
          }
          return getLeagueDataFromRandomCompetition(leagues);
        });
    };

    const normalizeStandingData = (league) => {
      if (_.has(league, 'standing')) {
        return league;
      }
      const flattenedStandings = _.flatMapDeep(league.standings);
      delete league.standings;
      league.standing = flattenedStandings.map(standing => {
        return _.merge({}, standing, { teamName: standing.team });
      });
      return league;
    };

    return module.exports._getReq(`${config.services.football}/competitions`)
      .then(res => {
        if (res.length < 1) {
          throw new Error(getRandomMessage('football'));
        }
        return getLeagueDataFromRandomCompetition(res);
      })
      .then(normalizeStandingData)
      .then(leagueData => {
        if (leagueData.standing.length < 1) {
          throw new Error(getRandomMessage('football'));
        }
        return getRandomFromArray(leagueData.standing);
      })
      .then(team => {
        return `Team: ${team.teamName} // Goals: ${team.goals} // Goals Against: ${team.goalsAgainst}`;
      })
      .catch(e => {
        if (e.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
          return getRandomMessage('football');
        }
      });
  },
};
