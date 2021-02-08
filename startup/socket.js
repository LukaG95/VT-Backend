module.exports = function (app, server) {
    const io = require("socket.io")(server);

    io.on("connection", (socket) => {
        console.log("new connection");
    });

    app.set("socket", io);
    //var socket = req.app.get('socket');
};
