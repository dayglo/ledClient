// var frameSource = require('./processingUDPServer.js');
var StripController = require('./stripController.js');


var strip1 = new StripController("192.168.0.53" , 2390, 605, 66.6666);
var strip2 = new StripController("192.168.0.52" , 2390, 484, 66.6666);

var color = [1,1,1]

function drawFrame(){
	strip1.setAllStatic(color[0],color[1],color[2]);
	strip2.setAllStatic(color[0],color[1],color[2]);

	color[0] = color[0] + 1;
	color[1] = color[1] + 3;
	color[2] = color[2] + 5;

	if (color[0] > 254) color[0] = 0
	if (color[1] > 254) color[1] = 0
	if (color[2] > 254) color[2] = 0
}

var id = setInterval(drawFrame, 66.6666);