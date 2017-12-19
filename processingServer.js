var jpg = require('jpeg-turbo')
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

var processingServer = function (HOST, PORT, cb) {
	var obj = {}
	
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

	    cb(decoded.data)

	});

	server.bind(PORT, HOST);

}


module.exports = processingServer;
