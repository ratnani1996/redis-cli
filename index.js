const net = require('net');
const Parser = require('redis-parser');

const store = {};

const server = net.createServer((connection) => {
    console.log('Client connected 1');
    connection.on('connect', () => console.log('Client connected...'))
    connection.on('data', data => {
        // @ts-ignore
        const newParser = new Parser({
            returnReply: function (reply) {
                const command = reply[0];
                if (command == 'set') {
                    const key = reply[1];
                    const value = reply[2];
                    const expiration = reply.length > 2 && reply[3]
                    store[key] = value;
                    connection.write('+OK\r\n');
                }
                else if (command == 'get') {
                    const value = reply[1];
                    const redisValue = store[value];
                    if (redisValue) connection.write(`+${redisValue}\r\n`);
                    else connection.write(`$-1\r\n`)
                }
                else if (command == 'listkeys') {
                    for (let key in Object.keys(store)) {
                        connection.write(`+${key}\r\n`);
                    }
                }
                else {
                    connection.write('+Invalid Argument\r\n');
                }
            },
            returnError: (error) => {
                console.log('error is', error);
            },
            returnBuffers: false,
            stringNumbers: false
        });
        // console.log(data.toString());
        newParser.execute(data);
    });

    connection.on('close', () => console.log('Connection closed'));
})

server.listen('8000', () => console.log('Redis server started'));