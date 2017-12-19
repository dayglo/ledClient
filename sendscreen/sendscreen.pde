

/**
 *
 * Some code nicked from Amnon and GoToLoop : https://forum.processing.org/two/discussion/8025/
 * take-a-screen-shot-of-the-screen
 */
 
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.AWTException;
//import hypermedia.net.*;

import java.awt.image.*; 
import javax.imageio.*;
import java.io.*;
import java.net.*;
import java.util.*;

PImage screenshot;
Rectangle dimension;
Robot robot;

int clientPort = 9100; 
DatagramSocket ds; 

 
void setup() {
  size(8, 1, JAVA2D);
 
  smooth(4);
  frameRate(0.5);
  
  int captureAreaHeight = 20;
  int captureAreaWidth = displayWidth;
  int captureAreaStartsAtScreenLine = 600;
 
  imageMode(CORNER);
  background((color) random(#000000));
 
  screenshot = createImage(captureAreaWidth, captureAreaHeight, RGB);
  dimension  = new Rectangle(0,captureAreaStartsAtScreenLine,captureAreaWidth, captureAreaHeight);
  
  loadPixels();
  
  
  
  try {
    ds = new DatagramSocket();
  } catch (SocketException e) {
    e.printStackTrace();
  }
  
  try {
    robot = new Robot();
  }
  catch (AWTException cause) {
    println(cause);
    exit();
  }
  
  //udp = new UDP( this, 9101 );  // create a new datagram connection on port 6000
  //udp.log( true );     // <-- printout the connection activity
  //udp.listen( true );  
 // bimg = new BufferedImage( captureAreaWidth, captureAreaHeight, BufferedImage.TYPE_INT_RGB );
  
  //baStream = new ByteArrayOutputStream();
  //bos = new BufferedOutputStream(baStream);
  
}
 
void draw() {
  
  image(
    grabScreenshot(screenshot, dimension, robot),
    0, 
    0, 
    width, 
    height);
    
    broadcast(get());
    
    //send(get());
  
}
 
static final PImage grabScreenshot(PImage img, Rectangle dim, Robot bot) {
 
  bot.createScreenCapture(dim).getRGB(0, 0
    , dim.width, dim.height
    , img.pixels, 0, dim.width);
 
  img.updatePixels();
   println("pixels updated");
  return img;
}


// Function to broadcast a PImage over UDP
// Special thanks to: http://ubaa.net/shared/processing/udp/
// (This example doesn't use the library, but you can!)
PImage broadcast(PImage img) {

  // We need a buffered image to do the JPG encoding
  BufferedImage bimg = new BufferedImage( img.width,img.height, BufferedImage.TYPE_INT_RGB );

  // Transfer pixels from localFrame to the BufferedImage
  img.loadPixels();
  bimg.setRGB( 0, 0, img.width, img.height, img.pixels, 0, img.width);

  // Need these output streams to get image as bytes for UDP communication
  ByteArrayOutputStream baStream  = new ByteArrayOutputStream();
  BufferedOutputStream bos    = new BufferedOutputStream(baStream);

   //Turn the BufferedImage into a JPG and put it in the BufferedOutputStream
   //Requires try/catch
  try {
    ImageIO.write(bimg, "jpg", bos);
  } 
  catch (IOException e) {
    e.printStackTrace();
  }

  // Get the byte array, which we will send out via UDP!
  byte[] packet = baStream.toByteArray();
  //println(packet[2]);

  // Send JPEG data as a datagram
  println("Sending datagram with " + packet.length + " bytes");
  try { //<>//
    ds.send(new DatagramPacket(packet,packet.length, InetAddress.getByName("localhost"),clientPort));
  } 
  catch (Exception e) {
    e.printStackTrace();
  }
  
  return img;
}

  