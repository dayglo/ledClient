// include some libraries
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h> //MDB
#include <WiFiUdp.h>

//#include <NeoPixelBus.h>
#include <NeoPixelBrightnessBus.h> // instead of NeoPixelBus.h

// I have not tried   more than 512 succesfully at 60 fps
// but I get glitching and stuttering and not sure where the bottleneck is exactly.
// at 30 fps I can go past this number succesfully though.
#define PIXELS_PER_STRIP 600 //240

// This represents how large our packets are that we send from our software source IN TERMS OF LEDS.
#define CHUNK_SIZE 466  //240

#define BYTES_PER_LED = 3
 
#define MAX_ACTION_BYTE 4  //maximum number of chunks per frame in order to validate we do not receive a wrong index when there are communciation errors

// Dynamically limit brightness in terms of amperage.
#define AMPS 4


#define UDP_PORT 2390
#define UDP_PORT_OUT 2391


// NETWORK_HOME
IPAddress local_ip(192, 168, 0, 51);
IPAddress gateway(192, 168, 0, 1);
//IPAddress local_ip(192, 168, 1, 90);//MDB
//IPAddress gateway(192, 168, 1, 1); //MDB
IPAddress subnet(255, 255, 255, 0);
char ssid[] = "VM1728301";  //  your network SSID (name)
char pass[] = "3cccgpMRfqyf";       // your network password

//char ssid[] = "AL WiFi";  //  your network SSID (name)
//char pass[] = "magicssssss";       // your network password


// If this is set to 1, a lot of debug data will print to the console.
// Will cause horrible stuttering meant for single frame by frame tests and such.
#define DEBUG_MODE 0 //MDB
#define PACKETDROP_DEBUG_MODE 0


//#define pixelPin D4  // make sure to set this to the correct pin, ignored for UartDriven branch
const uint8_t PixelPin = 2;
//NeoPixelBus<NeoGrbFeature, NeoEsp8266Dma800KbpsMethod> strip(PIXELS_PER_STRIP, PixelPin);
NeoPixelBrightnessBus<NeoGrbwFeature, NeoEsp8266Dma800KbpsMethod> strip(PIXELS_PER_STRIP);
NeoGamma<NeoGammaTableMethod> colorGamma;

// holds chunksize x 3(chans per led) + 1 "action" byte
#define UDP_PACKET_SIZE ((CHUNK_SIZE*3)+1)
byte packetBuffer[ UDP_PACKET_SIZE]; //buffer to hold incoming and outgoing packets
RgbColor ledDataBuffer[ PIXELS_PER_STRIP];
byte r;
byte g;
byte b;

byte action;

// used later for holding values - used to dynamically limit brightness by amperage.
RgbColor prevColor;
int milliAmpsLimit = AMPS * 1000;
int milliAmpsCounter = 0;
byte millisMultiplier = 0;

// A UDP instance to let us send and receive packets over UDP
WiFiUDP udp;

//WiFiServer instance to query the module for status or to send commands to change some module settings //MDB
ESP8266WebServer server(80);

// Reply buffer, for now hardcoded but this might encompass useful data like dropped packets etc.
byte ReplyBuffer[] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
byte counterHolder = 0;

//last number of frames to monitor monitoring //MDB
int const framesToMonitor = 300; //monitor last 5 seconds
int frameNumber = 0;
int frameLimit = 6000;
int frameIndex = 0;
int oldestFrameIndex = 0;
byte part = 0;

struct framesMetaData {
  unsigned int frame;
  byte part;
  long arrivedAt;
  int packetSize;
  int power;
  int adjustedPower;
  long processingTime;
} framesMD[framesToMonitor];



long blankTime;
long processingTime;
long arrivedAt;

