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

var io = require('socket.io-emitter')(pubClient);
const ns = io.of('/bhome')

//=================main here
observer({
	subClient,
	pubClient,
	socket: io.of(config.DEFAULT_NS)
}, (err)=>{
	logger.error('error to start watcher', err)
})