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


function sendFrame() {
    
    packetBuffer.writeUInt8(1, 0)
    stripBuffer.copy(packetBuffer,1,0);
    console.log(packetBuffer)
    udpClient.send(packetBuffer, 0, UDP_PACKET_SIZE, PORT, HOST, (err)=>{
        udpClient.send(refreshBuffer, 0, 1, PORT, HOST)
    })
}


function drawFrame(){
    walk()
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


function sine1(){

    // var color = Color('#7743CE').alpha(0.5).lighten(0.5);
    //Math.sin(Math.PI / 2); // 1
    
    stripBuffer.writeUInt8(0, i);

    var frequency = .3;
    for (var i = 1; i <= BUFFER_LENGTH ; i = i + 3)
    {
        red   = Math.sin(frequency*i + 0) * 127 + 128;
        green = Math.sin(frequency*i + 2) * 127 + 128;
        blue  = Math.sin(frequency*i + 4) * 127 + 128;
        try {
            // console.log(red)
            stripBuffer.writeUInt8(red, i-3);
            stripBuffer.writeUInt8(green, i-2);
            stripBuffer.writeUInt8(blue, i-1);
        } catch (e) {
            console.error(e)
        }
    }

    client.send(  stripBuffer.slice(1, CHUNK_SIZE)                , 0, UDP_PACKET_SIZE, PORT, HOST )
    client.send(  stripBuffer.slice(CHUNK_SIZE, CHUNK_SIZE * 2) , 0, UDP_PACKET_SIZE, PORT, HOST )
    client.send(  stripBuffer.slice(CHUNK_SIZE*2, CHUNK_SIZE*3) , 0, UDP_PACKET_SIZE, PORT, HOST )
    client.send(  stripBuffer.slice(CHUNK_SIZE*3, CHUNK_SIZE*4) , 0, UDP_PACKET_SIZE, PORT, HOST )


}

// var client2 = dgram.createSocket('udp4');
// client2.send(message, 0, message.length, PORT, "127.0.0.1", function(err, bytes) {
//     if (err) throw err;
//     console.log('UDP message sent to ' + HOST +':'+ PORT);
//     client2.close();
// });

        // for(int i=0; i< numPixels(); i++)
        // {
        //     setPixelColor(i, Wheel(((i * 256 / numPixels()) + Index) & 255));
        // }
        // show();
        // Increment();


const now=(unit)=>{
    const hrTime=process.hrtime(); 
    switch (unit) {
    case 'milli':return hrTime[0] * 1000 + hrTime[1] / 1000000;
    case 'micro':return hrTime[0] * 1000000 + hrTime[1] / 1000;
    case 'nano':return hrTime[0] * 1000000000 + hrTime[1] ;
    break;
    default:return hrTime[0] * 1000000000 + hrTime[1] ;
    }
}
