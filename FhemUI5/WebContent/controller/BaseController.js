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
	"sap/ui/core/mvc/Controller"
], function (jQuery, Controller) {
	"use strict";

	const _sComponent = "BaseController";		
	
	/**
	 * Generall controller methods..
	 *  
	 * @class Generall function for view controller..
	 *
	 * A base controller class provides common and helper functions for view controllers. 
	 * Each view controller inherits from the base controller.
	 * 
	 * @extends sap.ui.core.mvc.Controller
	 * @author kjumybit
	 * @version 
	 * @constructor
	 * @public
	 * @alias de.kjumybit.fhem.controller.BaseController"
	 */		
	return Controller.extend("de.kjumybit.fhem.controller.BaseController", {

		/** 
		 * View modes
		 */
		ViewMode: {
			full: "fullscreen",
			overlay: "overlay",
			single: "single"
		},			
		

		/**
		 * 
		 */
		onInit: function() {
		
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	
		},
			
						
		onExit : function () {
			if (this._oFhemConnPopover) {
				this._oFhemConnPopover.destroy();
			}
		},


		/**
		 * Fhem Connection Dialog
		 * Handle change switch for Fhem Event Update
		 * Enable or Disable Fhem Event updated in Fhem Model
		 * 
		 * @param {object} oEvent Button press event
		 */
		onChangeFhemEventUpdate: function(oEvent) {
			this.getFhemModel().setEnabledEventUpdate( oEvent.getSource().getState() );
		},


		/**
		 * Get array index of property value of an JSON object in an array
		 * @param {string} sProperty the name of an object property 
		 * @param {object} value the property value
		 * @param {object[]} aArray an array of JSON objects
		 * @return {number} iIndex the array index o fthe frist object with mathich property value
		 *                   or -1, if no object has been found
		 */
		getArrayIndex: function (sProperty, value, aArray) {				
			var index = -1;
			if (Array.isArray(aArray)) {
				for (var i=0, iL=aArray.length; i<iL; i++) {
					var o = aArray[i];
					if (o[sProperty] && o[sProperty] === value) {
						index = i;
						break;
					}
				}
			}
			return index;
		},
								
		
		/**
		 * Set & Get Fhem service model from component property
		 * 
		 * @returns {de.kjumybit.fhem.service.FhemService} Fhem Service
		 */
		getFhemModel: function () {
			return this.getComponentModel('Fhem');	
		},
		

		/**
		 * Get settings object.
		 * 
		 * @return {oSettings} [de.kjumybit.fhem.libs.Settings]
		 */
		getSettings: function () {
			return this.getOwnerComponent().oSettings;
		},
		
		
		getRuntimeModel: function() {
			return this.getOwnerComponent().getModel('runtime');	
		},
		
		
		getDeviceModel: function() {
			return this.getOwnerComponent().getModel('device');	
		},
		
		
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @return {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		
		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @return {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		
		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @return {sap.ui.model.Model} the model instance
		 */
		getComponentModel : function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},

		
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @return {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		
		/**
		 * Getter for the resource bundle.
		 * @public
		 * @return {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},


		/**
		 * Get Split App object
		 * 
		 * @returns {sap/m/SplitApp} Split App object
		 */
		getSplitAppObj : function() {
			
			let oApp = this._oSplittApp; 

			if (!oApp) {
				var oCtrl = this.getOwnerComponent().getRootControl();
				oApp = ( oCtrl ? this.getOwnerComponent().getRootControl().byId('app') : null );
			}
			if (!oApp)  {
				jQuery.sap.log.error("SplitApp object can't be found");
			}
			return oApp;
		},
	

		/**
		 * Hide default master button on detail pages in full screen mode
		 */
		hideDefaultMasterButton: function() {

			let oMasterBtn = this.getOwnerComponent().getRootControl().byId('app-MasterBtn');
			if (oMasterBtn) { oMasterBtn.setVisible(false); }
			jQuery.sap.log.debug("Supress default master button: " + !!oMasterBtn, null, _sComponent);

		},


		/** 
		 * Get the global view ID of a detail view <code>sViewId</code>
		 * 
		 * @param {string} sViewId Local ID of detail view 
		 * @returns {string} Global view ID
		 */
		getMasterPageId: function(sViewId) {			
			return this.getOwnerComponent().createId(sViewId);
		},


		/** 
		 * Get the global view ID of a master view <code>sViewId</code>
		 * 
		 * @param {string} sViewId Local ID of master view 
		 * @returns {string} Global view ID
		 */		
		getDetailPageId: function(sViewId) {
			return this.getOwnerComponent().createId(sViewId);
		},


		/**
		 * Determine device model properties for full screen layout of the app 
		 * and set internal runtime model property.
		 * Is called by event handlers for device & media changes.
		 * 
		 * Full screen is supported when:
		 * 
		 *   mode			device type 	device orientation
		 * 
		 *   full screen	Desktop			Landscape
		 * 	 full screen	Tablet			Landscape		=> show / hide master
		 *   overlay		Desktop			Portrait		=> oberlay / hide master
		 * 	 overlay		Tablet			Portrait		=> overlay / hide master
		 * 	 single 		Phone 			any				=> switch master / detail
		 */
		determineViewMode: function() {
			let oDevice = this.getModel('device').getData();;

			let oViewMode = {
				mode: null,
				fullScreen: false,
				overlay: false,
				singleView: false
			};

			// (oDevice.system.tablet && oDevice.orientation.landscape))); 
			if ( oDevice.system.desktop || oDevice.system.tablet ) {
				if (oDevice.orientation.landscape) {
					oViewMode.fullScreen = true;
					oViewMode.mode = this.ViewMode.full;
				} else {
					oViewMode.overlay = true;
					oViewMode.mode = this.ViewMode.overlay;
				}
			} else if ( oDevice.system.phone ) {
				oViewMode.singleView = true;
				oViewMode.mode = this.ViewMode.single;				
			} else {
				// unknown mode
				jQuery.sap.log.error("Unsupported view mode", null, _sComponent);
			};

			jQuery.sap.log.debug("View mode " + oViewMode.mode, null, _sComponent);
			this.getRuntimeModel().setProperty('/viewMode', oViewMode);
		},


		getViewMode: function() {
			return this.getRuntimeModel().getProperty('/viewMode/mode');
		},

		isFullsScreenViewMode: function() {
			return this.getRuntimeModel().getProperty('/viewMode/fullScreen');
		},
		
		

		/**
		 * Establish connection to Fhem backend server.
		 * An existing connection is closed before.
		 * 
		 * @param {oSettings}
		 */
		//TODO: check for connection change
		createFhemModel : function (oSettings) {
			
			this.fhemModel = this.getFhemModel();			
			let mSettings = oSettings.getModel().getProperty("/");			
			
			// create new Fhem model and connect to backend
			this.fhemModel.connect({
				"host": mSettings.server.host, 
				"port": mSettings.server.port
			});

			// local testing 
			/*
			oModel.loadData("model/fhemJsonList2.json");
			this.setModel(oModel, "Fhem" );  
			this._setSideNavModelfromFhem();			
			*/			
		},

		
		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */


		/**
		 * Handle press on Menu button at detail views.
		 * Show navigation view (master view) depending on own view mode.
		 * - landscape mode: master and detail view
		 * - portrait mode : master and detail view 
		 * - phone         : single view (master or detail)
		 * 
		 * @param {object} oEvent Button press event
		 */			
		onMenuBtnPress: function(oEvent) {
			let oApp = this.getSplitAppObj();

			jQuery.sap.log.info("Open master view", null, _sComponent);

			// keep default master button invisible
			this.hideDefaultMasterButton();		
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', false) 

			// hide own navigation button
			switch (this.getViewMode()) {
				case this.ViewMode.full:
					// add master view (compress detail view))
					oApp.setMode("ShowHideMode"); // will not work without that
					oApp.showMaster(); 
					break;
				case this.ViewMode.overlay:
					// show master view (compress detail view)
					// oApp.setMode("ShowHideMode"); will not work with chromium
					oApp.setMode("StretchCompressMode"); // is working, but doesn't look realy good in portrait mode
					oApp.showMaster();
					break;					
				case this.ViewMode.single:
					// navigate to navigation view (replace detail view)
					oApp.toMaster(this.getMasterPageId('NavigationView'), 'show');
					break;
				default:					
			}

		},


		/**
		 * Handle press on Object Detail button on detail views.
		 * Show object detail view
		 * 
		 * @param {object} oEvent Button press event
		 */			
		onObjectBtnPress: function(oEvent) {

			jQuery.sap.log.info("Open object detail view", null, _sComponent);
			this.getSplitAppObj().toDetail(this.getDetailPageId('ObjectDetailView'));
		},
		
		
		/**
		 * Handle press on back button on object detail views.
		 * Show previous detail view.
		 * 
		 * @param {object} oEvent Button press event
		 */			
		onDetailBackBtnPress: function(oEvent) {

			jQuery.sap.log.info("Back to previous detail view", null, _sComponent);
			this.getSplitAppObj().backDetail();
		},


		/**
		 * Handle press on button for Fhem Connection within the default footer.
		 * Displays a popover dialog with adhoc actions and  options.
		 * 
		 * @param {object} oEvent Button press event
		 */
		handlePressBtnConnected: function(oEvent) {

			var oView = this.getView();
			var oDialog = oView.byId("connectionDlg");
			
			if (!oDialog) {
				// giving the view ID as fragment ID will allow calling this.byId(…) in the view’s controller 
				// to retrieve controls inside the fragment.
				// create dialog via fragment factory (provide 'this' to enable callback handlers
				oDialog = sap.ui.xmlfragment(oView.getId(), "de.kjumybit.fhem.view.FhemConnectionActions", this);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}

			oDialog.openBy(oEvent.getSource());	
		},		

	});

});