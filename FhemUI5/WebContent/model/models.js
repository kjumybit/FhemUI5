sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		/** 
		 * Create frontend device model
		 */
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		/**
		 * Create FMS backend configuration model
		 */
		createAppSettingsModel: function() {
			// load local web storage containing app configuration data
			jQuery.sap.require("jquery.sap.storage");
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oSettings = oStorage.get("appSettings");
			
			if (!oSettings) {
				// initialize storage
				oSettings = {
					"server": {
						"host": "192.168.0.1",
						"port": "8086"
					}
				}
			}
			
			// create model and set configuration data
			var oModel = new JSONModel(oSettings);
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		},
		
		/**
		 * Create side panel navigation list 
		 */
		createSideNavigationModel: function() {
			return new JSONModel("model/NavigationTree.json");
		}
	};
});