void setup() {

  ////////////////// A whole bunch of initialization stuff that prints no matter what.
  Serial.begin(115200);
  Serial.println();
  Serial.println();

  // We start by connecting to a WiFi network
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, pass);
  WiFi.config(local_ip, gateway, subnet);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");

  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Starting UDP");
  udp.begin(UDP_PORT);
  Serial.print("Local port: ");
  Serial.println(udp.localPort());
  Serial.print("Expected packagesize:");
  Serial.println(UDP_PACKET_SIZE);

  Serial.println("Setup done");
  Serial.println("");
  Serial.println("");
  Serial.println("");

  // Initial full black strip push and init.
  blankTime = micros();
  strip.Begin();
  for (uint16_t i = 0; i < PIXELS_PER_STRIP; i++) {
    strip.SetPixelColor(i, RgbColor(0, 0, 0));
    ledDataBuffer[i] = RgbColor(0, 0, 0);
  }
  strip.Show();
  blankTime = micros() - blankTime;

  // here we place all the different web services definition
  server.on("/getstatus", HTTP_GET, []() {
    // build Javascript code to draw SVG wifi graph
    String r = "<html><body>";
    r += "Connected to:" + String(ssid) + "<br>IP address:" + String(local_ip[0]) + "." + String(local_ip[1]) + "." + String(local_ip[2]) + "." + String(local_ip[3]);
    r += "<br>port:" + String(UDP_PORT) + "<br>Expected packet size:" + String(UDP_PACKET_SIZE);
    r += "<br><h2>WiFi monitoring</h2><svg id='svg' width='800' height='800'></svg><script type='text/javascript'>";
    r += "var svgns = 'http://www.w3.org/2000/svg';var svg = document.getElementById('svg');";
    r += "var color=0,colors = ['red','orange','blue','green','purple','cyan','magenta','yellow'];";
    r += "line(80,400,640,400,'','');for(i=-1;i<=13;i++) {label='Ch'+i;if (i<1 || i>11 ) label='';line(i*40+120,400,i*40+120,80,null,label);}";
    r += "for(i=-90;i<=-20;i+=10) {label=''+i+'dBm';line(80,-i*4,640,-i*4,label,null);}";
    r += getSSIDs();
    r += "function line(x1,y1,x2,y2,lleft,ldown) {var l=document.createElementNS(svgns,'line');l.setAttribute('stroke','black');";
    r += "l.setAttribute('x1', x1);l.setAttribute('y1', y1);l.setAttribute('x2', x2);l.setAttribute('y2', y2);svg.appendChild(l);";
    r += "var t=document.createElementNS(svgns,'text');t.textContent = ldown;t.setAttribute('x', x1-15);t.setAttribute('y', y1+20);svg.appendChild(t);";
    r += "var t=document.createElementNS(svgns,'text');t.textContent = lleft;t.setAttribute('x', x1-60);t.setAttribute('y', y1+5); svg.appendChild(t);}";
    r += "function channel(ch,db,ssid) {var p=document.createElementNS(svgns,'path');";
    r += "p.setAttribute('d', 'M'+((ch-2)*40+120)+' 400 l60 '+(-400-db*4)+' l40 0 L'+((ch+2)*40+120)+' 400');";
    r += "p.setAttribute('stroke',colors[color]);p.setAttribute('stroke-width',3);p.setAttribute('fill','none');svg.appendChild(p);";
    r += "var t=document.createElementNS(svgns,'text');t.setAttribute('stroke',colors[color]);t.textContent = ssid;";
    r += "t.setAttribute('x', ch*40-(ssid.length/2*8)+120);t.setAttribute('y', -db*4-5);svg.appendChild(t); color=color+1 % colors.length;}";
    r += "</script></body></html>";
    server.send(200, "text/html", r);
  });

  server.on("/getframes", HTTP_GET, []() {
    String r = "Frame #   Arrived At Packet  Power   X  CPU utilization [µS]\r\n";
    r +=      "                [µS]  Size    [mA]      Pckt   Frame\r\n";
    //r+=String(oldestFrameIndex)+"-"+String(frameIndex)+"-"+String(framesToMonitor)+" - "+String(frameNumber)+"\r\n";
    int acum = 0;
    for (int i = 0 ; i < framesToMonitor ; i++) {
      if (framesMD[i].frame != 0) {
        r += formatN(framesMD[i].frame, 5) + "-" + formatN(framesMD[i].part, 1) + " " + formatN(framesMD[i].arrivedAt, 12) + "   " + formatN( framesMD[i].packetSize, 4) + "  " +
             formatN(framesMD[i].power, 5) + " " + formatN(framesMD[i].adjustedPower, 3) + " " + formatN(framesMD[i].processingTime, 5);
        if (framesMD[i].part == 1) acum = framesMD[i].processingTime;
        if (framesMD[i].part > 1)  acum += framesMD[i].processingTime;
        if (framesMD[i].part == 0)  {
          r += ("  " + formatN(acum + framesMD[i].processingTime, 6));
          acum = 0;
        }
      };
      r += "\r\n";
    }
    server.send(200, "text/plain", r);
  });

  // Start the server //MDB
  server.begin();

}

