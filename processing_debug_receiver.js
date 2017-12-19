
var jpg = require('jpeg-turbo')


var PORT = 9100;
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

	var time = process.hrtime()


	var options = {
	  format: jpg.FORMAT_RGB,
	}

	var decoded = jpg.decompressSync(message, options)

    // console.log(msg.substr(0,80));
    console.log(decoded.data)

});

server.bind(PORT, HOST);