var PORT = 2390;
var HOST = '192.168.0.51';
var Color = require('color');

var dgram = require('dgram');

const CHUNK_SIZE = 240
const STRIP_LENGTH = 240
const CHUNKS_PER_STRIP = (STRIP_LENGTH / CHUNK_SIZE)
const UDP_PACKET_SIZE = 1 + (CHUNK_SIZE*3) // 1 is so we can fit the action code in at the beginning of the packet.

var frameTime = 16.666666

var udpClient = dgram.createSocket('udp4');
var id = setInterval(drawFrame, frameTime );
var id = setInterval(sendFrame, frameTime);

var packetBuffer = Buffer.alloc(UDP_PACKET_SIZE)
var stripBuffer = Buffer.alloc(STRIP_LENGTH*3);
var blankBuffer = Buffer.alloc(UDP_PACKET_SIZE);
var refreshBuffer = Buffer([0])

var ledLocation = 0
var offset = 0

function now(unit){
    var hrTime=process.hrtime(); 
    switch (unit) {
    case 'milli':return hrTime[0] * 1000 + hrTime[1] / 1000000;
    case 'micro':return hrTime[0] * 1000000 + hrTime[1] / 1000;
    case 'nano':return hrTime[0] * 1000000000 + hrTime[1] ;
    break;
    default:return hrTime[0] * 1000000000 + hrTime[1] ;
    }
}

function sendFrame() {
    
    packetBuffer.writeUInt8(1, 0)
    stripBuffer.copy(packetBuffer,1,0);
    console.log(packetBuffer)
    udpClient.send(packetBuffer, 0, UDP_PACKET_SIZE, PORT, HOST, (err)=>{
        udpClient.send(refreshBuffer, 0, 1, PORT, HOST)
    })
}


function drawFrame(){
    crazy()

    // red   = 200
    // green = 50
    // blue  = 200
    // setAllStatic(red,blue,green)

    // gradientblend()
}

function setAllStatic(red,blue,green){

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

function walk(){

    blankBuffer.copy(stripBuffer);

    console.log("strip buffer:");
    stripBuffer.writeUInt8(100,ledLocation);
    stripBuffer.writeUInt8(200,ledLocation+1);
    stripBuffer.writeUInt8(255,ledLocation+2);

    console.log("setting led at location " + ledLocation);

    ledLocation = ledLocation + 3;
    if (ledLocation >= STRIP_LENGTH) {
        ledLocation = 0
    }
}

function staticRainbow(){ 

    var frequency = 0.3;
    for (var i = 0; i <= (STRIP_LENGTH*3)-3 ; i = i + 3)
    {
        red   = Math.sin(frequency*i + 0) * 127 + 128;
        green = Math.sin(frequency*i + 2) * 127 + 128;
        blue  = Math.sin(frequency*i + 4) * 127 + 128;
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

function crazy(){

    var timeSecs = now('millis')/1000000000;

    time = timeSecs * 2 % 30;

    var frequency = 0.1;
    for (var i = 0; i <= (STRIP_LENGTH*3)-3 ; i = i + 3)
    {
        red   = Math.sin(frequency*i*time + 0) * 127 + 128;
        green = Math.sin(frequency*i*time + 2) * 127 + 128;
        blue  = Math.sin(frequency*i*time + 4) * 127 + 128;
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



var colors = new Array(
  [62,35,255],
  [60,255,60],
  [255,35,98],
  [45,175,230],
  [255,0,255],
  [255,128,0]);

var step = 0;
//color table indices for: 
// current color left
// next color left
// current color right
// next color right
var colorIndices = [0,1,2,3];

//transition speed
var gradientSpeed = 0.002;
var colorArray = []

function gradientblend()
{

	var c0_0 = colors[colorIndices[0]];
	var c0_1 = colors[colorIndices[1]];
	var c1_0 = colors[colorIndices[2]];
	var c1_1 = colors[colorIndices[3]];

	var istep = 1 - step;
	var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
	var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
	var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
	var color1 = "rgb("+r1+","+g1+","+b1+")";

	var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
	var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
	var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
	var color2 = "rgb("+r2+","+g2+","+b2+")";

	colorArray = generateColorGradientArray([r1,g1,b1],[r2,g2,b2],STRIP_LENGTH)

	
	step += gradientSpeed;
	if ( step >= 1 )
	{
		step %= 1;
		colorIndices[0] = colorIndices[1];
		colorIndices[2] = colorIndices[3];
		
		//pick two new target color indices
		//do not pick the same as the current one
		colorIndices[1] = ( colorIndices[1] + Math.floor( 1 + Math.random() * (colors.length - 1))) % colors.length;
		colorIndices[3] = ( colorIndices[3] + Math.floor( 1 + Math.random() * (colors.length - 1))) % colors.length;
		
	}
}



function generateColorGradientArray(start,end,len){
    var arr = new Array(len);
	//Alpha blending amount
	var alpha = 0.0;
	
	for (i = 0; i < len; i++) {
		var c = [];
		alpha += (1.0/len);
		
		c[0] = start[0] * alpha + (1 - alpha) * end[0];
		c[1] = start[1] * alpha + (1 - alpha) * end[1];
		c[2] = start[2] * alpha + (1 - alpha) * end[2];

        arr[i] = c
		
	}
	return arr;
}
