var PORT = 2390;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var msg = ""

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
	msg = message.toString('hex')

    console.log(msg.substr(0,80));
    console.log()

});

server.bind(PORT, HOST);