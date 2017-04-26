'use strict';

module.exports = (() => {

    const socket = require('socket.io');

    const config = require('../../config');

    const io = socket(config.port);

    io.on('connection', (socket) => {
        socket.on('server', (message) => {
            console.log('Client has sent:', message);
            setTimeout(() => {
                systemEvent.emit('client-connected', message);
            }, 750);
        });

        socket.on('disconnecting', (reason) => {
            console.log('disconnecting: ', reason);
        });

        socket.on('disconnect', (reason) => {
            console.log('disconnected: ', reason);
        });
    });

    let _self = {};

    _self.room = (room) => {
        return (key, message) => {
            io.volatile.emit(room, {
                key: key,
                message: message
            });
        }
    }

    return _self;
})();
