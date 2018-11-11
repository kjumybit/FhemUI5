sap.ui.define([
	'de/kjumybit/fhem/controller/BaseController',
	"sap/ui/model/json/JSONModel",		
	'sap/m/MessagePopover',
	'sap/m/MessagePopoverItem',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'de/kjumybit/fhem/model/formatter',
	'de/kjumybit/fhem/model/grouper'
], function(BaseController, JSONModel, MessagePopover, MessagePopoverItem, Filter, FilterOperator, Formatter, Grouper) {
	"use strict";

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

			this.getRouter().getRoute("DeviceList").attachPatternMatched(this.onDisplay, this);		
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
		onDisplay: function(oEvent) {
			
			let oArgs = oEvent.getParameter("arguments");
			let oQuery = oArgs["?query"];
			let aFilter = [];
			
			if (oQuery) {
				// prepare filter value				
				if (oQuery.deviceType) {
					aFilter.push(new Filter("Internals/TYPE", FilterOperator.Contains, oQuery.deviceType));
				} else if (oQuery.room) {
					aFilter.push(new Filter("Attributes/room", FilterOperator.Contains, oQuery.room));					
				}
				// set filter for table item binding
				let oTable = this.byId("tblDeviceList");
				let oBinding = oTable.getBinding("items");
				oBinding.filter(aFilter);						
			}
		},
				
	
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
		 */
		onItemPress: function(oEvent) {
			// the source is the table list item that got pressed 
			this._showDeviceDetail(oEvent.getSource());
		},
		
		
		/**
		 * Navigates to the detail view of the selected device.
		 */
		_showDeviceDetail: function(oDevice) {
			this.getRouter().navTo("DeviceDetail", {
				deviceId: oDevice.getBindingContext("Fhem").getProperty("Name")
			});
		}
	
	});
});
