#!/usr/bin/env node
/**
 * FhemJs is a <code>node.js</code> server connecting frontends to the <code>Fhem</code> 
 * smart home server.
 * <p>
 * FhemJs provides a <code>socket.io</code> based interface to receive and send JSON 
 * messages.
 * Frontends send JSON messages to access Fhem devices data.
 * The FhemJs server pushes JSON messages for device state updates to a client.
 * <p>
 * The Fhem backend connection is using the Fhem telnet port.
 * 
 * @author "qubit"
 * @version "0.2.0"
 */
"use strict";

var logger = require('./logger');
var fs = require('fs');
var io = require('socket.io');
var net = require('net');
var crypto = require('crypto');
var params = require('./params');

var server;
var reconnectTimeout;
var fhemSocket;


// -------------------------------------------------------------------
// setup http(s) server
// -------------------------------------------------------------------

if (params.useSSL) {
    var https = require('https');
    var options = {
        key: fs.readFileSync(params.sslcert.key),
        cert: fs.readFileSync(params.sslcert.cert),
        ciphers: params.cipher,
        honorCipherOrder: true
    };
    server = https.createServer(options);
} else {
    var http = require('http');
    server = http.createServer();
}

// setup socket.io server
// - enable CORS handling 
const ios = io(server, {
    path: '/socket/fhem/',
    origins: '*:*'
});


// -------------------------------------------------------------------
// setup password protection
// -------------------------------------------------------------------
if (params.useClientPassword) {
    var auth = require('socketio-auth');
    auth(ios, {
        authenticate: function(socket, password, callback) {
            logger.info("authentication by client");
            var connectionPassword = fs.readFileSync(params.connectionPasswordFile).toString().substr(0, 64);
            if (crypto.createHash('sha256').update(password).digest('hex') === connectionPassword) {
                logger.verbose("authentication success");
                return callback(null, true);
            } else {
                logger.warn("authentication failed");
                return callback(new Error("Invalid connection password"), false);
            }
        },
        timeout: 1000
    });
}


// -------------------------------------------------------------------
// setup websocket server
// -------------------------------------------------------------------
ios.sockets.on('connection', function(socket) {
    var q = socket.handshake.query;
    var logmess = "client connected: " + q.client + ", " + q.model + ", " + q.platform + " " + q.version + ", App " + q.appver;
    logger.info(logmess);
    //emit authenticated if no passwd is used

    if (!params.useClientPassword) {
        logger.verbose("server: emit authenticated to client: no auth needed");
        socket.emit('authenticated');
    }

    // register event handler for new socket connection
    defListeners(socket);
});


// -------------------------------------------------------------------
// define listeners for websocket requests by clients
// -------------------------------------------------------------------
var defListeners = function(socket) {

	/** 
     * Handle event <code>getMetaData</code> from client.
	 * Requests a JSONList2 command to FHEM and extracts
	 * - list of rooms, devices, device types, device subtypes, 
	 * A single metadata object as JSON string is passed to the client   
     * callback function <code>fnCallBack</code>.
	 */
	socket.on('getMetaData', function(data, fnCallBack) {
        logger.info('client: Get Metadata from fhem');
        
		//TODO: pass callback success and error function name as data properties a call 
		// websocket callback handler with the correspnding fn name depending on processing
		// result
		// as: result: ommit event name
        
		getFhemMetaData( {
			onSuccess : function(oJsonList2) {                
				var oMetaData = { 
						DeviceSet: [],
						RoomSet: [], 
						DeviceTypeSet: [], 
						DeviceSubTypeSet: []
                };
                logger.verbose('fhem: Get Metadata success: call client event handler');
				oMetaData = extractFhemMetaData(oJsonList2);
				fnCallBack(oMetaData)
				//socket.emit('metaData', oMetaData);
			},
			onError : function(sError) {
                logger.error('fhem: Get Metadata: failed:' + sError);
				socket.emit('metaDataError', sError);
			}
		})
		
	});
	
	   
    /**
     * Handle event <code>dbLog</code> from client.
     * Forward (TODO) "get <Device> - webchart <parameters>" command to the fhem backend service. 
     * The response data is passed to the callback function <code>fnCallBack</code>.
     * 
     * The response JSON string from the Fhem server is transmitted in multiple data packages.
     */
    socket.on('dbLog', function(query, fnCallBack) {
        
        // establish telnet connection to fhem server
        logger.info("client: Submit DbLog query to fhem: " + query);
        var fhemcmd = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
            fhemcmd.write(query + ';exit\r\n');  
        });

        var oResult = { 
                fhemResponse : "", 
                exitRequested : false,
                oDataSet : { }
        }
        
        fhemcmd.on('data', function(response) {

            // concat response string
            oResult.fhemResponse += response.toString(); 
            logger.verbose('fhem: Get DbLog: Data received');        	
            // mylog(oResult.fhemResponse, 1);            
        });

        fhemcmd.on('end', function() {
            logger.verbose('fhem: Get DbLog: Connection to Fhem server closed, call client event handler');        	
            
            // strip <Bye...> at the end of the response string
            let iIndex = oResult.fhemResponse.lastIndexOf('Bye');
            oResult.fhemResponse = (iIndex > 0 ? oResult.fhemResponse.substring(0, iIndex) : oResult.fhemResponse);

            // parse string to JSON object
            oResult.oDataSet = JSON.parse(oResult.fhemResponse);
            fnCallBack(oResult.oDataSet);
        });
        
        fhemcmd.on('error', function() {
            fhemcmd.destroy();
            let sMsg = 'Get DbLog error: telnet connection failed'; 
            logger.error("fhem: " + sMsg);
            socket.emit('dbLogError', sMsg);
        });
                
    });


    socket.on('disconnect', function(data) {
        logger.info('client: disconnected: ' + data);
    });
};


