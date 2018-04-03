var io = require('socket.io-emitter')({ host: '127.0.0.1', port: 6379 });
const ns = io.of('/bhome')

const to = process.argv[2]
console.log('send to : ', to)
if(to) {
	setInterval(function(){
	  ns.to(to).emit('fine', "***" + new Date);
	}, 500);
} else {
	console.error('there is not user to emit to')
}


setInterval(function(){
	  ns.emit('fine', new Date);
	}, 5000);