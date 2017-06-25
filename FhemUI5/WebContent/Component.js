sap.ui.define([ 
	"sap/ui/core/UIComponent", 
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel", 
	"de/kjumybit/fhem/model/models" 
], function(UIComponent, Device, JSONModel, Models) {
	"use strict";

	return UIComponent.extend("de.kjumybit.fhem.Component", {

		metadata : {
			manifest : "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the
		 * startup of the app and calls the init method once.
		 * 
		 * @public
		 * @override
		 */
		init : function() {

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();

			// initialize component runtime state and model
			this.oState = {
					fhemConnection : {
						hasParameters : false,
						isConnected : false,
					}
			};
			var oStateModel = new JSONModel(this.oState);
			this.setModel(oStateModel, "runtime");
			
			// set the device model
			this.setModel(Models.createDeviceModel(), "device");

			// set the local app configuration model
			var oAppSettingsModel = Models.createAppSettingsModel();
			this.setModel(oAppSettingsModel, "settings" );

			// connect to Fhem backend server
			if ( oAppSettingsModel.getProperty("/server/host") && 
				 oAppSettingsModel.getProperty("/server/port") ) {
				
				this.oState.fhemConnection.hasParameters = true;
				this._getFhemModel();
			}
			
			
		},

		/**
		 * The content density adapts itself based on the device type
		 */
		getContentDensityClass : function() {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		
						
		/**
		 * Establish connection to Fhem backend server 
		 */
		_getFhemModel : function () {
			
			jQuery.sap.require("fhem.model");
			//this._fhemModel = fhem.model.Model({ host: 'himberrypi.fritz.box', port: '8086'});					
			this._fhemModel = new fhem.model.Model({
				host: 'localhost', port: '8086',
				onConnection: this._onFhemConnection.bind(this),
				onMetaDataLoaded: this._onMetaDataLoaded.bind(this),
				onConnectionFailed: this._onErrorFhemConnection.bind(this),
				onDisconnected: this._onFhemDisconnect.bind(this)			
			});
			
		},

		_onFhemConnection : function(oEvent) {
			// this is bound to the component
			this._setRuntimeFhemConnectionState(false);
		},

		
		_onErrorFhemConnection : function(oEvent) {
			// this is bound to the component
			this._setRuntimeFhemConnectionState(false);
		},
		
		_onFhemDisconnect : function(oEvent) {
			// this is bound to the component
			this._setRuntimeFhemConnectionState(false);
		},
		
		_onMetaDataLoaded : function(oEvent) {
			// this is bound to the component
			this._setRuntimeFhemConnectionState(true);
		},
		
		/**
		 * update Fhem connection state in runtime model 
		 */
		_setRuntimeFhemConnectionState: function( bConnected ) {
			
			this.oState.fhemConnection.isConnected = bConnected;
			var oModel = this.getModel("runtime");
			oModel.setProperty("/fhemConnection/isConnected", bConnected);
			
		}
	});
})