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
	"sap/ui/model/json/JSONModel",		
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'de/kjumybit/fhem/model/formatter',
	'de/kjumybit/fhem/model/grouper'
], function(jQuery, BaseController, JSONModel, Filter, FilterOperator, Formatter, Grouper) {
	"use strict";

	const _sComponent = "DeviceList";	

	return BaseController.extend("de.kjumybit.fhem.controller.DeviceList", {

		
		// init local members
		formatter: Formatter,
		grouper: Grouper,
			
		/**
		* Called when a controller is instantiated and its View controls (if available) are already created.
		* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		* @memberOf helloworld.Main
		*/
		onInit: function() {
	
			// call the base component's init function
			BaseController.prototype.onInit.apply(this, arguments);
		
			// prepare local view model
			let oViewModel = new JSONModel({
				deviceTableTitle: this.getResourceBundle().getText('detailDevices')
			});
			this.setModel(oViewModel, 'deviceDetails');

			// register event handler called every time the detail view is displayed
			this.getView().addEventDelegate({
				onBeforeShow: this.onBeforeShow,
			}, this);			
			//this.getRouter().getRoute("DeviceList").attachPatternMatched(this.onDisplay, this);		
		},
	

		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		* @memberOf helloworld.Main
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
		

		/** 
		 * Triggered before displaying the view when Split Container navigation is used.
		 * The view may be called with an optional query parameter, which is used as a filter 
		 * for displayed devices.
		 * 
		 * Supported query parameter (filter parameters): 
		 * - room		: /DeviceSet/Attributes/room
		 * - deviceType : /DeviceSet/Internals/TYPE

		 * 
		 * @param {object} oData Payload of the navigation.
		 * 				   oData.deviceTyp
		 * 				   oData.room
		 */
		onBeforeShow: function (oData) {

			let aFilter = [];
			
			jQuery.sap.log.debug("onBeforeShow - display device list", null, _sComponent);				
			
			// reset or set filter
			if (oData.data) {
				// prepare filter value
				if (oData.data.deviceType) {
					aFilter.push(new Filter("Internals/TYPE", FilterOperator.Contains, oData.data.deviceType));
				} else if (oData.data.room) {
					aFilter.push(new Filter("Attributes/room", FilterOperator.Contains, oData.data.room));					
				}			
			}

			// set filter for table item binding
			let oTable = this.byId("tblDeviceList");
			let oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);			
		},


		/**
		 * Called each time the view is displayed (via routing, but not for the root view)
		 * The view may be called with an optional query parameter, which is used as a filter 
		 * for displayed devices.
		 * 
		 * Supported query parameter (filter parameters): 
		 * - room		: /DeviceSet/Attributes/room
		 * - deviceType : /DeviceSet/Internals/TYPE
		 *
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'devicedetail' 
		 */
		/*
		onDisplay: function(oEvent) {
			
			let oArgs = oEvent.getParameter("arguments");
			let oQuery = oArgs["?query"];
			let aFilter = [];
			
			// reset or set filter
			if (oQuery) {
				// prepare filter value				
				if (oQuery.deviceType) {
					aFilter.push(new Filter("Internals/TYPE", FilterOperator.Contains, oQuery.deviceType));
				} else if (oQuery.room) {
					aFilter.push(new Filter("Attributes/room", FilterOperator.Contains, oQuery.room));					
				}			
			}

			// set filter for table item binding
			let oTable = this.byId("tblDeviceList");
			let oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);			
		},
		*/

	
		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */
		

		/**
		 * Handles the 'updateFinished' event of the device table afte rew table data
		 * is available.
		 * 
		 * Set counter in table header.
		 * 
		 * @param {sap.ui.base.Event} oEvent the table update finishes event
		 * @public
		 */
		onTableUpdateFinished: function(oEvent) {

			let oTable = oEvent.getSource();
			let iTotalItems = oEvent.getParameter('total');
			let sTitle = "";

			// only update the counter if the length us final and the table is not empty
			if (iTotalItems && oTable.getBinding('items').isLengthFinal()) {
				sTitle = this.getResourceBundle().getText('detailDevicesCount', [iTotalItems]);	
			} else {
				sTitle = this.getResourceBundle().getText('detailDevices');
			}

			this.getModel('deviceDetails').setProperty('/deviceTableTitle', sTitle);
		},

		
		/**
		 * Handle device item selection. 
		 * Show device detail. 
		 * 
		 * @param {object} oEvent Event parameter for table item selection
		 */
		onItemPress: function(oEvent) {
			// the source is the table list item that got pressed 
			this._showDeviceDetail(oEvent.getSource());
		},
		
		
		/**
		 * Navigates to the detail view of the selected device.
		 * 
		 * @param {object} oDevice Fhem device object
		 */
		_showDeviceDetail: function(oDevice) {

			this.getSplitAppObj().toDetail(this.getDetailPageId("DeviceDetailView"), "show", { 
				deviceId: oDevice.getBindingContext("Fhem").getProperty("Name")
			}); 
	
			//this.getRouter().navTo("DeviceDetail", {
			//	deviceId: oDevice.getBindingContext("Fhem").getProperty("Name")
			//});
		}
	
	});
});
