// var frameSource = require('./processingUDPServer.js');
var StripController = require('./stripController.js');
var ProcessingServer = require('./processingServer.js');

var strip1Length = 100;
var strip2Length = 100;


var strip1 = new StripController("192.168.0.53" , 2390, strip1Length, 66.666);
var strip2 = new StripController("192.168.0.52" , 2390, strip2Length, 66.666);

var strip1Buffer = strip1.getStripBuffer();
var strip2Buffer = strip2.getStripBuffer();

var processingServer = new ProcessingServer("127.0.0.1" , 9100, (frame)=>{
	frame.copy(
		strip1Buffer,   //target
		0,			    //target start
		0,			    //source start
		strip1Length*3 //source end
	);
	frame.copy(
		strip2Buffer, //target
		0,
		strip1Length*3,
		(strip2Length+strip1Length)*3
	);
})

// var color = [180,1,255]

// function drawFrame(){
// 	strip2.setAllStatic(color[0],color[1],color[2]);
// 	strip1.setAllStatic(color[0],color[1],color[2]);
	

// // 	color[0] = color[0] + 1;
// // 	color[1] = color[1] + 3;
// // 	color[2] = color[2] + 5;

// // 	if (color[0] > 254) color[0] = 60
// // 	if (color[1] > 254) color[1] = 60
// // 	if (color[2] > 254) color[2] = 60
// // }
// }

// var id = setInterval(drawFrame, 100);