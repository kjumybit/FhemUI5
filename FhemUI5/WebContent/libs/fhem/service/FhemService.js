/*
 *  
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/ManagedObject",
	"./FhemWebSocket"
],
	function(jQuery, ManagedObject, FhemWebSocket) {
		"use strict";
										
		var FhemService = ManagedObject.extend("de.kjumybit.fhem.service.FhemService", /** @lends de.kjumybit.fhem.service.FhemService.prototype */ {
									
			/**
			 * 
			 */
			//TODO: document mSettings 
			constructor: function(sId, mSettings) {
				ManagedObject.apply(this, arguments);

				// identify how the constructor has been used to extract the settings
				if (typeof sId !== "string") {
					mSettings = sId;
					sId = undefined;
				}
				
				this.bMetaDataLoaded = false;
				this.bMetaDataFailed = false;
				
				this.mFhemMetaData = { 
						DeviceSet: [], 
						RoomSet: [], 
						DeviceTypeSet: [], 
						DeviceSubTypeSet: [] 
				};

				// create new connection
				this._fhemWebSocket = new FhemWebSocket();
				
				// register client handler
				this.attachMetaDataLoaded(null, mSettings.onMetaDataLoaded, mSettings.oListener);
				this.attachMetaDataLoadFailed(null, mSettings.onMetaDataLoadFailed, mSettings.oListener);
				this.attachConnectionClosed(null, mSettings.onDisconnected, mSettings.oListener);
							
				// connect to Fhem
				this._fhemWebSocket.connect({ 
					host: mSettings.host , port: mSettings.port,
					onErrorFhemConnection: _onErrorFhemConnection,
					onFhemDisconnect: _onFhemDisconnect,
					onSuccessFhemConnection: _onSuccessFhemConnection,
					oListener: this
				})

			},

			
			/**
			 * 
			 */
			metadata: {
				properties: {
				},
				
				// methods
				publicMethods : [
					"disconnect",
					"getServiceMetadata",
					"getDeviceTypeSet",
					"getDeviceSet",
					"getDeviceSubTypeSet",
					"getRoomSet",
					"isMetaDataFailed",
					"isMetaDataLoaded",
					"sendCommand",
					"refreshServiceMetadata",									  
				],					
				
				// events
				events: {
					"connectionFailed": {},
					"connectionClosed" : {},
					"metaDataLoaded" : {},				
					"metaDataLoadFailed" : {},
					"requestFailed" : {},
					"requestSent" : {},
					"requestCompleted" : {}				
				}								
			},

			
			/**
			 * 
			 */
			destroy: function () {
				ManagedObject.prototype.destroy.apply(this, arguments);
			}
			
		});


		/**
		 * Get Fhem Service MetaData object
		 * 
		 * @return {Object} metdata object
		 * @public
		 */
		FhemService.prototype.getServiceMetadata = function() {
			return this.mFhemMetaData;
		};

		/**
		 * Refreshes the metadata creating a new request to the server.
		 * Returns a new promise which can be resolved or rejected depending on the metadata loading state.
		 *
		 * @returns {Promise} returns a promise on metadata loaded state
		 * @public
		 */
		FhemService.prototype.refreshServiceMetadata = function(){
			//TODO return this._loadMetadata();
		};

		
		/**
		 * Checks whether metadata is available
		 *
		 * @public
		 * @returns {boolean} returns whether metadata is already loaded
		 */
		FhemService.prototype.isLoaded = function() {
			return this.bMetaDataLoaded;
		};

		/**
		 * Returns a promise for the loaded state of the metadata
		 *
		 * @public
		 * @returns {Promise} returns a promise on metadata loaded state
		 */
		FhemService.prototype.loaded = function() {
			//TODO: Instantiate promise & rework
			return this.pLoaded;
		};

		/**
		 * Checks whether metadata loading has already failed
		 *
		 * @public
		 * @returns {boolean} returns whether metadata request has failed
		 */
		FhemService.prototype.isFailed = function() {
			return this.bMetaDataFailed;
		};

		
		FhemService.prototype.disconnect = function () {
			this._fhemWebSocket.disconnect(null);
		};
		
						
		FhemService.prototype.getRoomSet = function () {
			return this.mFhemMetaData.RoomSet;
		};
		
		
		FhemService.prototype.getDeviceTypeSet = function () {
			return this.mFhemMetaData.DeviceTypeSet;
		};

		
		FhemService.prototype.getDeviceSubTypeSet = function () {
			return this.mFhemMetaData.DeviceTypeSet;
		};
		
		
		FhemService.prototype.getDeviceSet = function () {
			return this.mFhemMetaData.DeviceSet;
		};
		
		
		FhemService.prototype.sendCommand = function () {
			//TODO
		};
		
				
		// Private section
		
		/**
		 * Receive device meta data from backend, store it in the model instance and
		 * inform model change listeners via OpenUI5 events.
		 * Called by fhem.core.Service ws connection handler.
		 */
		function _onMetaData(oEvent) {
			this.mFhemMetaData = oEvent.getParameters(); // { DeviceSet: [], RoomSet: [], DeviceTypeSet: [], DeviceTypeSet: [] };
			this.bMetaDataLoaded = true;
			this.fireMetaDataLoaded(this.mFhemMetaData);

		};

		
		function _onValueData(oData) {
			//TODO: evaluate Fhem data type
			if (oData) {
				
			}
		};
		
		
		function _onDeviceData(Data) {
			//TODO: evaluate Fhem data type
			if (oData) {
				
			}
		};
		

		/**
		 * Handle successful Fhem connection
		 * Retrieve Fhem metadata via web socket connection.
		 */
		function _onSuccessFhemConnection(oFhemService) {
			//TODO: evaluate Fhem data type

			// register WS event handler for Fhem metadata event
			//TODO: use named event register function
			//TODO: use promise
			
			// register internal event handler
			oFhemService._fhemWebSocket.attachMetaDataLoaded(_onMetaData, oFhemService);
			oFhemService._fhemWebSocket.sendMetaDataRequest();
		};
		
		
		function _onErrorFhemConnection(oFhemService) {
			//TODO: evaluate Fhem data type
			oFhemService.fireConnectionFailed(null);
		};
		

		function _onFhemDisconnect(oFhemService) {
			oFhemService.fireConnectionClosed(null);
			//TODO refresh internal data
		};
		
				
		return FhemService;

	}, /* bExport= */ true);