'use strict';

module.exports = (() => {
    let _self = {};

    const Timer = require('../timer'),
        events = require('events'),
        socket = require('../socket');

    global.systemEvent = new events.EventEmitter();

    let services = {};

    const taskBuilder = (name, callback) => {
        const timer = Timer(name, {
            interval: 1000 * 30
        });

        timer.addTask({
            name: name,
            callback: callback
        });
    }

    _self.addConnector = (name, config, connector) => {
        console.log('Initialising: ' + name);
        const emitter = socket.room(name);
        services[name] = connector(taskBuilder, emitter);
    }

    _self.start = (name) => {
        console.log('Starting: ' + name);
        services[name].start();
    }

    _self.stop = (name) => {
        console.log('Stopping: ' + name);
        services[name].stop();
    }

    return _self;
})();