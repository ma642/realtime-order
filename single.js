import express from 'express' //require('express')
import socketIO from 'socket.io'
import http from 'http'
import winston from 'winston'
import observer from './observer'
import Redis from 'ioredis';
import cluster from 'cluster'
const os      = require('os');
const numCPUs = os.cpus().length;
const app = express()
const server = http.createServer(app);
const redisAdapter = require('socket.io-redis');

import * as config from './config'

const logger = new winston.Logger({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
      new (winston.transports.Console)({
        colorize: 'all'
      })
    ],
    
  });

const processCustomerMapper = {}

const host = process.argv[4]
const port = parseInt(process.argv[3]) || 16379
const db = 1
const redisOpts = {port, host, db}
const subClient = new Redis(redisOpts);
const pubClient = new Redis(redisOpts);

pubClient.on('error', err=>logger.error('error all ', err));
subClient.on('error', err=>logger.error('error all ', err));

const io = socketIO(server, {
  path: '/realtime-order'
})

//set the redis adapter.
io.adapter(redisAdapter({ pubClient, subClient}));

//const redis = new Redis(process.argv[2]||16379,process.argv[3]);

const parseCookie = (cookie)=>{
  const reg = /(\w+)=(\w+);?/g
  const r = {}
  while(true) {
    const m = reg.exec(cookie)
    if (!m) {
      break
    };
    r[m[1]] = m[2]
  }
  return r
}

//validate token of jwt
//io.use();
const nsUserValidate = (socket, next) => {
  const {cookie} = socket.request.headers
  const cookies = parseCookie(cookie)
  logger.info('some one connected..', cookies, cookies.uuid)
  //mock uuid
  const {uuid} = cookies //req.headers.http_x_annotator_auth_token
  //define error handler
  const whenError = err => {
    logger.error('get error', uuid, err)
    next(err)
  }

  try{
    
    //this is for debug
    if(process.env.NODE_ENV != "production" && !uuid) {
      logger.warn('run at debug, use customerID 13810886181 when uuid is empty')
      socket.request.CustomerID = '13810886181'
      next() 
      return
    }
    //TODO validate token.
    //and map the socket.id to user.
    //you should save this to a cache, such as redis.
    if(!uuid) {
      logger.warn('expect the authenticated user with uuid')
      whenError(new Error('expect the authenticated user with uuid')) 
      return
    }
    pubClient.hget(config.SESSION_SITE_IN_REDIS, uuid, (err, msg)=>{
      if (err) { throw err};
      if (!msg) {
        logger.info('user uuid=', uuid, 'havs not authenticated')
        whenError(Error('user not authenticated. uuid='+uuid))
        return
      };
      const {CustomerID} = JSON.parse(msg)
      socket.request.CustomerID = CustomerID
      next()
    })

  } catch(err) {
    whenError(err)
  }
  
}


const onActionSub = ({socket, CustomerID}) => (msg, cb) => {
  logger.debug('sub:', socket.id, " sub-message:", msg)
  //setTimeout(()=>socket.emit('fine', 'timer'), 2000)
  if (!CustomerID) {
    logger.info('the user sub without loggined. cannot subscribe', socket.id)
    cb&&cb('error', 'no customer id exist.')
    return
  };
  processCustomerMapper[CustomerID] = {
    socketId: socket.id,
    time: new Date()
  }
  
  cb&&cb('ok')
}

const onDisconnect = ({socket}) => () => {
  const {CustomerID} = socket.request
  logger.info(CustomerID, ' : disconnect. socket.id=', socket.id)
  delete processCustomerMapper[CustomerID]
}

const onConnect = ({ns, io})=>{
  logger.info('waiting namespace comming from namespace', ns)
  io.of(ns).use(nsUserValidate)
  io.of(ns).on('connection', function(socket, msg){
      logger.info('someone connected....', socket.id, ' --addr: ', socket.handshake.address);
      const {CustomerID} = socket.request
      logger.debug('waiting subscribe')
      socket.on('sub', onActionSub({socket, CustomerID}))
      logger.debug('waiting disconnect')
      socket.on('disconnect', onDisconnect({socket}));
      
  });
}

onConnect({io, ns:config.DEFAULT_NS})

//this can be remove if you don't have any static file.
app.use('/html', express.static(__dirname + '/static'));

// below are the  internal api. 
const validateInternal = (req, res, next) => {
  logger.debug('the heads', req.headers)
  if(req.headers.bhome_key != '7odFgBpj') {
    res.status(401).send('forbbiden')
    return
  }
  next()
}

app.use(/\/client\/?/, validateInternal, (req, res)=>{
  res.json(processCustomerMapper)
})
app.use('/client/:CustomerID', validateInternal, (req, res)=>{
  res.json(processCustomerMapper[req.params.CustomerID])
})

observer({
  subClient,
  getSocket: (CustomerID)=>{
    return new Promise((resolve, reject)=>{
      const socketInfo = processCustomerMapper[CustomerID]
      logger.debug('getSocket of ', CustomerID, ' result: ', socketInfo)
      resolve(socketInfo && socketInfo.socketId)
    })
  },
  socket: io.of(config.DEFAULT_NS),
}, (err)=>{
  err && logger.error('error to start watcher', err)
  !err && logger.info('start watch :', host, port)
})


app.use(function (err, req, res, next) {
  logger.error('app error handler', err.stack)
  next()
})

const httpPort = parseInt(process.argv[2]) || 3105
server.listen(httpPort, function(){
  logger.info('listening on *:', httpPort);
});
