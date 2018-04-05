import socketIO from 'socket.io'
import winston from 'winston'
import Redis from 'ioredis';
import observer from './observer'
import * as config from './config.js'

const logger = new winston.Logger({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
      new (winston.transports.Console)({
        colorize: 'all'
      })
    ],
    
  });

const host = process.argv[3] || "127.0.0.1"
const port = parseInt(process.argv[2]) || 6379
const db = 1
const redisOpts = {port, host, db}
const subClient = new Redis(redisOpts);
const pubClient = new Redis(redisOpts);
logger.info('host:', host, ':' , port)
var io = require('socket.io-emitter')(pubClient);
const ns = io.of(config.DEFAULT_NS)

//=================main here
observer({
	subClient,
	getSocket: subClient.hget.bind(null, config.siteMap()),
	socket: ns,
}, (err)=>{
	err && logger.error('error to start watcher', err)
	!err && logger.info('start watch :', host, port)
})