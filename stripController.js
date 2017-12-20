// var Color = require('color');
var dgram = require('dgram');


var StripController = function (HOST, PORT, STRIP_LENGTH, FRAME_RATE) {
	var obj = {}
   
	const BYTES_PER_LED = 3
	const STRIP_BUFFER_LENGTH = STRIP_LENGTH * BYTES_PER_LED // we'll use 3 to save space, never turning the 4th one on


	const MTU = 1400
	const PACKET_SIZE = (MTU - 1) - ((MTU - 1) % BYTES_PER_LED)

	const CHUNK_SIZE = Math.floor(PACKET_SIZE / BYTES_PER_LED)
	const PACKETS_PER_FRAME = Math.ceil((STRIP_BUFFER_LENGTH / PACKET_SIZE))

	var udpClient = dgram.createSocket('udp4');

	var id = setInterval(sendFrame, FRAME_RATE);

	var packetBuffer = Buffer.alloc(MTU)
	var blankPacketBuffer = Buffer.alloc(MTU)
	var stripBuffer = Buffer.alloc(STRIP_BUFFER_LENGTH);
	var blankBuffer = Buffer.alloc(STRIP_BUFFER_LENGTH);
	var refreshBuffer = Buffer([0])

	var frameCount = 0;

	var ledLocation = 0
	var offset = 0

	function log(level,t) {
		console.log(HOST + ":" + t)
	}

	function sendRefreshPacket(){
		udpClient.send(refreshBuffer, 0, 1, PORT, HOST)
		frameCount++;
	}

	function sendPacket(packetNumber) {
		return ()=>{
			return new Promise((resolve,reject)=>{

				var currentOffset = packetNumber * PACKET_SIZE - PACKET_SIZE;
				
				blankPacketBuffer.copy(packetBuffer);
				packetBuffer.writeUInt8(packetNumber, 0) //set the first byte to the ACTION byte
				stripBuffer.copy(packetBuffer,1, currentOffset, currentOffset + PACKET_SIZE );
			   
				log(1,"   frame:" + frameCount + "     packet:" + packetNumber + "   offset: " + currentOffset)
				log(1,packetBuffer.toString('hex').substr(0,100))

				udpClient.send(packetBuffer, 0, MTU, PORT, HOST, (err)=> {
					if (err) {
						reject(err)
					} else {
						resolve()
					}
				} )
			})
		}
	}

	function sendFrame() {

		//log(1,"sending new frame:")
		var go = Promise.resolve()

		for (var i=1 ; i <= PACKETS_PER_FRAME  ; i++) {
			go = go.then(sendPacket(i))
		}

		go.then(sendRefreshPacket)

	}

	obj.setAllStatic = (red,blue,green) => {

		for (var i = 0; i <= (STRIP_LENGTH*3)-3 ; i = i + 3)
		{
			try {
				// console.log(red)
				stripBuffer.writeUInt8(red, i);
				stripBuffer.writeUInt8(green, i+1);
				stripBuffer.writeUInt8(blue, i+2);
			} catch (e) {
				console.error("error setting at " + i + " - " + e)
			}
		}
	}

	obj.setSingleLed = (ledIndex,r,g,b) => {
		//log(2,`setting led ${ledIndex} to ${r} ${b} ${g}`)
		var byte = ledIndex * BYTES_PER_LED;
		stripBuffer.writeUInt8(r, byte);
		stripBuffer.writeUInt8(r, byte+1);
		stripBuffer.writeUInt8(r, byte+2);
	}

	obj.updateLeds = (strip) => {
		for (var i = 0 ; i < strip.length ; i++) {
			try {
				// console.log(red)

				// this needs editing to copy strip into stripbuffer directly
				stripBuffer.writeUInt8(strip[i][0], i*3);
				stripBuffer.writeUInt8(strip[i][1], i*3+1);
				stripBuffer.writeUInt8(strip[i][2], i*3+2);
			} catch (e) {
				console.error("error setting at " + i + " - " + e)
			}
		}
	}

	obj.updateBytes = (frame) => {
		frame.copy(stripBuffer,0, 0, 600 );
	}

	obj.getStripBuffer = () => {return stripBuffer}

	log(1,`${STRIP_LENGTH} Leds, taking up ${STRIP_BUFFER_LENGTH} bytes. Sending ${PACKETS_PER_FRAME} packets per frame. Each packet will be ${PACKET_SIZE}, storing ${CHUNK_SIZE} leds.`)
	sendFrame();


	return obj;
};


module.exports = StripController;
