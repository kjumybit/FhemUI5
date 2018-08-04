/*
 *  
 */
sap.ui.define([
	"jquery.sap.global",
	'sap/ui/model/ClientModel',
	"./FhemWebSocket",
	'../base/Helper'
],
	function(jQuery, ClientModel, FhemWebSocket, Helper) {
		"use strict";
										
		var FhemService = ClientModel.extend("de.kjumybit.fhem.service.FhemService", /** @lends de.kjumybit.fhem.service.FhemService.prototype */ {
									
			/**
			 * 
			 */
			//TODO: document mSettings 
			constructor: function(mSettings) {
				ClientModel.apply(this, arguments);

				// var that = this;

				this.bMetaDataLoaded = false;
				this.bMetaDataFailed = false;
				
				this.mFhemMetaData = { 
						DeviceSet: [], 
						RoomSet: [], 
						DeviceTypeSet: [], 
						DeviceSubTypeSet: [] 
				};

				this.oData = {};

				// create new connection
				this._fhemWebSocket = new FhemWebSocket();
				
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
					"connectionClosed": {},
					"metaDataLoaded": {},				
					"metaDataLoadFailed": {},
					"deviceEvents": {}
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
		 * Fired, when the connection to the backend service could not be established.
		 *
		 * @name de.kjumybit.fhem.service.FhemService#connectionFailed
		 * @event
		 * @param {sap.ui.base.Event} oEvent
		 * @param {sap.ui.base.EventProvider} oEvent.getSource
		 * @param {object} oEvent.getParameters
		 * @public
		 */

		/**
		 * Fired, when the connection to the backend service has been closed.
		 *
		 * @name de.kjumybit.fhem.service.FhemService#connectionClosed
		 * @event
		 * @param {sap.ui.base.Event} oEvent
		 * @param {sap.ui.base.EventProvider} oEvent.getSource
		 * @param {object} oEvent.getParameters
		 * @public
		 */


		/**
		 * Fired, when the metadata document was successfully loaded.
		 *
		 * @name de.kjumybit.fhem.service.FhemService#metaDataLoaded
		 * @event
		 * @param {sap.ui.base.Event} oEvent
		 * @param {sap.ui.base.EventProvider} oEvent.getSource
		 * @param {object} oEvent.getParameters
		 * @param {object[]} oEvent.getParameters.DeviceSet
		 * @param {object[]} oEvent.getParameters.RoomSet
		 * @param {object[]} oEvent.getParameters.DeviceTypeSet
		 * @param {object[]} oEvent.getParameters.DeviceTypeSet
		 * @public
		 */


		/**
		 * Fired, when the metadata document fails to load.
		 *
		 * @name de.kjumybit.fhem.service.FhemService#metaDataLoadFailed
		 * @event
		 * @param {sap.ui.base.Event} oEvent
		 * @param {sap.ui.base.EventProvider} oEvent.getSource
		 * @param {object} oEvent.getParameters
		 * @public
		 */


		/**
		 * Fired, when one or more events for fhem devices has been triggerd by the backend service.
		 *
		 * @name de.kjumybit.fhem.service.FhemService#deviceEvents
		 * @event
		 * @param {sap.ui.base.Event} oEvent
		 * @param {sap.ui.base.EventProvider} oEvent.getSource
		 * @param {object} oEvent.getParameters
		 * @public
		 */


		/**
		 * Fire event <code>metadataLoaded</code> to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 * @param {object} [mArguments.metadata]  the metadata object.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @protected
		 */
		FhemService.prototype.fireMetaDataLoaded = function(mArguments) {
			this.fireEvent("metaDataLoaded", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the <code>metadataLoaded</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * @param {object}
		 *            [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object}
		 *            [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.attachMetaDataLoaded = function(oData, fnFunction, oListener) {
			this.attachEvent("metaDataLoaded", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the <code>metadataLoaded</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs.
		 * @param {object}
		 *            oListener Object on which the given function had to be called.
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.detachMetaDataLoaded = function(fnFunction, oListener) {
			this.detachEvent("metaDataLoaded", fnFunction, oListener);
			return this;
		};


		/**
		 * Fire event <code>metaDataLoadFailed</code> to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @protected
		 */
		FhemService.prototype.fireMetaDataLoadFailed = function(mArguments) {
			this.fireEvent("metaDataLoadFailed", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the <code>metaDataLoadFailed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * @param {object}
		 *            [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object}
		 *            [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.attachMetaDataLoadFailed = function(oData, fnFunction, oListener) {
			this.attachEvent("metaDataLoadFailed", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the <code>metaDataLoadFailed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs.
		 * @param {object}
		 *            oListener Object on which the given function had to be called.
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.detachMetaDataLoadFailed = function(fnFunction, oListener) {
			this.detachEvent("metaDataLoadFailed", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event <code>connectionFailed</code> to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @protected
		 */
		FhemService.prototype.fireConnectionFailed = function(mArguments) {
			this.fireEvent("connectionFailed", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the <code>connectionFailed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * @param {object}
		 *            [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object}
		 *            [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.attachConnectionFailed = function(oData, fnFunction, oListener) {
			this.attachEvent("connectionFailed", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the <code>connectionFailed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs.
		 * @param {object}
		 *            oListener Object on which the given function had to be called.
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.detachConnectionFailed = function(fnFunction, oListener) {
			this.detachEvent("connectionFailed", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event <code>connectionClosed</code> to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @protected
		 */
		FhemService.prototype.fireConnectionClosed = function(mArguments) {
			this.fireEvent("connectionClosed", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the <code>connectionClosed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * @param {object}
		 *            [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object}
		 *            [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.attachConnectionClosed = function(oData, fnFunction, oListener) {
			this.attachEvent("connectionClosed", oData, fnFunction, oListener);
			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the <code>connectionClosed</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs.
		 * @param {object}
		 *            oListener Object on which the given function had to be called.
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.detachConnectionClosed = function(fnFunction, oListener) {
			this.detachEvent("connectionClosed", fnFunction, oListener);
			return this;
		};

		/**
		 * Fire event <code>deviceEvents</code> to attached listeners.
		 *
		 * @param {object} [mArguments] the arguments to pass along with the event.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @protected
		 */
		FhemService.prototype.fireDeviceEvents = function(mArguments) {
			this.fireEvent("deviceEvents", mArguments);
			return this;
		};

		/**
		 * Attach event-handler <code>fnFunction</code> to the <code>deviceEvents</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * @param {object}
		 *            [oData] The object, that should be passed along with the event-object when firing the event.
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs. This function will be called on the
		 *            oListener-instance (if present) or in a 'static way'.
		 * @param {object}
		 *            [oListener] Object on which to call the given function. If empty, the global context (window) is used.
		 *
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.attachDeviceEvents = function(oData, fnFunction, oListener) {
			this.attachEvent("deviceEvents", oData, fnFunction, oListener);

			// register local event handler for Fhem device events 
			this._fhemWebSocket.attachDeviceEvents(function(oEvent) {
				this.fireDeviceEvents(oEvent);
			}, this);			

			// subscribe to Fhem device events 
			this._fhemWebSocket.subscribeEvent(FhemWebSocket.M_SUBSCRIBE_EVENTS.deviceEvents.onEvent);

			return this;
		};

		/**
		 * Detach event-handler <code>fnFunction</code> from the <code>deviceEvents</code> event of this <code>de.kjumybit.fhem.service.FhemService</code>.
		 *
		 * The passed function and listener object must match the ones previously used for event registration.
		 *
		 * @param {function}
		 *            fnFunction The function to call, when the event occurs.
		 * @param {object}
		 *            oListener Object on which the given function had to be called.
		 * @return {de.kjumybit.fhem.service.FhemService} <code>this</code> to allow method chaining
		 * @public
		 */
		FhemService.prototype.detachDeviceEvents = function(fnFunction, oListener) {
			this.detachEvent("deviceEvents", fnFunction, oListener);
			return this;
		};


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
		 * @param {String} sDevice Fhem device name
		 * @param {Object} mQuery  Query parameters
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
				return;
			} 			
			
			jQuery.sap.assert((oDbLogDevice.Internals.TYPE === "DbLog"), "Device " + sDevice + " is not a Fhem DbLog device!");

			if (oDbLogDevice.Internals.TYPE !== "DbLog") {
				return;
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
		 * @param {object} oEvent Event
		 * 					oEvent.getParameters() {de.kjumybit.fhem.service.Metadata}
		 */
		function _onMetaData(oEvent) {
			this.mFhemMetaData = oEvent.getParameters(); // { DeviceSet: [], RoomSet: [], DeviceTypeSet: [], DeviceTypeSet: [] };
			this.bMetaDataLoaded = true;
			this.fireMetaDataLoaded(this.mFhemMetaData);

			// register local event handler for Fhem device events 
			this._fhemWebSocket.attachDeviceEvents(function(oEvent) {
				this.fireDeviceEvents(oEvent);
				// TODO update local readings model for Device
			}, this);			
		
			// subscribe to Fhem device events 
			this._fhemWebSocket.subscribeEvent(FhemWebSocket.M_SUBSCRIBE_EVENTS.deviceEvents.onEvent);
		};

		
		/**
		 * Handle successful Fhem connection
		 * Retrieve Fhem metadata via web socket connection.
		 * 
		 * @param {de.kjumybit.fhem.service.FhemService} oFhemService Service Model
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
		

		/**
		 * Handle failed Fhem connection
		 * Retrieve Fhem metadata via web socket connection.
		 * 
		 * @param {de.kjumybit.fhem.service.FhemService} oFhemService Service Model
		 */

		function _onErrorFhemConnection(oFhemService) {
			oFhemService.fireConnectionFailed(null);
		};

		
		/**
		 * Handle disconnect from Fhem service
		 * Retrieve Fhem metadata via web socket connection.
		 * 
		 * @param {de.kjumybit.fhem.service.FhemService} oFhemService Service Model
		 */

		function _onFhemDisconnect(oFhemService) {
			oFhemService.fireConnectionClosed(null);
			//TODO refresh internal data
		};
		
				
		return FhemService;

	}, /* bExport= */ true);