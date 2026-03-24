const jwt = require("jsonwebtoken");

function authenticateSocket(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Missing token"));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return next(new Error("Invalid token"));
        socket.data.user = user;
        next();
    });
}

module.exports = authenticateSocket;