void loop() {
 //test();



 runloop();
}

void test() {



  strip.SetPixelColor(201, colorGamma.Correct(RgbColor(0, 0, 0)));

  strip.SetPixelColor(202, colorGamma.Correct(RgbColor(0, 0, 0)));

  strip.SetPixelColor(203, colorGamma.Correct(RgbColor(0, 0, 0)));
  strip.SetPixelColor(204, colorGamma.Correct(RgbColor(0, 0, 0)));
  strip.SetPixelColor(205, colorGamma.Correct(RgbColor(0, 0, 0)));

  strip.SetPixelColor(206, colorGamma.Correct(RgbColor(0, 0, 0)));
  strip.Show();

  delay(500);

  strip.SetPixelColor(201, colorGamma.Correct(RgbColor(255, 0, 0)));

  strip.SetPixelColor(202, colorGamma.Correct(RgbColor(0, 255, 0)));

  strip.SetPixelColor(203, colorGamma.Correct(RgbColor(0, 0, 255)));

  strip.SetPixelColor(204, colorGamma.Correct(RgbwColor(0, 0, 0, 255))); //natural yellowish white

  strip.SetPixelColor(205, colorGamma.Correct(RgbwColor(255, 255, 255, 255)));

  strip.SetPixelColor(206, colorGamma.Correct(RgbwColor(255, 255, 255, 0))); // bluish cold white

  strip.Show();

  delay(500);

}

