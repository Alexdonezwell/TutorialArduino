"use strict";
var noble = require('noble'),
rfduino = require('./necklaceSettings'),
_ = require('underscore');
var fs = require('fs');

var description = "";
var visualizeOn = false;

var receiveCharacteristic;
var timenow = Date()

//===================================================================================
// argument line parser
// usage: node index.js --des andrey --visualize
var argv = require('minimist')(process.argv.slice(2));
console.dir(argv);

var allowedKeys = {'_': true, 'des': true, 'visualize': true}
var numKeysGiven = 0;
for (var key in argv) {
    console.log(key)
    if (!(key in allowedKeys)) {
        throw new Error('Invalid argument.')
    }
    numKeysGiven++;
}

if ('des' in argv) {
    description = argv['des'] + '_';
}

if ('visualize' in argv) {
    visualizeOn = true;
    // start express server for visualization
    var express = require('express')
    var app     = express();
    var http    = require('http').Server(app);
    var io      = require('socket.io').listen(http);

    app.use('/', express.static(__dirname + '/public'));
    http.listen(3000, function() { 
        console.log('go to localhost:3000');
    });
}

var csvfile = 'data/' + description +  timenow.toLocaleString() + '.csv';
csvfile = csvfile.replace(/ /g, "_") // replace space by underscores, avoid hidden file in some OSes

// ==================================================================================
// bluetooth callbacks

noble.on('scanStart', function() {
    console.log('Scan started');
    setTimeout(function() {
        noble.stopScanning();
    }, 15000);
});

noble.on('scanStop', function() {
    console.log('Scan stopped');
});

noble.on('discover', function(peripheral) {

    if (_.contains(peripheral.advertisement.serviceUuids, rfduino.serviceUUID)) {
        console.log('peripheral discovered (' + peripheral.id +
            ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
            ' connectable ' + peripheral.connectable + ',' +
            ' RSSI ' + peripheral.rssi + ':');

        console.log('RFduino is advertising \'' + rfduino.getAdvertisedServiceName(peripheral) + '\' service.');

        peripheral.on('connect', function() {
            peripheral.discoverServices();
        });

        peripheral.once('disconnect', function() {
            console.log('Disconnected');
            lastCountWritten = 0;
            noble.stopScanning();
            noble.startScanning();
        });

        peripheral.on('servicesDiscover', function(services) {
            console.log('servicesDiscover');
            var rfduinoService;
            for (var i = 0; i < services.length; i++) {
                if (services[i].uuid === rfduino.serviceUUID) {
                    rfduinoService = services[i];
                    break;
                }
            }

            if (!rfduinoService) {
                console.log('Couldn\'t find the RFduino service.');
                return;
            }

            console.log(description);

            rfduinoService.on('characteristicsDiscover', function(characteristics) {
                console.log('Discovered ' + characteristics.length + ' service characteristics');

                for (var i = 0; i < characteristics.length; i++) {
                    if (characteristics[i].uuid === rfduino.receiveCharacteristicUUID) {
                        receiveCharacteristic = characteristics[i];
                        break;
                    }
                }

                if (receiveCharacteristic) {
                    var count = 0;
                    receiveCharacteristic.on('read', function(data, isNotification) {

                        var piezo = data.readUInt32LE();
                        var ioData = {  
                            time:   Date.now(),
                            piezo:  piezo,
                        }

                        console.log(ioData);

                        if (visualizeOn) {
                            io.sockets.emit('data', ioData);
                        }

                        count++;
                        if (count > lastCountWritten){
                            lastCountWritten = count;
                            fs.appendFile(csvfile, ioData.time + ',' + ioData.piezo + '\n', function(err){
                                if (err)
                                    throw new Error(err);
                            });
                        }
                    });

                    receiveCharacteristic.notify(true);
                }
            });

            rfduinoService.discoverCharacteristics();

        });

        peripheral.connect();
    }
});

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
    }
});

