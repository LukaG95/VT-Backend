const authController = require('../Controllers/authController');

module.exports = function(app, port){
	//let app = require('express')();
	let http = require('http').createServer(app);
	let io = require('socket.io')(http);

	io.sendMessage = sendMessage;
	
	io.on('connection', (socket) => {
	  //io.connections['test'] = socket;
	  console.log('a user connected');
	  //console.log(socket);
	  socket.on('disconnect', () => {
		console.log('user disconnected');
	  });
	  
	  socket.shouldDisconnect = true;
	  setTimeout(() => { if(socket.shouldDisconnect) socket.disconnect(); }, 10 * 1000);
	  
	  socket.on('auth', (jwt) => {
		  try{
			  authController.getUserIdFromJwt(jwt, (userId) => {
				  if(!userId){
					socket.emit('auth', 'failure');
					return socket.disconnect();
				  }
				  socket.shouldDisconnect = false;
				  socket.join(userId);
				  socket.emit('auth', 'success');
			  });
		  }
		  catch{
			socket.emit('auth', 'failure');
			return socket.disconnect();
		  }
	  });
	});

	http.listen(port, () => {
	  console.log('listening on *:'+port);
	});
	
	app.set('socket', io);
	//let socket = req.app.get('socket');
}

function sendMessage(senderId, recipientId, message){
	this.to(recipientId).emit('message/new', {senderId: senderId, message: message});
}