void runloop() {
  // if there's data available, read a packet
  // digitalWrite(BUILTIN_LED,LOW);
  int packetSize = udp.parsePacket();
  if (packetSize > 0)
  {
    //take initial time //MDB
    arrivedAt = micros();

    // read the packet into packetBufffer
    udp.read(packetBuffer, UDP_PACKET_SIZE);

    action = packetBuffer[0];
 
   
    if (action == 1) {
      
      if (DEBUG_MODE) { // If Debug mode is on print some stuff
        Serial.println("======================================");
        Serial.println("frameindex: " + String(frameIndex) );
        Serial.println("frameNumber: " + String(frameNumber) );
        Serial.println("received packetSize: " + String(packetSize) );
        Serial.println("configured UDP_PACKET_SIZE: " + String(UDP_PACKET_SIZE) );
        Serial.println("CHUNK_SIZE: " + String(CHUNK_SIZE));
  
      }
    }

    if (action != 0)
    { // if action byte is anything but 0 (this means we're receiving some portion of our rgb pixel data..)

      framesMD[frameIndex].frame = frameNumber;
      framesMD[frameIndex].part = action;
      framesMD[frameIndex].arrivedAt = arrivedAt;

      // Figure out what our starting offset is.
      uint16_t initialOffset = CHUNK_SIZE * (action - 1);

      if (DEBUG_MODE) { // If Debug mode is on print some stuff
        Serial.println("    action byte: " + String(action) );
        Serial.println("    Init_offset: " + String(initialOffset));

//        Serial.print("    ");
//        Serial.println("    Packetbuffer:"); //print first 20 bytes
//        for (int j = 0; j < UDP_PACKET_SIZE; j = j + 1) {
//          Serial.println (String(j) + ":" + String(packetBuffer[j]));
//        }
//        Serial.println("");


      }

      // loop through our recently received packet, and assign the corresponding
      // RGB values to their respective places in the strip.

      uint16_t led = 0;
      for (uint16_t i = 1; i < CHUNK_SIZE * 3;) {

//        Serial.print (String(i) + "--- ");


        r = packetBuffer[i++];
//        Serial.print(String(r) + ":");
        g = packetBuffer[i++];
//        Serial.print(String(g) + ":");
        b = packetBuffer[i++];
//        Serial.println(String(b) + ":")
;
       

        //strip.SetPixelColor(i + initialOffset, RgbColor(r, g, b)); // this line does not use gamma correction
        strip.SetPixelColor(initialOffset + led++, colorGamma.Correct(RgbColor(r, g, b))); // this line uses gamma correction

        milliAmpsCounter += (r + g + b); // increment our milliamps counter accordingly for use later.
      }


      // if we're debugging packet drops, modify reply buffer.
      if (PACKETDROP_DEBUG_MODE) {
        ReplyBuffer[action] = 1;
      }

//      if (packetSize != UDP_PACKET_SIZE)
//      { // if our packet was not full, it means it was also a terminating update packet.
//        action = 0;
//      }
      framesMD[frameIndex].packetSize = packetSize;
      framesMD[frameIndex].power = 0;
      framesMD[frameIndex].adjustedPower = 0;
      framesMD[frameIndex].processingTime = micros() - framesMD[frameIndex].arrivedAt;
      frameIndex = (frameIndex + 1) % framesToMonitor;
      packetSize = 0; // implicit frame 0 will have packetSize == 0  MDBx
      arrivedAt = micros();
    }

    // If we received an action byte of 0... this is telling us we received all the data we need
    // for this frame and we should update the actual rgb vals to the strip!
    //framesMD[frameIndex].frame=frameNumber+1;  //MDBx

    if (action == 0)
    {
      framesMD[frameIndex].frame = frameNumber;
      framesMD[frameIndex].part = action;
      framesMD[frameIndex].arrivedAt = arrivedAt;

      pinMode(BUILTIN_LED, OUTPUT);

      // this math gets our sum total of r/g/b vals down to milliamps (~60mA per pixel)
      milliAmpsCounter /= 13;
      framesMD[frameIndex].power = milliAmpsCounter;

      // because the Darken function uses a value from 0-255 this next line maths it into the right range and type.
      millisMultiplier = 255 - (byte)( constrain( ((float)milliAmpsLimit / (float)milliAmpsCounter), 0, 1 ) * 256);
      millisMultiplier = map(millisMultiplier, 0, 255, 255, 0); // inverse the multiplier to work with new brightness control method
      // Collect data  MDB
      framesMD[frameIndex].adjustedPower = millisMultiplier;

      if (DEBUG_MODE) { // If Debug mode is on print some stuff
        Serial.println("      Update leds. Dim to " + String(millisMultiplier));
      }

      if (millisMultiplier != 255) { //dim LEDs only if required
        strip.SetBrightness(millisMultiplier); // this new brightness control method was added to lib recently, affects entire strip at once.
      }

      strip.Show();   // write all the pixels out
      milliAmpsCounter = 0; // reset the milliAmpsCounter for the next frame.

      if (DEBUG_MODE) {
        Serial.println("      Finished updating Leds!");
      }

      // Send reply to sender, basically a ping that says hey we just updated leds.
      //Serial.print("IP: ");
      //Serial.println(udp.remoteIP());
      //Serial.print("Port: ");
      //Serial.println(udp.remotePort());

      // if we're debugging packet drops, modify reply buffer.
      if (PACKETDROP_DEBUG_MODE) {
        // set the last byte of the reply buffer to 2, indiciating that the frame was sent to leds.
        ReplyBuffer[sizeof(ReplyBuffer) - 1] = 2;
        ReplyBuffer[0] = counterHolder;
        counterHolder += 1;
        // write out the response packet back to sender!
        udp.beginPacket(udp.remoteIP(), UDP_PORT_OUT);
        // clear the response buffer string.
        for (byte i = 0; i < sizeof(ReplyBuffer); i++) {
          udp.write(ReplyBuffer[i]);
          ReplyBuffer[i] = 0;
        }
        udp.endPacket();
      }

      //measure total frame processing time
      framesMD[frameIndex].processingTime = micros() - framesMD[frameIndex].arrivedAt;
      frameIndex = (frameIndex + 1) % framesToMonitor;


      //framesMD[frameIndex].processingTime=micros()-framesMD[frameIndex].arrivedAt;
      if (frameIndex == oldestFrameIndex) oldestFrameIndex = (oldestFrameIndex + 1) % framesToMonitor;
      frameNumber = (frameNumber + 1) % frameLimit;

      pinMode(BUILTIN_LED, INPUT);
    }

    if (DEBUG_MODE) { // If Debug mode is on print some stuff
      Serial.println("        END");
      Serial.println("");
    }

  }
  //delay(0);
  server.handleClient(); //MDB give opportunity to process HTTP requests
}

String formatN(long n, int p) {
  String ns = "       " + String(n);
  return ns.substring(ns.length() - p);
}

String getSSIDs() { // build wifi information channel calls for JS code
  String s = "";
  byte n;
  n = WiFi.scanNetworks(false, true);
  for (int i = 0; i < n; i++)      s += "channel(" + String(WiFi.channel(i)) + "," + String(WiFi.RSSI(i)) + ",'" + WiFi.SSID(i) + "');";
  return s;
};
