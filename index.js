var PORT = 2390;
 var HOST = '192.168.0.51';
//var HOST = '127.0.0.1';
var Color = require('color');

var dgram = require('dgram');



//dont forget that a led needs more than one byte! chunks are strip chunks, packets are data chunks

const STRIP_LENGTH = 600
const BYTES_PER_LED = 3
const STRIP_BUFFER_LENGTH = STRIP_LENGTH * BYTES_PER_LED // we'll use 3 to save space, never turning the 4th one on


const MTU = 1400
const PACKET_SIZE = MTU - 1
const CHUNK_SIZE = Math.floor(PACKET_SIZE / BYTES_PER_LED)

const PACKETS_PER_FRAME = Math.ceil((STRIP_BUFFER_LENGTH / PACKET_SIZE))





var frameTime = 17    


var udpClient = dgram.createSocket('udp4');
var id = setInterval(drawFrame, frameTime);
var id = setInterval(sendFrame, frameTime);

var packetBuffer = Buffer.alloc(MTU)
var blankPacketBuffer = Buffer.alloc(MTU)
var stripBuffer = Buffer.alloc(STRIP_BUFFER_LENGTH);
var blankBuffer = Buffer.alloc(STRIP_BUFFER_LENGTH);
var refreshBuffer = Buffer([0])

var frameCount = 0;

var ledLocation = 0
var offset = 0



var LOG_LEVEL = 2

function log(level,t) {
   // if (level == LOG_LEVEL) {
        console.log(t)
   // }
}

log(1,`${STRIP_LENGTH} Leds, taking up ${STRIP_BUFFER_LENGTH} bytes. Sending ${PACKETS_PER_FRAME} packets per frame. Each packet will be ${PACKET_SIZE}, storing ${CHUNK_SIZE} leds.`)


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
            stripBuffer.copy(packetBuffer,1, currentOffset, currentOffset + PACKET_SIZE);
           
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

    if (frameCount == 460) {
        var a = 1
    } 

    log(1,"sending new frame:")
    var go = Promise.resolve()

    for (var i=1 ; i <= PACKETS_PER_FRAME  ; i++) {
        go = go.then(sendPacket(i))
    }

    go.then(sendRefreshPacket)

    frameCount++

}

function drawFrame(){
     //scrollRainbow(0.4,50,true)
    //scrollRainbow(5,15 ,true) //lots of interesting cycling gradients
    //filterWalk(20)

    //staticRainbow();

    red   = 50
    green = 50
    blue  = 50  
    setAllStatic(red,blue,green)
    filterWalk(10)

    // gradientblend()

    // //chunkTest(0)
    // var c = 100
    // setSingleLed(c,50,255,50)
    // setSingleLed(c+1,50,255,50)
    // setSingleLed(c+2,50,255,50)
    // setSingleLed(c+3,50,255,50)
    // setSingleLed(c+4,255,0,255)
    // setSingleLed(c+5,50,255,50)
    // setSingleLed(c+6,50,255,50)
    // setSingleLed(c+7,50,255,50)
    // setSingleLed(c+8,50,255,50)
}


function chunkTest(){
    blankBuffer.copy(stripBuffer);

    for (var i=1 ; i <= PACKETS_PER_FRAME  ; i++) { 
        var currentOffset = i * PACKET_SIZE - PACKET_SIZE;

                // console.log("strip buffer:");
        for (var j = 0 ; j < 5 * 3 ; j = j + 3) {
            stripBuffer.writeUInt8(7,currentOffset+j);
            stripBuffer.writeUInt8(7,currentOffset+j+1);
            stripBuffer.writeUInt8(7,currentOffset+j+2);

        }
    }
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

function setSingleLed(ledIndex,r,g,b) {
    log(2,`setting led ${ledIndex} to ${r} ${b} ${g}`)
    var byte = ledIndex * BYTES_PER_LED;
    stripBuffer.writeUInt8(r, byte);
    stripBuffer.writeUInt8(r, byte+1);
    stripBuffer.writeUInt8(r, byte+2);
}



function filterWalk(width = 70, speed = 2) {

    ledLocation++
    if (ledLocation >= STRIP_LENGTH) {
        ledLocation = 0
    }


    for (var i = 0 ; i < STRIP_LENGTH; i++ ) {
        if ( i < ledLocation - width/2  ) {
            // log(2,`setting led ${ledLocation} to `)
            
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