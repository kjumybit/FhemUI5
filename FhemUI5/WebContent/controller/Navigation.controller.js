/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([
	"de/kjumybit/fhem/controller/BaseController",
	"jquery.sap.global",	
], function(BaseController, jQuery) {

	"use strict";

	const _sComponent = "Navigation";
	
	return BaseController.extend("de.kjumybit.fhem.controller.Navigation", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf helloworld.Main
		 */
		onInit: function() {
		
			jQuery.sap.log.debug("onInit", null, _sComponent);
			
			// call the base component's init function
			BaseController.prototype.onInit.apply(this, arguments);
		},

		
		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */


		/**
		 * Handles page Back button press
		 * Hide navigation view (master page)
		 * 
		 * @param {object} oEvent Button event
		 */
		onPressNavigationBack: function(oEvent) {

			this._closeMasterView(true);
		},


		/**
		 * Handles press on button "Settings"
		 * Open Settings view as detail page.
		 * Replace current detail view but don't close master view.
		 * 
		 * @param {object} oEvent Button event
		 */		
		onPressSettings: function(oEvent) {

			var sPageId = "SettingsView";

			jQuery.sap.log.info("Navigate to settings view " + sPageId, null, _sComponent);

			// replace current detail view with new detail in navigation container for detail pages
			this.getSplitAppObj().toDetail(this.getDetailPageId(sPageId)); 

		},


		/**
		 * Handles item selection in manue list. 
		 * The name of the target detail view is passed as custom data.
		 * (overview, devices, rooms, ...)
		 * 
		 * @param {object} oEvent Navigation item select event
		 */
		onNavItemSelect: function(oEvent) {

			// get View ID from event parameter
			var sPageId = oEvent.getParameter("item").getCustomData()[0].getValue();			

			jQuery.sap.log.info("Navigate to detail view " + sPageId, null, _sComponent);
			
			// replace current detail view with new detail in navigation container for detail pages
			this.getSplitAppObj().toDetail(this.getDetailPageId(sPageId), "show"); 

			this._closeMasterView(false);
		
		},
		
		
		/** ================================================================================
		 *  Private functions
		 ** ================================================================================ */

		/**
		 * On Phones there is always only one view visible. The current master view mus be replaced
		 * by a detail view. 
		 * - the detail view must have been loaded by the router (or on bootstrap)
		 * - if we navigate to a new detail view, it is already set by the <code>onNavItemPress</code>.
		 * - if we go back to the current (last) detail view  by <code>onPressNavigationBack</code> we have 
		 *   request a navigation
		 * 
		 * OpenUI5 Docu:
		 * - hideMaster() and showMaster: 
		 *   Used to hide/show the master page when in ShowHideMode and the device is in portrait mode.
		 * 
		 * @param {boolean} bBackToDetailView Navigate to current detail view 
		 */
		_closeMasterView: function(bBackToDetailView) {

			let oApp = this.getSplitAppObj();

			jQuery.sap.log.info("Close master view", null, _sComponent);

			// enable Master Button on Detail Views
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', true);

			switch (this.getViewMode()) {
				case this.ViewMode.full:
					// hide master view 
					oApp.setMode("HideMode"); 
					break;
				case this.ViewMode.overlay:
					// hide master view 
					oApp.setMode("HideMode"); 
					break;					
				case this.ViewMode.single:
					// if called from navigation item, the new target detail view is loaded, but 
					// not active, so do a navigation only if triggerd by the navigation back button			
					if (bBackToDetailView) {
						// navigate to (current) detail view (replace master view)
						// getPreviousPage() returns a detail view as we have have even one master view
						let oDetailView = oApp.getPreviousPage();
						jQuery.sap.log.info("Navigate to previous page " + oDetailView.getId(), null, _sComponent);
						oApp.toDetail(oDetailView.getId()); 	
					}					
					break;
				default:					
			}

			// keep default master button invisible
			this.hideDefaultMasterButton();			
		},

		
	});
});
