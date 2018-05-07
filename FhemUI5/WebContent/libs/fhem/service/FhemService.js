/*
 *  
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/ManagedObject",
	"./FhemWebSocket",
	'../base/Helper'
],
	function(jQuery, ManagedObject, FhemWebSocket, Helper) {
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
					"getDevice",
					"getDeviceSubTypeSet",
					"getRoomSet",
					"isMetaDataFailed",
					"isMetaDataLoaded",
					"callFhemCommand",
					"callDeviceAction",
					"callDbLogQuery",					
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
			return undefined;
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

		
		/**
		 * Get device definition for device {sDevice}
		 * 
		 * @param {String} sDevice Device name
		 * 
		 * @returns {object} oDevice Device definition or {null} if device is unknown  
		 */
		FhemService.prototype.getDevice = function (sDevice) {
			let i = Helper.getArrayIndex("Name", sDevice, this.mFhemMetaData.DeviceSet); 
			return (i ? this.mFhemMetaData.DeviceSet[i] : null);
		};

		
		FhemService.prototype.sendFhemCommand = function () {
			//TODO callDbLogQuery
		};

		
		/**
		 * Retrieve log entries from a DbLog Device {sDevice} applying the command in 
		 * {mQuery.command} 
		 * 
		 * @param {Object} mQuery         Query parameters
		 * 
		 * 				   mQuery.from    DateTime
		 *                 mQuery.from.date "YYYY-MM-DD"
		 *                 mQuery.from.time "HH:MM:SS"
		 * 				   mQuery.to      DateTime
		 *                 mQuery.to.date
		 *                 mQuery.to.time
		 *                 mQuery.device  {String} Name of device to retrieve the values for reading {reading} 
		 *                 mQuery.reading {String} Name of the reading the values are retrieved
		 *   			   mQuery.success Success handler function with an {oData} parameter
		 *   							  oData.results [] Result rest as array of DbLog entries    
		 *                 mQuery.error   Error handler function with an {oError} parameter
		 *                 
		 * Command example: 
		 * 		get DB_Log_MariaDB - webchart 2017-10-01_00:00:00 2017-10-02_23:59:59 KG_IZ_StromZaehler timerange TIMESTAMP energyTagesVerbrauch
		 */
		FhemService.prototype.callDbLogQuery = function (sDevice, mQuery) {
			
			// check Parameter
			let oDbLogDevice = this.getDevice(sDevice);
			jQuery.sap.assert(oDbLogDevice, "DbLog Device " + sDevice + " not found in the metadata!");
			
			if (!oDbLogDevice) {
				return false;
			} 			
			
			jQuery.sap.assert((oDbLogDevice.Internals.TYPE === "DbLog"), "Device " + sDevice + " is not a Fhem DbLog device!");

			if (oDbLogDevice.Internals.TYPE !== "DbLog") {
				return false;
			} 
			
			var fnSuccess = mQuery.success;
			var fnError = mQuery.error;
			
			// prepare and submit service request
			let sCommand = "get " +  sDevice + " - webchart " 
						 + mQuery.from.date + "_" + mQuery.from.time + " " 
						 + mQuery.to.date + "_" + mQuery.to.time + " "
						 + mQuery.device + " timerange TIMESTAMP "  
		                 + mQuery.reading;
			
			this._fhemWebSocket.sendRequest({
				"event": FhemWebSocket.M_PUBLISH_EVENTS.dbLog,
				"data": sCommand,
			    "success": function(oData) {
					// call application handler
					fnSuccess(oData);
				}.bind(this),
			    "error": function(oError) {
					// call application handler
					fnError(oError);
			    }.bind(this)
			});
		
		};
				
		
		// Static properties and methods
		FhemService.dummyVar = "";
		FhemService.fooBar = function() {};
		
		
		// Private, statics section
		
		/**
		 * Handles successfully metadata request from Fhem backend.
		 * 
		 * Store metadata in the model instance and inform model change listeners 
		 * via OpenUI5 events.
		 * 
		 * Called by fhem.core.Service ws connection handler.
		 * 
		 * @params {oEvent} oEvent Event
		 * 					oEvent.getParameters() {de.kjumybit.fhem.service.Metadata}
		 */
		function _onMetaData(oEvent) {
			this.mFhemMetaData = oEvent.getParameters(); // { DeviceSet: [], RoomSet: [], DeviceTypeSet: [], DeviceTypeSet: [] };
			this.bMetaDataLoaded = true;
			this.fireMetaDataLoaded(this.mFhemMetaData);

		};

		
		/**
		 * 
		 * @param {Object} oData 
		 */
		function _onValueData(oData) {
			//TODO: evaluate Fhem data type
			if (oData) {
				
			}
		};
		
		
		/**
		 * 
		 * @param {Object} Data 
		 */
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