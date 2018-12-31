/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */

// Provides WebSocket Connection to Fhem server
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/model/ClientModel',
	'sap/ui/model/Context',
	'./FhemServicePropertyBinding',
	'./FhemServiceListBinding',	
	'./FhemWebSocket',
	'../base/Helper'
],
	function(jQuery, ClientModel, Context, FhemServicePropertyBinding, FhemServiceListBinding, FhemWebSocket, Helper) {
		"use strict";

		const _sComponent = "FhemService";	

		/**
		 * Constructor for a new Fhem Service.
		 *  
		 * @class Model implementation for Fhem Backend Service.
		 *
		 * A FhemService class implements a server side model for entities of the 
		 * backend Fhem home automation server. 
		 * 
		 * <li><code>/Device</code>device data for a device <code>DeviceId</code)> with
		 *   <li><code>/Device/<DeviceId>/Internals[]</code> Internal properties list<li>
		 *   <li><code>/Device/<DeviceId>/Readings[]</code> Value list</li>
		 *   <li><code>/Device/<DeviceId>/Attributes[]</code> Configuration attributes list</li>
		 * </li>
		 * 
		 * <li><code>/DeviceSet[]</code>device list> with
		 *   <li><code>InternalSet</code> Internal properties<li>
		 *   <li><code>InternalSet</code> Internal properties list<li>
		 *   <li><code>Readings</code> Values</li>
		 *   <li><code>ReadingSet</code> Values list</li>
		 *   <li><code>Attributes</code> Configuration attributes</li>
		 *   <li><code>AttributeSet</code> Configuration attributes list</li>
		 * </li>
		 * 
		 * TODO: Room Set
		 * TODO: 
		 * <li>propagation of device events to bound UI controls
		 * </li>
		 * 
		 * @extends sap.ui.model.ClientModel
		 *
		 * @author kjumybit
		 * @version 
		 *
		 * @param {object} mSettings Fhem service configuration 
		 * @constructor
		 * @public
		 * @alias de.kjumybit.fhem.service.FhemService"
		 */		
		var FhemService = ClientModel.extend("de.kjumybit.fhem.service.FhemService", /** @lends de.kjumybit.fhem.service.FhemService.prototype */ {
									
			constructor: function(mSettings) {

				jQuery.sap.log.debug("constructor: begin", null, _sComponent);

				ClientModel.apply(this, arguments);

				// var that = this;

				this.bMetaDataLoaded = false;
				this.bMetaDataFailed = false;
				this.bEnabledEventUpdate = true;
				
				this.mFhemMetaData = { 
						DeviceSet: [], 
						RoomSet: [], 
						DeviceTypeSet: [], 
						DeviceSubTypeSet: [] 
				};

				this.oData = {};
				this.setDefaultBindingMode("OneWay");

				if (mSettings && mSettings.host && mSettings.port) {
					// create new (initial) connection
					this._connect(mSettings);
				}

				jQuery.sap.log.debug("constructor: end", null, _sComponent);				
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
					"getEnabledEventUpdate",
					"setEnabledEventUpdate",
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

			if ( !this.hasListeners("deviceEvents") ) {
				// detach local event handler from FhemWebSocket connection
				//TODO: detach private instance method
				//this._fhemWebSocket.attachDeviceEvents( _onSuccessFhemConnection, this);	
			}

			return this;
		};


		/**
		 * Connect to Fhem backend
		 * A new WebSocket connection is established to the fhem backend. 
		 * A current connection will be disconnected before.
		 * 
		 * @param {object} mParameters Connection Parameters
		 * @private
		 */
		FhemService.prototype._connect = function(mParameters) {

			// disconnect current active connection
			//TODO

			// create new connection
			this._fhemWebSocket = new FhemWebSocket();
			
			// connect to Fhem
			this._fhemWebSocket.connect({ 
				host: mParameters.host , 
				port: mParameters.port,
				onErrorFhemConnection: _onErrorFhemConnection,
				onFhemDisconnect: _onFhemDisconnect,
				onSuccessFhemConnection: _onSuccessFhemConnection,
				oListener: this
			})
		}


		/**
		 * Connect to Fhem backend
		 * 
		 * @param {object} mParameters Connection Parameters
		 * 
		 * @return {de.kjumybit.fhem.service.FhemService} <code>This</code> for method chaining
		 * @public
		 */
		FhemService.prototype.connect = function(mParameters) {
			this._connect(mParameters);
			return this.this;
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
		 * Enable or disable listening for Fhem device update events.
		 * 
		 * @param {boolean} bEnabled Enable or disable device event updates
		 */
		FhemService.prototype.setEnabledEventUpdate = function(bEnabled) {
			this.bEnabledEventUpdate = bEnabled;
			jQuery.sap.log.info("Enable device event updates: " + this.bEnabledEventUpdate, null, _sComponent);
		};


		/**
		 * Get state if Fhem device update events are handled.
		 * 
		 * @return {boolean} Device event updates enbabled
		 */
		FhemService.prototype.getEnabledEventUpdate = function() {
			return this.bEnabledEventUpdate;
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
				

		/**
		 * Sets the JSON encoded data to the model.
		 *
		 * @param {object} oData the data to set on the model
		 * @param {boolean} [bMerge=false] whether to merge the data instead of replacing it
		 *
		 * @public
		 */
		FhemService.prototype.setData = function(oData, bMerge){
			if (bMerge) {
				// do a deep copy
				this.oData = jQuery.extend(true, Array.isArray(this.oData) ? [] : {}, this.oData, oData);
			} else {
				this.oData = oData;
			}
			this.checkUpdate();
		};


		/**
		 * Sets a new value for the given property <code>sPropertyName</code> in the model.
		 * If the model value changed all interested parties are informed.
		 *
		 * @param {string}  sPath path of the property to set
		 * 					Supported paths are: 
		 *                  <li><code>/DeviceSet</code>device data for a device <code>DeviceId</code)> with
		 *                      <li><code>/Device/DeviceId/Internals</code> Internal properties list<li>
		 *                  	<li><code>/Device/DeviceId/Internals</code> Internal properties list<li>
		 *   					<li><code>/Device/DeviceId/Readings</code> Value list</li>
		 *   					<li><code>/Device/DeviceId/Attributes</code> Configuration attributes list</li>
		 * 					</li>
		 * 
		 * @param {object} oValue an object in the format expected by the supported path
		 * @param {object} [oContext=null] the context which will be used to set the property
		 * @param {boolean} [bAsyncUpdate] whether to update other bindings dependent on 
		 * 								   this property asynchronously
		 * @return {boolean} true if the value was set correctly and false if errors occurred 
		 * 					 like the entry was not found.
		 * @public
		 */
		FhemService.prototype.setProperty = function(sPath, oValue, oContext, bAsyncUpdate) {
			
			// let bIsRelative = typeof sPath == "string" && !jQuery.sap.startsWith(sPath, "/");

			var sResolvedPath = this.resolve(sPath, oContext),
				iLastSlash, sObjectPath, sProperty;

			// return if path / context is invalid
			if (!sResolvedPath) {
				return false;
			}

			// If data is set on root, call setData instead
			if (sResolvedPath == "/") {
				this.setData(oValue);
				return true;
			}

			iLastSlash = sResolvedPath.lastIndexOf("/");
			// In case there is only one slash at the beginning, sObjectPath must contain this slash
			sObjectPath = sResolvedPath.substring(0, iLastSlash || 1);
			sProperty = sResolvedPath.substr(iLastSlash + 1);
	
			var oObject = this._getObject(sObjectPath);
			if (oObject) {
				oObject[sProperty] = oValue;			
				this.checkUpdate(false, bAsyncUpdate);
				return true;
			}

			return false;
		};


		/**
		 * Returns the value for the property with the given <code>sPropertyName</code>
		 *
		 * @param {string} sPath the path to the property
		 * 					Supported paths are: 
		 * 						"/xxxx" 
		 * @param {sap.ui.model.Context} [oContext=null] the context which will be used 
		 *                 to retrieve the property
		 * @return {any} the value of the property
		 * @public
		 */
		FhemService.prototype.getProperty = function(sPath, oContext) {

			// let bIsRelative = typeof sPath == "string" && !jQuery.sap.startsWith(sPath, "/")

			return this._getObject(sPath, oContext);
		};


		/**
		 * @see sap.ui.model.Model.prototype.bindProperty
		 * The PropertyBinding is used to access a value of a single entity in the Fhem data model.
		 */
		FhemService.prototype.bindProperty = function(sPath, oContext, mParameters) {
			var oBinding = new FhemServicePropertyBinding(this, sPath, oContext, mParameters);
			return oBinding;
		};


		/**
		 * @see sap.ui.model.Model.prototype.bindList
		 *
		 */
		FhemService.prototype.bindList = function(sPath, oContext, aSorters, aFilters, mParameters) {
			var oBinding = new FhemServiceListBinding(this, sPath, oContext, aSorters, aFilters, mParameters);
			return oBinding;
		};


		/**
		 * @param {string} sPath Path to Fhem entity
		 * @param {object|sap.ui.model.Context} [oContext]  The Context is a pointer to an object in the model data, 
		 * 			which is used to allow definition of relative bindings
		 * @returns {any} the node of the specified path/context
		 * @private
		 */
		FhemService.prototype._getObject = function (sPath, oContext) {

			var oNode = null;
			
			if (oContext instanceof Context) {
				oNode = this._getObject(oContext.getPath());
			} else if (oContext) {
				oNode = oContext;
			}
			if (!sPath) {
				return oNode;
			}
			var aParts = sPath.split("/"),
				iIndex = 0;

			if (!aParts[0]) {
				// absolute path starting with slash
				oNode = this.oData;
				iIndex++;
			}

			if ( oNode && !Object.keys(oNode).length ) {
				// oNode is an empty object "{}"; there is no model / context content at this time
				return oNode;
			}

			// search node relative to oNode
			while (oNode && aParts[iIndex]) {

				// get property or array index for aParts[iIndex]
				// - either as an name of an property: p => o[p] 
				// - or     as an array index        : i => o[i], i: 0,...,n-1	
				// - or     as entity with key       : e(k) => o.es[k]				//TODO
				let nameOrIndex = _getNameOrIndex(aParts[iIndex], oNode);

				jQuery.sap.assert(nameOrIndex, "FhemService._getObject: no key for path " + sPath);

				oNode = ( typeof nameOrIndex === "object" ? oNode[nameOrIndex.entitySetName][nameOrIndex.entityIndex] : oNode[nameOrIndex]);
				// works for object[property] as well as array[index]
				// aParts[iIndex] is either a property name or an array index

				iIndex++;
			}
			return oNode;
		};


		/**
		 * 
		 */
		FhemService.prototype.isList = function(sPath, oContext) {
			var sAbsolutePath = this.resolve(sPath, oContext);
			return Array.isArray(this._getObject(sAbsolutePath));
		};


		/**
		 * Update device reading valuas from Fhem device events.
		 * Trigger binding updates.
		 * 
 		 * @param {object} oEvent Containter for Fhem device events
		 * @private
		 */
		FhemService.prototype._updateModelForDeviceEvents = function(oEvent) {
			
			let aEvents = oEvent.getParameter("events");
			let bUpdate = false;

			jQuery.sap.assert(Array.isArray(aEvents), "FhemService._updateModelForDeviceEvents: unexpected data type for oEvent" );
			
			for (var i=0, iL=aEvents.length; i<iL; i++) {

				let oDeviceEvent = aEvents[i];
				// get model property for device
				let oDevice = getArrayObjectByProperty("Name", oDeviceEvent.deviceName, this.oData.DeviceSet);

				if (oDevice) {
					// get or initialize device reading
					_setReadingForDevice(oDevice, oDeviceEvent.reading, oDeviceEvent.value, oDeviceEvent.timeStamp);
					bUpdate = true;

					jQuery.sap.log.debug("Update device reading " +  oDeviceEvent.deviceName + " " + oDeviceEvent.reading + ": " +oDeviceEvent.value, 
						null, _sComponent);
				} else {
					jQuery.sap.log.error("Unknown device for event update" + oDeviceEvent.deviceName, null, _sComponent);
				};
			}

			if (bUpdate) {
				this.checkUpdate();
			}
		};


		// Static properties and methods
		FhemService.dummyVar = "";
		FhemService.fooBar = function() {};
				

		/**
		 * Handles successfully metadata request from Fhem backend.
		 * - Build Fhem service model data and inform model change listeners.
		 * - Registers local event handler for Fhem device events.
		 * 
		 * Called by fhem.core.Service ws connection handler.
		 * 
		 * @param {object} oEvent Event
		 * 					oEvent.getParameters() {de.kjumybit.fhem.service.Metadata}
		 */
		function _onMetaData(oEvent) {
			
			// this referencec a FhemService  instance

			// { DeviceSet: [], RoomSet: [], DeviceTypeSet: [], DeviceTypeSet: [] };
			this.mFhemMetaData = oEvent.getParameters(); 
			this.setData( _buildModel(this.mFhemMetaData) );

			this.bMetaDataLoaded = true;
			this.fireMetaDataLoaded(this.mFhemMetaData);

			// register local event handler for Fhem device events (only once)
			if ( !this._fhemWebSocket.hasListeners("deviceEvents") ) {
				this._fhemWebSocket.attachDeviceEvents( _onDeviceEvent, this);			
			}
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
		

		/**
		 * Handle Fhem device event
		 * Update local model and inform UI listeners
		 * 
		 * @param {de.kjumybit.fhem.service.FhemService} oFhemService Service Model
		 */
		function _onDeviceEvent(oEvent) {
			
			// this referencec a FhemService  instance
			jQuery.sap.log.debug("onDeviceEvent: is model update enabled: " + this.bEnabledEventUpdate, null, _sComponent);

			if (this.bEnabledEventUpdate) {
				this._updateModelForDeviceEvents(oEvent);
				this.fireDeviceEvents(oEvent);
			}
		};


		// Meta data for Fhem entities
		const _rEntityKey = /(.+)(\(.+\))/;
		const _aFhemEntities = [
			({ entity: "DeviceSet", key: "Name", pattern: /Device\((.+)\)/ }),
			({ entity: "ReadingSet", key: "Name", pattern: /ReadingSet\((.+)\)/ }),
			({ entity: "InternalSet", key: "Name", pattern: /InternalSet\((.+)\)/ }),
			({ entity: "AttributeSet", key: "Name", pattern: /AttributeSet\((.+)\)/ }),								
			({ entity: "RoomSet", key: "Name", pattern: /Room\((.+)\)/ }),
			({ entity: "DeviceTypeSet", key: "Name", pattern: /DeviceTypeSet\((.+)\)/ }),
			({ entity: "DeviceSubTypeSet", key: "Name", pattern: /DeviceSubTypeSet\((.+)\)/ }),
		];


		/**
		 * Return property name in object <code>oNode</code> if <code>sKey</code> doesn't contain an 
		 * Fhem entity key otherwise the array index for enity key with <code>oNode</code> as array.
		 * 
		 * Supported Fhem entities:
		 * - Device(<id>)/
		 * - Reading(<id>)/
		 * - Internal(<id>)/
		 * - Attribute(<id>)/
		 * - Room(<id>)/
		 * - DeviceType(<id>)/
		 * - DeviceSubType(<id>)/
		 * 
		 * @param {string} sKey Property name <code>entity_property</code> or 
		 * 				   entity key <code>entity_set(entity_id)</code>
		 * @param {object} oNode Object node in Fhem model
		 * @returns {string|number|object} Property name or array index or
		 *                                 property and index of the entity
		 */
		function _getNameOrIndex(sKey, oNode) {

			let nameOrIndex = sKey;	// default

			// basic check for an entity with key
			if (sKey.match(_rEntityKey)) {

				let index = null;
				nameOrIndex = null;

				// check for the supported entity
				for (let i=0, iL=_aFhemEntities.length; i<iL; i++) {
					let aEntity = sKey.match(_aFhemEntities[i].pattern);
					if (aEntity) {
						// known entity type: find index for entity with key in oNode (as Array)
						// the regex returns the extracted Device ID in aEntity[1]						
						index = getArrayIndexForObjectByProperty(_aFhemEntities[i].key, aEntity[1], oNode[_aFhemEntities[i].entity]);
						if (typeof index !== 'undefined') {
							nameOrIndex = {
								entitySetName:  _aFhemEntities[i].entity,	// name of node property (array) for entity set
								entityIndex: index						    // index of entity (object) referenced by key
							};
							break;
						}
					}
				}
			}

			return nameOrIndex;
		};


		/**
		 * Build model data from Fhem metadata
		 * Retrieve Fhem metadata via web socket connection.
		 * 
		 * @param {object} oMetaData Fhem metadate
		 * 					{ DeviceSet: [], RoomSet: [], DeviceTypeSet: [], DeviceTypeSet: [] }
		 * 
		 * @returns {object} FhemService model data
		 * 					{	
		 * 						DeviceSet: [{
		 * 							"Name": string,
		 * 							"Internals": { 
		 * 								<I>: Internal, ..., 
		 * 								<I>: Internal 
		 * 							},
		 *  					    "InternalSet": [ { "Name": <I>, "Data": Internal } ],
		 * 							"Readings": { 
		 * 								<R>: Reading, ..., 
		 * 								<R>: Reading 
		 * 							},
		 * 							"ReadingSet": [ { "Name: "<R>, "Data": Reading } ],
		 *  						"Attributes": { 
		 * 								<A>: Attribute, ..., 
		 * 								<A>: Attribute 
		 * 							},
		 *  						"AttributeSet": [ { "Name": <A>, "Data": Attribute } ] 
		 * 						}], 
		 * 						RoomSet: [ string ], 
		 * 						DeviceTypeSet: [ string ], 
		 * 						DeviceSubTypeSet: [ string ]
		 * 					}
		 * 
		 * <Reading>: {
		 * 		"Value":"alive:3 dead:0 unkn:0 off:0", 
		 * 		"Time":"2017-05-31 23:02:28"
		 * }
		 * 
		 * <Internal>: "alive:3 dead:0 unkn:0 off:0"
		 * 
		 * <Attribute>: "ActionDetector" 
		 * 
		 */
		function _buildModel(oMetaData) {

			jQuery.sap.log.debug("Build Fhem service model", null, _sComponent);	

			let oModel = {};
			
			// Devices Set and Device properties sets
			oModel.DeviceSet = oMetaData.DeviceSet;
			oModel.DeviceSet.forEach(oDevice => {
				// build InternalSet
				oDevice.InternalSet = [];
				for (let i in oDevice.Internals) {
					oDevice.InternalSet.push({ "Name": i,  "Data": oDevice.Internals[i] });
				};
				// build ReadingSet
				oDevice.ReadingSet = [];
				for (let r in oDevice.Readings) {
					oDevice.ReadingSet.push({ "Name": r, "Data": oDevice.Readings[r] });
				};
				// build AttributSet
				oDevice.AttributeSet = [];
				for (let a in oDevice.Attributes) {
					oDevice.AttributeSet.push({ "Name": a, "Data": oDevice.Attributes[a] });
				};
			});

			// Room Set
			oModel.RoomSet = oMetaData.RoomSet;

			// Device Type Set
			oModel.DeviceTypeSet = oMetaData.DeviceTypeSet;

			// Sub Device Type Set
			oModel.DeviceSubTypeSet = oMetaData.DeviceSubTypeSet;

			return oModel;
		};

		
		/**
		 * Set or update a device reading value in the model data
		 *
		 * @param {object} oDevice Fhem device 
		 * @param {string} sReadingId Reading name
		 * @param {string} sValue Reading value
		 * @param {string} sTimeStamp Time stamp the reading value has been set
		 */
		function _setReadingForDevice(oDevice, sReadingId, sValue, sTimeStamp) {

			jQuery.sap.assert(oDevice && sReadingId && sValue, "FhemService._setReadingForDevice(): Invalid parameter" );
			
			// set named property
			let oData = oDevice.Readings[sReadingId];
			if (!oData) {
				// create new reading with initial values
				jQuery.sap.log.info("FhemService._setReadingForDevice(): Set new device reading " + oDevice.Name + "." + sReadingId, null, _sComponent);	
				oData = { Value: "", Time: "" }
				oDevice.Readings[sReadingId] = oData;
				oDevice.ReadingSet.push({ "Name": sReadingId, "Data": oData })	
			}

			// update reading value
			oData.Value = sValue;
			oData.Time = sTimeStamp;

			// update property array element
			let oReading = getArrayObjectByProperty("Name", sReadingId, oDevice.ReadingSet);
			jQuery.sap.assert(oReading, "FhemService._setReadingForDevice(): Unknown device reading " + oDevice.Name + "." + sReadingId );
			// don't change object refernce
			oReading.Data = oData;
		};


		/**
		 * Get first object in array property value 
		 * @param {string} sProperty the name of an object property 
		 * @param {object} value the property value
		 * @param {object[]} aArray an array of JSON objects
		 * @return {object} the first object which match property value
		 *                   or undefined, of no object has been found
		 */
		function getArrayObjectByProperty( sProperty, value, aArray) {
			var oElement = undefined;
			for (var i=0, iL=aArray.length; i<iL; i++) {
				var o = aArray[i];
				if (o[sProperty] && o[sProperty] === value) {
					oElement = o;
					break;
				}
			}
			return oElement;
		};		


		/**
		 * Get first object in array property value 
		 * @param {string} sProperty the name of an object property 
		 * @param {object} value the property value
		 * @param {object[]} aArray an array of JSON objects
		 * @return {i} index of the first object which match property value
		 *                   or undefined, of no object has been found
		 */
		function getArrayIndexForObjectByProperty(sProperty, value, aArray) {
			var idx = undefined;
			for (var i=0, iL=aArray.length; i<iL; i++) {
				let o = aArray[i];
				if (o[sProperty] && o[sProperty] === value) {
					idx = i;
					break;
				}
			}
			return idx;
		};		

		return FhemService;

	}, /* bExport= */ true);