const authController = require('../Controllers/authController');

module.exports = function(app, port){
	//let app = require('express')();
	let http = require('http').createServer(app);
	let io = require('socket.io')(http);

	io.sendMessage = sendMessage;
	
	io.on('connection', (socket) => {
	  //io.connections['test'] = socket;
	  console.log('a user connected');
	  console.log(socket);
	  socket.on('disconnect', () => {
		console.log('user disconnected');
	  });
	  
	  socket.shouldDisconnect = true;
	  setTimeout(() => { if(socket.shouldDisconnect) socket.disconnect(); }, 10 * 1000);
	  
	  socket.on('auth', (cookies) => {
		  try{
			  authController.protect({user: cookies.user, cookies: cookies}, null, () => {
				  socket.shouldDisconnect = false;
				  socket.join(cookies.user);
				  socket.emit('auth', 'success');
			  });
		  }
		  catch{
			socket.emit('auth', 'failure');
			socket.disconnect();
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