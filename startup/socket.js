const authController = require('../Controllers/authController');
const logger = require('./logging')

module.exports = function (app, port) {
    // let app = require('express')();
    const http = require('http').createServer(app);
    const io = require('socket.io')(http);

    io.sendMessage = sendMessage;

    io.on('connection', async (socket) => {
        // io.connections['test'] = socket;
        console.log('a user connected');
        // console.log(socket);
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        let cookies;
        let userId;

        if (socket.handshake.headers.cookie) cookies = parseCookie(socket.handshake.headers.cookie);
        if (cookies && cookies.jwt) userId = await authController.getUserIdFromJwt(cookies.jwt);

        if (!userId) {
            socket.emit('auth', 'failure');
            return socket.disconnect();
        }

        socket.shouldDisconnect = false;
        socket.join(userId);
        socket.emit('auth', 'success');

        console.log(`Authorized ${userId}`);
    });

    http.listen(port, () => {
	  console.log(`listening on *:${port}`);
    });

    app.set('socket', io);
    // let socket = req.app.get('socket');
};

function sendMessage(recipientId, messageObj) {
    this.to(recipientId).emit('message/new', messageObj);
}

function parseCookie(cookie) {
    cookie = cookie.split('; ').join(';');
    cookie = cookie.split(' =').join('=');
    cookie = cookie.split(';');

    const object = {};
    for (let i = 0; i < cookie.length; i++) {
        cookie[i] = cookie[i].split('=');
        object[cookie[i][0]] = decodeURIComponent(cookie[i][1]);
    }
    return object;
}
