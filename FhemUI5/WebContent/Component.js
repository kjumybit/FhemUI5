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

			// set the initial side navigation model (level 1)
			this.setModel(Models.createSideNavigationModel(), "sideNavigation");
			
			// set the local app configuration model
			var oAppSettingsModel = Models.createAppSettingsModel();
			this.setModel(oAppSettingsModel, "settings" );

			// connect to Fhem backend server and get metadata model
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
					
			this._fhemModel = new fhem.model.Model({
				host: 'localhost', port: '8086',
				onConnection: this._onFhemConnection.bind(this),
				onMetaDataLoaded: this._onMetaDataLoaded.bind(this),
				onConnectionFailed: this._onErrorFhemConnection.bind(this),
				onDisconnected: this._onFhemDisconnect.bind(this)			
			});
			
		},

		_onFhemConnection : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},

		
		_onErrorFhemConnection : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},
		
		_onFhemDisconnect : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},

		
		/**
		 * Handle Fhem metadata 
		 * Set & update local models
		 * - Fhem data model
		 * - Side navigation model 
		 */
		_onMetaDataLoaded : function(oEvent) {
			
			this._setRuntimeFhemConnectionState(true);
			var oModel = new JSONModel();
			oModel.setData(this._fhemModel.getMetaData());
			// oModel.loadData("model/fhemJsonList2.json"); // local testing
			this.setModel(oModel, "fhemMetaData" );  
			this._setSideNavModelfromFhem();
		},
		
		
		/**
		 * update Fhem connection state in runtime model 
		 */
		_setRuntimeFhemConnectionState: function( bConnected ) {
			
			this.oState.fhemConnection.isConnected = bConnected;
			var oModel = this.getModel("runtime");
			oModel.setProperty("/fhemConnection/isConnected", bConnected);
		},
		
		
		/**
		 * Update sideNavigation model with Fhem metadata
		 * - Groups (TODO)
		 * - Rooms
		 * - Device Types
		 * - Device Sub Types 
		 */
		_setSideNavModelfromFhem: function() {
			
			var oFhemData = this._fhemModel.getMetaData();
			var oNavModel = this.getModel("sideNavigation");
			var oNavItems = oNavModel.getProperty("/appNavTree/dynamicItems");
			
			// iterate over all main navigation items (Fhem categories) and
			// add corresponding Fhem items to as sub item to current navigation item
			for (var i=0, iL=oNavItems.length; i<iL; i++ ) {
				if (oNavItems[i].fhemModelRef.setName) {
					
					oNavItems[i].items = [];	
					var aFhemItems = oFhemData[oNavItems[i].fhemModelRef.setName];
					if (!aFhemItems) continue;
					
					for (var j=0, jL=aFhemItems.length; j<jL; j++) {
						oNavItems[i].items.push({
							"itemId": (oNavItems[i].fhemModelRef.nameProperty ? aFhemItems[j][oNavItems[i].fhemModelRef.nameProperty] : aFhemItems[j] ) 
						});
					}
				}
			}
			// update navigation model
			oNavModel.setProperty("/appNavTree/dynamicItems", oNavItems);
		}
		
	});
})