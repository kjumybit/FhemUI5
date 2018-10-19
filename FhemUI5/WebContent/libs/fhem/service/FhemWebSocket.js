/*
 *  
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/ManagedObject",	
],
	function(jQuery, ManagedObject) {
		"use strict";
															
		var FhemWebSocket = ManagedObject.extend("de.kjumybit.fhem.service.FhemWebSocket", /** @lends de.kjumybit.fhem.service.FhemWebSocket.prototype */ {
									
			/**
			 * Initialize a Fhem WebSocket API.
			 * @param {string} sId ID
			 * @param {object} mSettings Settings
			 */
			constructor: function(mSettings) {
				ManagedObject.apply(this, arguments);
				
				jQuery.sap.require("socket.io");
				this._io = io;
				
				this._socket = null;
				this._bConnected = false;
				
				this._oHandler = {
						fnOnErrorFhemConnection: null,
						fnOnSuccessFhemConnection: null,
						fnOnDisconnect: null,
						oListener: null
				}								
			},

			
			/**
			 * 
			 */
			metadata: {
				
				properties: {
					host: "string",
					port: "string"
				},

				// methods
				publicMethods : [
					"connect",
					"disconnect",
					"isConnected",
					"sendMetadataRequest",
					"sendRequest",
					"subscribeEvent"
				],					
				
				// events
				events: {
					"connected": {},
					"connectFailed": {},
					"disconnected": {},
					"metaDataLoaded" : {},				
					"metaDataLoadFailed" : {},
					"deviceEvents": {}
				},

			},

			
			/**
			 * 
			 */
			destroy: function () {
				ManagedObject.prototype.destroy.apply(this, arguments);
			},
			
		});

		
		// Fhem Websocket events send to the Fhem backend service
		FhemWebSocket.M_PUBLISH_EVENTS = {
				getMetaData : "getMetaData",
				dbLog: "dbLog"
		};
		
		// Fhem Websocket events received from the Fhem backend service
		// TODO: assign event handler
		FhemWebSocket.M_SUBSCRIBE_EVENTS = {
				getMetaData : { onEvent: "metaData", fireEventFnName: "" }, 
				getMetaDataError : { onEvent: "metaDataError", fireEventFnName: "" },
				dbLogError: { onEvent: "dbLogError", fireEventFnName: "" },
				deviceEvents: { onEvent: "deviceEvents", fireEventFnName: "fireDeviceEvents" }
		};		
		
				
		/**
		 * Connect to the fhem backend service.
		 * 
		 * @param {object} args Connection parameters
		 * @returns {de.kjumybit.fhem.service.FhemWebSocket} <code>this<code> to allow method chaining
		 * @public
		 */
		FhemWebSocket.prototype.connect = function(args) {
			//TODO: Verbinbungsdaten im Konstruktor übergeben
			//TODO;: Promises verwenden
			
			//TODO: event provider verwenden
			this._oHandler.fnOnErrorFhemConnection = args.onErrorFhemConnection;
			this._oHandler.fnOnFhemDisconnect = args.onFhemDisconnect;
			this._oHandler.fnOnSuccessFhemConnection = args.onSuccessFhemConnection;
			this._oHandler.oListener = args.oListener;
				
			this._socket = this._io.connect('ws://' + args.host + ':' + args.port, {
				"timeout": 5000,
		        "sync disconnect on unload" : true
		    });
			
			// register internal Websocket 'on error' handler
			this._socket.on('connect_error', function() { 
					this._bConnected = false;
					// invoke callback error function
					if (this._oHandler.fnOnErrorFhemConnection) { 
						this._oHandler.fnOnErrorFhemConnection(this._oHandler.oListener);
					}
				}.bind(this)
			);
			
			// register internal Websocket 'on connect' handler
			this._socket.on('connect', function() {
					this._bConnected = true;							
					// invoke callback success function 
					if (this._oHandler.fnOnSuccessFhemConnection) {
						this._oHandler.fnOnSuccessFhemConnection(this._oHandler.oListener);
					}
				}.bind(this)
			);			
						
			// register internal Websocket 'on disconnect' handler
			this._socket.on('disconnect', function() { 
					this._bConnected = false;
					// invoke callback disconnect function					
					if (this._oHandler.fnOnDisconnect) { 
						this._oHandler.fnOnDisconnect(this._oHandler.oListener);
					}
				}.bind(this)
			);
									
			return this;
		};


		/**
		 * Disconnect from backend service.
		 * 
		 * @public
		 */
		FhemWebSocket.prototype.disconnect = function() {
			//TODO
			this._bConnected = false;
			return null;
		};


		/**
		 * Is client connected to the fhem backend service.
		 * 
		 * @returns {boolean} Is client connected to the fhem backend service.
		 * @public
		 */
		FhemWebSocket.prototype.isConnected = function() {
			return this._bConnected;
		};

		
		/**
		 * Send a metadata request event to the Fhem backend 
		 * 
		 * @public
		 * @returns {Promise}  Promise for meta data request
		 */
		FhemWebSocket.prototype.sendMetaDataRequest = function() {
			//TODO: return promise
											
			// submit event with callback
			this._socket.emit(FhemWebSocket.M_PUBLISH_EVENTS.getMetaData, null, function(mData) {
				this.fireMetaDataLoaded(mData);
				jQuery.sap.log.info(this + " - metaDataLoaded was fired");
			}.bind(this));
			
			return this;
		};
							
				
		/**
		 * Send a WebSocket event to the Fhem backend 
		 * 
		 * @param  {object} mSettings
		 * 			        mSettings.event   {FhemWebSocket.M_PUBLISH_EVENTS}
		 *                  mSettings.data    event data 
		 *                  mSettings.success Success handler function fnSuccess(mData)
		 *                  mSetiings.error   Error handler function fnError(oError)
		 * @returns {promise} Promise for Request
		 */
		//TODO: implement as promise
		//TODO: implement error handler
		FhemWebSocket.prototype.sendRequest = function(mSettings) {
			
			if (!FhemWebSocket.M_PUBLISH_EVENTS[mSettings.event]) {
				jQuery.sap.log.error(this + " - Unknown Fhem event " + mSettings.event);
				//TODO: trigger error
				mSettings.error({
					sMessage: "Unknown Fhem event " + mSettings.event
				});
				return;
			}
			
			// submit event
			//TODO: logging, local success hander function
			jQuery.sap.log.info(this + " - request sent: " + mSettings.event);

			this._socket.emit(FhemWebSocket.M_PUBLISH_EVENTS[mSettings.event], mSettings.data, mSettings.success);

			return true;			
		};

		
		/**
		 * Subscribe for a Fhem backend event
		 * 
		 * @param  {string} sEvent   FhemWebSocket.M_PUBLISH_EVENTS
		 * 
		 * @returns {de.kjumybit.fhem.service.FhemWebSocket} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemWebSocket.prototype.subscribeEvent = function(sEvent) {							

			if (!FhemWebSocket.M_SUBSCRIBE_EVENTS[sEvent]) {
				jQuery.sap.log.error(this + " - Unknown Fhem event " + sEvent);
				//TODO Trigger exception
				return this;
			};

			let sThatEvent = sEvent;

			// subscribe to ws server event
			this._socket.on(FhemWebSocket.M_SUBSCRIBE_EVENTS[sEvent].onEvent, function(mData) {
				// fire client event by own local function
				let fireFn = this[FhemWebSocket.M_SUBSCRIBE_EVENTS[sEvent].fireEventFnName].bind(this);
				// is object a function?
				if (typeof fireFn === "function") {
					jQuery.sap.log.debug(this + " submit " + FhemWebSocket.M_SUBSCRIBE_EVENTS[sEvent].fireEventFnName);					
					fireFn(mData);
				} else {
					jQuery.sap.log.info(this + " - " + sThatEvent + ": no client event fired");
				}
			}.bind(this));

			return this;
		};


		// Private method section
						
		return FhemWebSocket;

	}, /* bExport= */ true);