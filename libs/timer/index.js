'use strict';

module.exports = (name, config) => {
    let _self = {},
        loadedTasks = [];

    const _ = require('lodash'),
        taskTimer = require('tasktimer');

    if (config && !_.isObject(config)) {
        throw new Error('config should be an obeject');
    }

    const timer = new taskTimer(config.interval || 1000);

    systemEvent.on('client-connected', (message) => {
        if (!message || !message.from || message.from !== name) {
            return;
        }

        console.log('events: ' + loadedTasks.join(' '));
        _.each(loadedTasks, (name) => {
            console.log('    Sending: ' + name);
            timer.getTask(name).callback({
                initial: true,
                name: name
            });
        });
    });

    _self.addTask = (task) => {
        loadedTasks.push(task.name);

        task.tickInterval = task.tickInterval || 1;
        task.totalRuns = task.totalRuns || 0;

        timer.addTask(task);
    }

    _self.start = () => {
        timer.start();
    }
    _self.stop = () => {
        timer.stop();
    }

    return _self;
};