// -------------------------------------------------------------------
// Setup permanent connection to fhem.
// Submitts the <code>inform timer</code> command to the fhem backend.
// The command response is mapped into a JSON string and published as 
// <code>deviceEvents</code> web socket event to listening clients
// -------------------------------------------------------------------
fhemSocket = new net.Socket();

process.on('uncaughtException', function(err) {
    logger.error('service: process error: ' + err + ' - retry in 10 secs');
});


/**
 * Fhem server connection handler for <code>connect</code> event
 * Send Fhem command <code>inform</code> for listening for device events.
 */
fhemSocket.on('connect', function(data) {
    logger.info('fhem: connected to fhem server for listen on changed values');
    fhemSocket.write('inform timer\r\n');
});


/**
 * Fhem server connection handler for <code>error</code> event
 */
fhemSocket.on('error', function() {
    logger.error('fhem: error: telnet connection failed - retry in 10 secs');
    fhemSocket.destroy();
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(function() {
        connectFHEMserver();
    }, 10000);
});


/**
 * Fhem server connection handler for <code>end</code> event
 */
fhemSocket.on('end', function() {
    logger.info('fhem: error: telnet connection closed - try restart in 10 secs');
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(function() {
        connectFHEMserver();
    }, 10000);
});


/**
 * Fhem server connection handler for <code>data</code> event.
 * Convert Fhem event data to a JSON string and publish is 
 * as <code>deviceEvents</code> web socket event 
 * to listening clients.
 * Example:
 * - response string: "2018-08-04 17:40:38 MQTT_DEVICE MQTT_D_EBUSD SolarCollTemp: 51.62"
 * - response string may consists of multiple lines
 * - the colon character might be missing at the and of the reading name
 */
fhemSocket.on('data', function(data) {
    logger.verbose("fhem: event data received");
    logger.silly(data.toString());

    let oEventData = extractFhemEventData(data.toString());

    logger.debug(JSON.stringify(oEventData));
    ios.sockets.emit('deviceEvents', oEventData);
});


/**
 * Establish permanent telnet connection to fhem server.
 */
function connectFHEMserver() {
    logger.info("fhem: start connection to fhem server");
    clearTimeout(reconnectTimeout);
    fhemSocket.connect({ port: params.fhemPort, host: params.fhemHost });
};


// -------------------------------------------------------------------
// handle client get requests
// -------------------------------------------------------------------


/**
 * Connect to Fhem server and retrieve complete device list (metadata)
 * @param {object}   args Request properties
 * @param {function} args.onSuccess	function( oJsonList2 ) 
 */
function getFhemMetaData(args) {
	
    // establish telnet connection to fhem server
    logger.info('fhem: Get Metadata: get Jsonlist2 ');

    var fhemreq = new net.Socket();
    fhemreq.setEncoding('utf8');
    fhemreq = net.connect({ port: params.fhemPort, host: params.fhemHost }, function() {
        fhemreq.write('jsonlist2; exit\r\n');
    });

    var oResult = { 
        fhemResponse : "", 
        exitRequested : false,
        oJsonList2 : { }
    }
    
    fhemreq.on('data', function(response) {
        oResult.fhemResponse += response.toString(); 

        logger.verbose('fhem: Get Metadata: Data received');        	             
    });

    fhemreq.on('end', function() {
        logger.info('fhem: Get Metadata: Connection to Fhem server closed');
        
        // strip <Bye...> at the end of the response string
        let iIndex = oResult.fhemResponse.lastIndexOf('Bye');
        oResult.fhemResponse = (iIndex > 0 ? oResult.fhemResponse.substring(0, iIndex) : oResult.fhemResponse);
        logger.silly(oResult.fhemResponse);   

        // parse string to JSON object
        oResult.oJsonList2 = JSON.parse(oResult.fhemResponse);        
        logger.debug(oResult.oJsonList2);   

        // call event handler for JsonList2
        args.onSuccess(oResult.oJsonList2);
    });


    fhemreq.on('error', function() {
        fhemreq.destroy();
        logger.error('fhem: error: telnet connection for getting JsonList2 failed');
        // call event handler for connection error 
        args.onError("fhem error: telnet connection for getting JsonList2 failed");
    });
};


