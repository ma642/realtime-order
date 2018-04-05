'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var DEFAULT_NS = exports.DEFAULT_NS = '/bhome';
var SESSION_SITE_IN_REDIS = exports.SESSION_SITE_IN_REDIS = 'cmssession';
var USER_SOCKET_MAP_REDIS = exports.USER_SOCKET_MAP_REDIS = 'uuid2socketid';

var siteMap = exports.siteMap = function siteMap() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return [USER_SOCKET_MAP_REDIS].concat(args).join('-');
};