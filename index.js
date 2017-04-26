'use strict';

global.Promise = require('bluebird');

module.exports = {
    http: require('./libs/http'),
    server: require('./libs/server')
};