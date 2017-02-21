
import processing.serial.*;
import java.util.Date;

Serial myPort;  // Create object from Serial class
String sensorValue; // Data received from the serial port
PrintWriter output;
Date d;
long timestamp;

void settings() {
  size(400, 100);
}

void setup()
{  
  output = createWriter("data.csv"); // output file

  // Change the port to the correct one on your system
  String port = "/dev/cu.usbmodem1411";
  
  myPort = new Serial(this, port, 9600);
  myPort.bufferUntil('\n');
}

void draw()
{
  textSize(32);
  text("Collecting data", 10, 30); 
  fill(0, 102, 153);
}

void serialEvent(Serial myPort)
{
  sensorValue = myPort.readStringUntil('\n');
  d = new Date();
  timestamp = d.getTime();
  output.print(timestamp);
  output.print(",");
  output.print(sensorValue); // Write data to file
  output.flush();
  
  println(timestamp,',',sensorValue);
}

void keyPressed()
{
  output.flush(); // Writes the remaining data to the file
  output.close(); // Finishes the file
  exit(); // Stops the program
}