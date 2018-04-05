'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _ioredis = require('ioredis');

var _ioredis2 = _interopRequireDefault(_ioredis);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var os = require('os'); //require('express')

var numCPUs = os.cpus().length;
var app = (0, _express2.default)();
var server = _http2.default.createServer(app);
var redisAdapter = require('socket.io-redis');

var logger = new _winston2.default.Logger({
  level: process.env.LOG_LEVEL || 'debug',
  transports: [new _winston2.default.transports.Console({
    colorize: 'all'
  })]

});

var host = process.argv[4];
var port = parseInt(process.argv[3]) || 16379;
var db = 1;
var redisOpts = { port: port, host: host, db: db };
var subClient = new _ioredis2.default(redisOpts);
var pubClient = new _ioredis2.default(redisOpts);

pubClient.on('error', function (err) {
  return logger.error('error all ', err);
});
subClient.on('error', function (err) {
  return logger.error('error all ', err);
});

var io = (0, _socket2.default)(server, {
  path: '/realtime-order'
});

//set the redis adapter.
io.adapter(redisAdapter({ pubClient: pubClient, subClient: subClient }));

//const redis = new Redis(process.argv[2]||16379,process.argv[3]);

var parseCookie = function parseCookie(cookie) {
  var reg = /(\w+)=(\w+);?/g;
  var r = {};
  while (true) {
    var m = reg.exec(cookie);
    if (!m) {
      break;
    };
    r[m[1]] = m[2];
  }
  return r;
};

//validate token of jwt
io.use(function (socket, next) {
  var cookie = socket.request.headers.cookie;

  var cookies = parseCookie(cookie);
  logger.info('some one connected..', cookies, cookies.uuid);
  //mock uuid
  var uuid = cookies.uuid; //req.headers.http_x_annotator_auth_token
  //define error handler

  var whenError = function whenError(err) {
    // res.status(401).json({
    //   detail: err.message
    // })
    logger.error('unauthenticated connect.uuid=', uuid);
  };

  try {

    //this is for debug
    if (process.env.NODE_ENV != "production") {
      socket.request.CustomerID = '13810886181';
      next();
      return;
    }
    //TODO validate token.
    //and map the socket.id to user.
    //you should save this to a cache, such as redis.
    if (!uuid) {
      throw new Error('expect the authenticated user');
    }
    pubClient.hget(config.SESSION_SITE_IN_REDIS, uuid, function (err, msg) {
      if (err) {
        whenError(err);return;
      };
      if (!msg) {
        logger.info('user uuid=', uuid, 'havs not authenticated');
        whenError(new Error('user not authenticated'));
        return;
      };

      var _JSON$parse = JSON.parse(msg),
          CustomerID = _JSON$parse.CustomerID;

      socket.request.CustomerID = CustomerID;
      next();
    });
  } catch (err) {
    //whenError(err)
    logger.error(err);
  }
});

var onActionSub = function onActionSub(_ref) {
  var socket = _ref.socket,
      CustomerID = _ref.CustomerID;
  return function (msg, cb) {
    logger.debug('sub:', socket.id, " sub-message:", msg);
    //setTimeout(()=>socket.emit('fine', 'timer'), 2000)
    if (!CustomerID) {
      cb && cb('error', 'no customer id exist.');
    };
    pubClient.hset(config.siteMap(), CustomerID, socket.id, function (err, msg) {
      logger.info('user customerid=', CustomerID, '  put map result: msg=', msg, ' error=', err);
      if (err) {
        logger.error(err);
        cb && cb('error', err.message);
        return;
      };
      cb & cb('ok');
    });
  };
};

var onDisconnect = function onDisconnect(_ref2) {
  var socket = _ref2.socket;
  return function () {
    var CustomerID = socket.request.CustomerID;

    logger.info(CustomerID, ' : disconnect. socket.id=', socket.id);
    //TODO remove the user to socket.id 的map
    pubClient.hdel(config.siteMap(), CustomerID, function (err, msg) {
      logger.info('user ', CustomerID, '  delete map result: msg=', msg, ' error=', err);
    });
  };
};

var onConnect = function onConnect(_ref3) {
  var ns = _ref3.ns,
      io = _ref3.io;

  logger.info('waiting namespace comming from namespace', ns);
  io.of(ns).on('connection', function (socket, msg) {
    logger.info('someone connected....', socket.id, ' --addr: ', socket.handshake.address);
    var CustomerID = socket.request.CustomerID;

    logger.debug('waiting subscribe');
    socket.on('sub', onActionSub({ socket: socket, CustomerID: CustomerID }));
    logger.debug('waiting disconnect');
    socket.on('disconnect', onDisconnect({ socket: socket }));
  });
};

onConnect({ io: io, ns: config.DEFAULT_NS });

//this can be remove if you don't have any static file.
app.use('/html', _express2.default.static(__dirname + '/static'));

//below are the  internal api. 
// const validateInternal = (req, res, next) => {
//   logger.debug('the heads', req.headers)
//   if(req.headers.bhome_key != '7odFgBpj') {
//     res.status(401).send('forbbiden')
//     return
//   }
//   next()
// }

// const sendMsg = (req, res)=>{
//   const {ns, id} = req.params
//   const {msg} = req.query
//   if(!msg) {
//     logger.warn('send a empty mssage. ', ns, id)
//     res.status(400).send('msg in query string should be sent')
//     return
//   }
//   logger.info('msg ', req.query, 'to ', ns, ' of ', id)
//   const sender = id?io.of(ns).to(id):io.of(ns)
//   sender.emit(...((msg instanceof Array)?msg:[msg]))
//   res.json({msg: 'ok'})
// }

// const handerList = (req, res)=>{
//   io.of(req.params.ns||'/').adapter.allRooms((err, rooms) => {
//     res.json({rooms})
//   });
// }

// app.use('/send/:ns', validateInternal, sendMsg)
// app.use('/send/:ns/:id', validateInternal, sendMsg)
// app.use('/list/:ns', validateInternal, handerList)
// app.use(/^\/list\/?$/i, validateInternal, handerList)

//

app.use(function (err, req, res, next) {
  logger.error('app error handler', err.stack);
  next();
});

var httpPort = parseInt(process.argv[2]) || 3105;
server.listen(httpPort, function () {
  logger.info('listening on *:', httpPort);
});