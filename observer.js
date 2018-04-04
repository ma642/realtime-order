import winston from 'winston'
import Redis from 'ioredis'
import * as config from './config'
import cluster from 'cluster'
/**

	Here we just subscribe the message and send to the front end.

*/

const logger = new winston.Logger({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
      new (winston.transports.Console)({
        colorize: 'all'
      })
    ],
    
  });


const start =  ({socket, subClient, pubClient, workerId}, cb) =>{
	logger.info("watch redis port: ")

	subClient.subscribe('CustomerChannel', function (err, count) {
	  // Now we are subscribed to both the 'news' and 'music' channels.
	  // `count` represents the number of channels we are currently subscribed to.
	 	logger.info('subscribed', err, count)
	});
	 
	subClient.on('message', function (channel, message) {
	  logger.debug('Receive message %s from channel %s', message, channel);
	  if (message && message[0] != '{') {
	  	logger.warn('expect the message is json type')
	  	return
	  };
	  try {
	  	const msg = JSON.parse(message)
	  	if(msg.type != 'order') {
	  		logger.debug('get trade type')
	  		return
	  	}
	  	const {CustomerID} = msg.data || {}
	  	if(!CustomerID) {
	  		logger.warn('empty of CustomerID', msg)
	  		return
	  	}
	  	const dealError = (err)=>{
		  	logger.error('user for ', CustomerID , 'msg :', msg, err)
	  	}
	  	pubClient.hget(config.USER_SOCKET_MAP_REDIS , CustomerID).then((socketId) => {
		  logger.debug('get socket from CustomerID', CustomerID, ' to ', socketId);
		  if(!socketId ) {
		  	dealError(new Error('empty of CustomerID ' + CustomerID))
		  	return
		  }
		  //emit message to front end.
		  socket.to(socketId).emit('order', msg.data);
		}).catch(err=>{
			dealError(err)
		});

	  }catch(e) {
	  	logger.error('error when parse json from message', e)
	  }
	  
	});

	cb&&cb()
}

export default start