/**
 * Return fhem meta data extracted from fhem response for <code>jsonlist2</code> command.
 * 
 * @param {object} oFhemJsonList2 JsonList2 response data
 *                 oFhemJsonList2.Results: []
 * @returns {object} oMetaData
 *        			 oMetaData.DeviceSet: []
 *		        	 oMetaData.RoomSet: []
 *  		         oMetaData.DeviceTypeSet: []
 *			         oMetaData.DeviceSubTypeSet: []
 */
function extractFhemMetaData( oFhemJsonList2 ) {

	var oMetaData = {
			DeviceSet: [],
			RoomSet: [], 
			DeviceTypeSet: [], 
			DeviceSubTypeSet: []
	};
	oMetaData.DeviceSet = oFhemJsonList2.Results;
	
	for (var i=0, iL=oMetaData.DeviceSet.length; i<iL; i++) {
	  
		// room set: source: Attributes.room = {room_1,...,room_n}
		var oDevice = oMetaData.DeviceSet[i];
		var sDevRoom = oDevice.Attributes.room;
		if (sDevRoom) {
			var aRooms = sDevRoom.split(',');
			for (var j=0, jL=aRooms.length; j < jL; j++) {
				if (oMetaData.RoomSet.indexOf(aRooms[j]) === -1) {
					oMetaData.RoomSet.push(aRooms[j]); // TODO: reference to Devices
				}
			}
		}
      
		// device type set: source: Internals.TYPE 
		var sDevType = oMetaData.DeviceSet[i].Internals.TYPE; 
		if (sDevType) {
			if (oMetaData.DeviceTypeSet.indexOf(sDevType) === -1) {
				oMetaData.DeviceTypeSet.push(sDevType); // TODO: reference to Devices
			}  
		}
		
		// device sub type set: source: Attributes.subType 
		var sDevSubType = oMetaData.DeviceSet[i].Attributes.subType; 
		if (sDevSubType) {
			if (oMetaData.DeviceSubTypeSet.indexOf(sDevSubType) === -1) {
				oMetaData.DeviceSubTypeSet.push(sDevSubType); // TODO: reference to Devices
			}  
		}
		
	}
	
	return oMetaData;
};


/**
 * Return single event data extracted from fhem response 
 * for <code>inform timer</code> command.
 * 
 * @param {string}  sInformResponse response data
 * @returns {object} Event data as Json object
 * @returns {object[]} events
 *          {string}   event.timeStamp
 *          {string}   event.deviceType
 *          {string}   event.deviceName
 *          {string}   event.reading
 *          {string}   event.value
 * 
 * Example format:
 * 
 *  2018-10-28 17:19:35 HMCCUDEV SZ_FK_Fenster1_06 1.STATE: closed      # regurar Reading with reading name
 *  2018-10-28 17:19:35 HMCCUDEV SZ_FK_Fenster1_06 closed               # <state> Reading without reading name
 * 
 */
function extractFhemEventData(sInformResponse) {
    
    let oEventData = { events: [] };
    let aEventLines = sInformResponse.split('\n');

    // split lines of response to array of events
    let aEvents = aEventLines.map(sEvent => {

        let aEventToken = sEvent.split(' ');
        if ( !Array.isArray(aEventToken) ) {
            //TODO: Loging error
            return undefined;
        }

        let sReading = "?";
        let sValue = "?"
        switch (aEventToken.length) {
            case 5:         // state reading
                sReading = "state";
                sValue = aEventToken[4]
                break;
            case 6:         // regular reading
                // remove optional colon character
                sReading = aEventToken[4];
                sReading = sReading.endsWith(':') ? sReading.substring(0, sReading.length - 1) : sReading;
                sValue = aEventToken[5]
                break;
            default:
                //TODO; Logging error
                return undefined;
        }

        return {
            timeStamp: aEventToken[0] + ' ' + aEventToken[1],
            deviceType: aEventToken[2],
            deviceName: aEventToken[3],
            reading: sReading,
            value: sValue
        };
    });

    // remove empty lines / events
    oEventData.events = aEvents.filter(event => typeof event === "object" );
    return oEventData;
};   


/**
 * Start fhem.js server
 */
(function main() {
	
    logger.info('start fhem.js service');
    
    // start http & ws server for client connection
    server.listen(params.nodePort);
    
    var messSuff = (params.useSSL) ? ' with SSL' : ' without SSL';
    logger.info('service: listen for websocket requests on port ' + params.nodePort + messSuff);
    console.log('fhem.js service listen for websocket requests on port ' + params.nodePort + messSuff);
    
    // establish permanent TELNET connection to fhem server for listening on fhem events
    connectFHEMserver();
   
})();
