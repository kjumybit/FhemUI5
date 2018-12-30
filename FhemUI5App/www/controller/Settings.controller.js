/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([
	'jquery.sap.global',
	'de/kjumybit/fhem/controller/BaseController',
	'de/kjumybit/fhem/model/formatter',
	'de/kjumybit/fhem/model/grouper'
], function(jQuery, BaseController, Formatter, Grouper) {
	"use strict";

	const _sComponent = "DeviceOverview";	

	return BaseController.extend("de.kjumybit.fhem.controller.Overview", {

		
		// init local members
		formatter: Formatter,
		grouper: Grouper,
			
		/**
		* Called when a controller is instantiated and its View controls (if available) are already created.
		* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		*/
		onInit: function() {

			// call the base component's init function
			BaseController.prototype.onInit.apply(this, arguments);
		},


		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		*/
		onBeforeRendering: function() {

			jQuery.sap.log.debug("onBeforeRendering", null, _sComponent);	

			// set own navigation button
			let bMaster = !this.getSplitAppObj().isMasterShown();
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', bMaster);

			// hide master button
			this.hideDefaultMasterButton();

			// initialization on display view
			//this.onDisplay();
		},


		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */
	

		/**
		 * Handles press on button Save.
		 * Check and save all current settings
		 * Close settings view and return to previous detail view.
		 * 
		 * @param {oEvent} oEvent Button event parameter
		 */
		onSettingsSave: function(oEvent) {

			this.oSettings = this.oSettings || this.getSettings();

			// Fhem server 
			if ( this.oSettings.isComplete() ) {
				this.oSettings.save();
				// (re) connect to Fhem backend server and get metadata model				
				this.createFhemModel(this.oSettings);
			}			

			this.onDetailBackBtnPress(oEvent);
		},


		/**
		 * Handles press on button Decline.
		 * Discard all changes. 
		 * Close settings view and return to previous detail view.
		 * 
		 * @param {oEvent} oEvent Button event parameter
		 */
		onSettingsCancel: function(oEvent) {
			this.onDetailBackBtnPress(oEvent);
		},


		onSettingsBackBtnPress: function(oEvent) {
			this.onDetailBackBtnPress(oEvent);
		}	
	
	});
});
