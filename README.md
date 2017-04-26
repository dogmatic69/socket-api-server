Socket API Server [WIP]

I built this because I needed an easy way to unify lots of different API's into a single API for my home automation project.

Home automation generally contains multiple diffenret data streams that can be fed to multiple different locations. The other hard requirement is that it needs to be instant. For this reason sockets are used so that data can be pushed to clients.

To make it DRY and maintainable I built this pluggable API server that I can pass modules to with a set signature that would deal with generating the data. The server deals with triggering the services at appropriate times based on config similar to a cronjob and uses sockets to push the data to a client where required.


```

DATA INPUT                      ABSTRACTION                     DATA OUTPUT

                                                             |---- Website
Open Weather ------|                                         |
                   |                                         |---- Push notifications
Website Scraper ---|                                         |
                   |-- <=> Socket API Server <=> cache <=> --|---- TV on screen notification
Amazon Alexa ------|                                         |
                   |                                         |---- Magic mirror
Any other service -|                                         |
                                                             |---- any other output

```
Example Usage:

```
'use strict';

const SocketApi = require('socket-api-server');

SocketApi.server.addConnector(
    'hello-world', // unique name for the connector
    taskConfig, // config the task
    (createTask, emitter) => createTask('hello.world', (task) => {
        // this callback is run by the API tasker per the configuration provided.
        return new Promise((resolve, reject) => {
            if (task.initial) {
                console.log("Seding initial data: ", data);
            }
            return emitter(task.name, data);
        });
    })
);
```

`addConnector` basically registers the provided callback and runs it periodically based on the specified `taskConfig`. Within the callback you would include any other libs and do API requests to get the data that is needed. It's up to the callback to run the emit any data that should be sent.

The `task` passed in is the object describing the current task
The `emitter` passed to the connector callback is a pre-configured wrapper to `socket-io.volatile.emit()`