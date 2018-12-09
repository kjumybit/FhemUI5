sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	// private methods
	
	// pubic methods
	return {

		/** 
		 * Create frontend device model
		 * 
		 * @returns {sap/ui/model/json/JSONModel} Device model
		 */
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		
		/**
		 * Create runtime model
		 * 
		 * @returns {sap/ui/model/json/JSONModel} Runtime model
		 */
		createRuntimeModel: function() {
			let mState = {
				fhemConnection : {
					isConnected : false,
					enableDeviceUpdates: true
				}
			};
			return new JSONModel(mState);
		},
		
				
		/**
		 * Create user dialog model
		 * 
		 * @returns {sap/ui/model/json/JSONModel} Runtime model
		 */
		createUserDialogModel: function() {
			return new JSONModel({
				//TODO
			});
		},
				
	};
});