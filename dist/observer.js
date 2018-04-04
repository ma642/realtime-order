'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _ioredis = require('ioredis');

var _ioredis2 = _interopRequireDefault(_ioredis);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**

	Here we just subscribe the message and send to the front end.

*/

var logger = new _winston2.default.Logger({
	level: process.env.LOG_LEVEL || 'debug',
	transports: [new _winston2.default.transports.Console({
		colorize: 'all'
	})]

});

var start = function start(_ref, cb) {
	var socket = _ref.socket,
	    subClient = _ref.subClient,
	    pubClient = _ref.pubClient;

	logger.info("watch redis port: ");

	subClient.subscribe('CustomerChannel', function (err, count) {
		// Now we are subscribed to both the 'news' and 'music' channels.
		// `count` represents the number of channels we are currently subscribed to.
		logger.info('subscribed', err, count);
	});

	subClient.on('message', function (channel, message) {
		logger.debug('Receive message %s from channel %s', message, channel);
		if (message && message[0] != '{') {
			logger.warn('expect the message is json type');
			return;
		};
		try {
			var msg = JSON.parse(message);
			if (msg.type != 'order') {
				logger.debug('get trade type');
				return;
			}

			var _ref2 = msg.data || {},
			    CustomerID = _ref2.CustomerID;

			if (!CustomerID) {
				logger.warn('empty of CustomerID', msg);
				return;
			}
			var dealError = function dealError(err) {
				logger.error('user for ', CustomerID, 'msg :', msg, err);
			};
			pubClient.hget(config.siteMap(), CustomerID).then(function (socketId) {
				logger.debug('get socket from CustomerID', CustomerID, ' to ', socketId);
				if (!socketId) {
					//dealError(new Error('empty of CustomerID ' + CustomerID))
					logger.info('order message to ', CustomerID, ' not loggined');
					return;
				}
				//emit message to front end.
				logger.debug('emit msg to ', socketId, CustomerID);
				socket.to(socketId).emit('order', msg.data);
			}).catch(function (err) {
				dealError(err);
			});
		} catch (e) {
			logger.error('error when parse json from message', e);
		}
	});

	cb && cb();
};

exports.default = start;