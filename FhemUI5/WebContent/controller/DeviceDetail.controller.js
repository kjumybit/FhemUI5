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
	'de/kjumybit/fhem/model/grouper',
	'sap/ui/model/json/JSONModel',
	'sap/ui/layout/form/FormElement',
	'sap/m/Text',
	'de/kjumybit/fhem/core',	
	'de/kjumybit/fhem/chart/ChartBase'	
], function(jquery, BaseController, Formatter, Grouper, JSONModel, FormElement, Text, FhemCore, Chart) {
	"use strict";

	const _sComponent = "DeviceDetail";	

	return BaseController.extend("de.kjumybit.fhem.controller.DeviceDetail", {

		
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

			this.getRouter().getRoute("DeviceDetail").attachPatternMatched(this._onDeviceMatched, this);
		},
	
		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		* @memberOf helloworld.Main
		*/
		onBeforeRendering: function() {

			jQuery.sap.log.debug("onBeforeRendering", null, _sComponent);	

			// call the base component's function
			// BaseController.prototype.onBeforeRendering.apply(this, arguments);

			// set own navigation button
			let bMaster = this.getSplitAppObj().isMasterShown();
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', !bMaster);

			// hide master button
			let oMasterBtn = this.getOwnerComponent().getRootControl().byId('app-MasterBtn');
			if (oMasterBtn) { oMasterBtn.setVisible(false); }

			// initialization on display view
			this.onDisplay();
		},


		onAfterRendering: function() {

			//jQuery.sap.log.debug("onAfterRendering:", null, _sComponent);	

			// hide master button
			//let oMasterBtn = this.getOwnerComponent().getRootControl().byId('app-MasterBtn');
			//if (oMasterBtn) { oMasterBtn.setVisible(false); }

		},
		

		/**
		 * Do initialization tasks each time before the view is shown.
		 */
		onDisplay: function() {
			//jQuery.sap.log.debug("onDisplay:", null, _sComponent);	
		},
		
		
		/**
		 * Binds the view to the device path. The deviceId is the name of the path parameter defined 
		 * in the routing configuration: "pattern": "devicedetail/{deviceId}". It represents the 
		 * device ID of the Fhem device list
		 * Map the device details (object properties) to local view model (array based).
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'devicedetail'
		 * @private
		 */
		_onDeviceMatched : function (oEvent) {
			
			// initialization on display view
			this.onDisplay();
			
			this.sDeviceId =  oEvent.getParameter("arguments").deviceId;
		
			// bind the view to the current device
			this.getView().bindElement('Fhem>/Device(' + this.sDeviceId + ')');

			// build charts
			this._createChart(this.byId("chartContainer"));    // via JScript
			
		},
		
		
		/** ================================================================================
		 *  Control event handler
		 ** ================================================================================ */


		
		/** 
		 * Handle press on button Chart Backward
		 * @function
		 * @param {sap.ui.base.Event} oEvent Button press event
		 * @public
		 */
		onChartBack: function( oEvent ) {
			this._getChartControlls().forEach(oChart => {
				//FhemCore.getChartModel().shiftBack("HwcStorageTemp");  //TODO: POC
				FhemCore.getChartModel().shiftBack(oChart.getId()); 
			})

		},
		
		onChartBackLong: function( oEvent ) {
			this._getChartControlls().forEach(oChart => {			
				FhemCore.getChartModel().shiftBackLong(oChart.getId());
			})			
		},


		/** 
		 * Handle press on button Chart Forward
		 * @function
		 * @param {sap.ui.base.Event} oEvent Button press event
		 * @public
		 */
		onChartForth: function( oEvent ) {
			this._getChartControlls().forEach(oChart => {			
				FhemCore.getChartModel().shiftForth(oChart.getId());  
			})							
		},

		onChartForthLong: function( oEvent ) {
			this._getChartControlls().forEach(oChart => {			
				FhemCore.getChartModel().shiftForthLong(oChart.getId()); 
			})							
		},


		/** 
		 * Handle press on button Chart Zoom
		 * @function
		 * @param {sap.ui.base.Event} oEvent Button press event
		 * @public
		 */
		onChartZoom: function( oEvent ) {
			let oPagingButton = oEvent.getSource();
			let iNewPos = oPagingButton.getCount() - oEvent.getParameter("newPosition");
			let iOldPos = oPagingButton.getCount() - oEvent.getParameter("oldPosition");

			this._getChartControlls().forEach(oChart => {						
				if (iNewPos > iOldPos) {
					FhemCore.getChartModel().zoomOut(oChart.getId());	
				} else if (iNewPos < iOldPos) {
					FhemCore.getChartModel().zoomIn(oChart.getId());	
				}
			})										
		},


		/** ================================================================================
		 *  Private functions
		 ** ================================================================================ */


		/** 
		 * Create charting controlls for device
		 * 
		 * @param {sap.m.VBox} oVBoxIn Chart container
		 */
		_createChart: function(oVBoxIn) {
			
			let oVBox = oVBoxIn;
			oVBox.destroyItems();
			
			let aCharts = this.getModel("Charts").getChartsForDevice(this.sDeviceId);

			aCharts.forEach(device => {
				// create chart control with data set binding
				let oChart = new Chart(device, {
					//width: 400,
					height: 150,
					responsive: "true",
					chartType: "{Charts>/" + device + "/chartType}",
					options: "{Charts>/" + device + "/chartOptions}",
					data: "{Charts>/" + device + "/chartData}"  
				});				

				oVBox.addItem(oChart);																		
			});

		},
			
		
		/**
		 * Return a list of chart controlls inside the parent container <code>oVBox</code>.
		 * 
		 * @returns {de.kjumybit.fhem.chart.ChartBase[]} chart controlls
		 */
		_getChartControlls: function() {

			let aCharts = [];
			let oContainer = this.byId("chartContainer");
			let oItems = oContainer.getItems();

			oItems.forEach(item => {
				if (item instanceof Chart) {
					aCharts.push(item);
				}
			});

			return aCharts;
		}
		
	});
});
