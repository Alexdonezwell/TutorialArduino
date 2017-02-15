#include <RFduinoBLE.h>

boolean connectFlag = true;

const int sensorPin = 2;
uint32_t sensorValue;
uint32_t txBuf[5]; // since Bluetooth LE max size is 20 bytes

void setup() {  
  pinMode(sensorPin, INPUT);
  
  // start the BLE stack
  RFduinoBLE.deviceName = "mhealth"; // change name here to avoid conflict
  RFduinoBLE.advertisementData = "piezo";
  RFduinoBLE.txPowerLevel = -4; 
  RFduinoBLE.begin();

  delay(1000);
}

void RFduinoBLE_onConnect() {
  connectFlag = true;
}

void RFduinoBLE_onDisconnect() {
  connectFlag = false;
}

void loop() {
  if (connectFlag) {
    RFduino_ULPDelay( SECONDS(0.01) );
    sensorValue = analogRead(sensorPin);
    txBuf[0] = sensorValue;
    RFduinoBLE.send((char *)txBuf, 20);
  }
}
