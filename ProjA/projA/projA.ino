#include <RFduinoBLE.h>
/*
  Piezoelectric sensors between GND and pin GPIO1
  Sampling rate is 20Hz
 */
const int sensorPin = 1;
int sensorValue = 0;  // variable to store the value coming from the sensor
long clockTime = 0;

void setup() {
  pinMode(sensorPin, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  // read the sensor at GPIO1
  sensorValue = analogRead(sensorPin);
  Serial.println(sensorValue);

  // sampling frequency 20 Hz
  delay(50);     
}
