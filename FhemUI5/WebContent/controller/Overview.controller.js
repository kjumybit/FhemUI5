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
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	'de/kjumybit/fhem/model/formatter',
	'de/kjumybit/fhem/model/grouper'
], function(jquery, BaseController, MessagePopover, MessagePopoverItem, Formatter, Grouper) {
	"use strict";

	const _sComponent = "DeviceOverview";	

	return BaseController.extend("de.kjumybit.fhem.controller.Overview", {

		
		// init local members
		formatter: Formatter,
		grouper: Grouper,
			
		/**
		* Called when a controller is instantiated and its View controls (if available) are already created.
		* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		* @memberOf helloworld.Main
		*/
		onInit: function() {

					
		},


		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		* @memberOf helloworld.Main
		*/
		onBeforeRendering: function() {

			jQuery.sap.log.debug("onBeforeRendering", null, _sComponent);	

			// set own navigation button
			let bMaster = this.getSplitAppObj().isMasterShown();
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', !bMaster);

			// hide master button
			let oMasterBtn = this.getOwnerComponent().getRootControl().byId('app-MasterBtn');
			if (oMasterBtn) { oMasterBtn.setVisible(false); }

			// initialization on display view
			//this.onDisplay();
		}


		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */
	
	
	
	});
});
