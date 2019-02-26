const express = require('express');
const app = express();
const httpServer = require('http').Server(app);
const io = require('socket.io')(httpServer);
const path = require('path');

const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

// IO Connections
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('signal', (msg) => {
        socket.broadcast.emit('signal', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

httpServer.listen(port, () => console.log(`Server Listening on port ${port}`));