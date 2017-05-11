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
var id = setInterval(drawFrame, frameTime  );
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
    //console.log(packetBuffer)
    udpClient.send(packetBuffer, 0, UDP_PACKET_SIZE, PORT, HOST, (err)=>{
        udpClient.send(refreshBuffer, 0, 1, PORT, HOST)
    })
}

function drawFrame(){
     //scrollRainbow(0.4,50,true)

    scrollRainbow(0,10,false) //lots of interesting cycling gradients
    filterWalk(10)

    //staticRainbow();

    // red   = 30
    // green = 70
    // blue  = 60
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
    if (ledLocation >= STRIP_LENGTH*3) {
        ledLocation = 0
    }
}

function filterWalk(width = 70, speed = 2) {

    ledLocation++
    if (ledLocation >= STRIP_LENGTH) {
        ledLocation = 0
    }

    for (var i = 0 ; i < STRIP_LENGTH; i++ ) {
        if ( i < ledLocation - width/2  ) {
            
            stripBuffer.writeUInt8(0, i*3);
            stripBuffer.writeUInt8(0, i*3+1);
            stripBuffer.writeUInt8(0, i*3+2);
        }

        if ( i > ledLocation + width/2  ) {
            
            stripBuffer.writeUInt8(0, i*3);
            stripBuffer.writeUInt8(0, i*3+1);
            stripBuffer.writeUInt8(0, i*3+2);
        }
    }

}

function filterFade(){

    //read buffer into array 

    for (var i = 0 ; i < strip.length ; i++) {
        try {
            // console.log(red)
            stripBuffer.writeUInt8(strip[i][0], i*3);
            stripBuffer.writeUInt8(strip[i][1], i*3+1);
            stripBuffer.writeUInt8(strip[i][2], i*3+2);
        } catch (e) {
            console.error("error setting at " + i + " - " + e)
        }
    }

}
function staticRainbow(rainBowWidth = 130){

    var frequency = 0.3;
    var strip =  makeColorGradient(1/rainBowWidth,1/rainBowWidth,1/rainBowWidth);
    // console.log(strip[0],strip[239]);
    updateLeds(strip)  

}

function makeColorGradient( frequency1 = 0.3, 
                            frequency2 = 0.3, 
                            frequency3 = 0.3,
                            phase1 = 0, 
                            phase2 = 2, 
                            phase3 = 4,
                            center = 128, 
                            width = 127, 
                            len = 240
                            ){
    var grad = []

    for (var i = 0; i < len; ++i)
    {
        var red = Math.sin(frequency1*i + phase1) * width + center;
        var grn = Math.sin(frequency2*i + phase2) * width + center;
        var blu = Math.sin(frequency3*i + phase3) * width + center;
        grad.push([red,grn,blu])
    }
    return grad
}

function scrollRainbow(scrollSpeed = 1, rainBowWidth = 0.3 , warp = false){
    
    //scrollspeed 0.4 is where the scroll gets noticable
    //30 is still perceptible
    // 60 is flashing, but you see the colours when you blink

    var timeSecs = now('millis')/1000000000;
    time = timeSecs * scrollSpeed;  

    var rWarp = 1;
    var gWarp = 1;
    var bWarp = 1;

    if (warp){
        rWarp = 1;
        gWarp = 1.1;
        bWarp = 0.95;
    }

    var strip =  makeColorGradient(     2*Math.PI/rainBowWidth*(0.3+rWarp-0.7)*rWarp,
                                        2*Math.PI/rainBowWidth*(0.3+gWarp-0.7)*gWarp,
                                        2*Math.PI/rainBowWidth*(0.3+bWarp-0.7)*bWarp,
                                        0+time,
                                        2+time,
                                        4+time
                                        // 100,
                                        // 55
                                    );
    updateLeds(strip)                              
}

function updateLeds(strip){
    for (var i = 0 ; i < strip.length ; i++) {
        try {
            // console.log(red)
            stripBuffer.writeUInt8(strip[i][0], i*3);
            stripBuffer.writeUInt8(strip[i][1], i*3+1);
            stripBuffer.writeUInt8(strip[i][2], i*3+2);
        } catch (e) {
            console.error("error setting at " + i + " - " + e)
        }
    }
}