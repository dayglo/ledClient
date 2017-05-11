# Over the Air LED animations

using a nodeMCU(esp8266) and some wb2012Bs.

Upload this sketch to esp8266 or nodemcu or whatever (https://github.com/dayglo/NodeMCU-Arduino-Pixel-Driver/blob/master/neoPixelBus_UDP/neoPixelBus_UDP.ino)
(making sure to change the ssid and password. Also, set pixels_per_strip amd chunk_size to the length of your led strip)

Connect up your LED strip to the Rx pin (follow adafruit's neopixel guide to do all the hardware bits https://learn.adafruit.com/adafruit-neopixel-uberguide/overview)

Then, run node index.js

Bam, pretty patterns streaming over UDP to your LEDs.

