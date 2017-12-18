/**
 * Robot Screenshots (v2.22)
 * by  Amnon (2014/Nov/11)
 * mod GoToLoop
 *
 * forum.processing.org/two/discussion/8025/
 * take-a-screen-shot-of-the-screen
 */
 
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.AWTException;
 
PImage screenshot;
Rectangle dimension;
Robot robot;
 
void setup() {
  size(1280, 20, JAVA2D);
 
  smooth(4);
  frameRate(30);
  
  int captureAreaHeight = 20;
  int captureAreaWidth = displayWidth;
  int captureAreaStartsAtScreenLine = 600;
 
  imageMode(CORNER);
  background((color) random(#000000));
 
  screenshot = createImage(captureAreaWidth, captureAreaHeight, ARGB);
  dimension  = new Rectangle(0,captureAreaStartsAtScreenLine,captureAreaWidth, captureAreaHeight);
  //test = new Rectangle(0,0,100,100);
 
  try {
    robot = new Robot();
  }
  catch (AWTException cause) {
    println(cause);
    exit();
  }
}
 
void draw() {
  image(grabScreenshot(screenshot, dimension, robot)
    , 0, 0, width, height);
}
 
static final PImage grabScreenshot(PImage img, Rectangle dim, Robot bot) {
  //return new PImage(bot.createScreenCapture(dim));
 
  bot.createScreenCapture(dim).getRGB(0, 0
    , dim.width, dim.height
    , img.pixels, 0, dim.width);
 
  img.updatePixels();
  return img;
}