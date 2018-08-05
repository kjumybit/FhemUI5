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

			
			// Initialize view model for Fhem device details
			var oDevDetailData = {
					"Internals": [],
					"Readings": [],
					"Attributes": []
			};
			this.oDeviceDetailModel = new JSONModel(oDevDetailData);
			this.setModel(this.oDevicevDetailModel, "DevicevDetail");
			
			this.getRouter().getRoute("DeviceDetail").attachPatternMatched(this._onDeviceMatched, this);
		},
	
		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		* @memberOf helloworld.Main
		*/
		onBeforeRendering: function() {
			// initialization on display view
			this.onDisplay();
		},

		
		/**
		 * Do initialization tasks each time before the view is shown.
		 */
		onDisplay: function() {
			//TODO
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
			
			// get path to device in Fhem JSON model
			var aDeviceSet = this.getFhemMetaModel().getProperty('/DeviceSet');
			var i = this.getArrayIndex('Name', this.sDeviceId, aDeviceSet);
		
			// bind the view to the concrete device
			this.getView().bindElement('fhemMetaData>/DeviceSet/' + i);

			
			// map the device readings to the local view model
			var aReadings = this._mapReadings(aDeviceSet[i].Readings);
//			this.oDeviceDetailModel.setProperty("/Readings", aReadings);  // via binding
			this._createReadings(this.byId("formReadings"), aReadings);    // via JScript
			
			// map the device internals to the local view model
			var aInternals = this._mapInternals(aDeviceSet[i].Internals);
//			this.oDeviceDetailModel.setProperty("/Internals", aInternals);  // via binding
			this._createInternals(this.byId("formInternals"), aInternals);    // via JScript
			
			// map the device attributes to the local view model
			var aAttributes = this._mapAttributes(aDeviceSet[i].Attributes);
//			this.oDeviceDetailModel.setProperty("/Attributes", aAttributes);  // via binding
			this._createAttributes(this.byId("formAttributes"), aAttributes);    // via JScript			
			
			// charts
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

		
		_mapInternals: function(oInternals) {
			var aInternals = [];
			for (var i in oInternals) {
				aInternals.push({
					"Name": i,
					"Value": oInternals[i]
				});
			}
			return aInternals;
		},
		
		_mapReadings: function(oReadings) {
			var aReadings = [];
			for (var i in oReadings) {
				aReadings.push({
					"Name": i,
					"Value": oReadings[i].Value,
					"Time": oReadings[i].Time
				});
			}
			return aReadings;
		},

		_mapAttributes: function(oAttributes) {
			var aAttributes = [];
			for (var i in oAttributes) {
				aAttributes.push({
					"Name": i,
					"Value": oAttributes[i]
				});
			}
			return aAttributes;
		},
		
		
		_createReadings: function(oFormContainer, aReadings) {
			oFormContainer.destroyFormElements();
			if (!aReadings) return;

			for (var i=0, iL=aReadings.length; i<iL; i++) {
				var oFormElement = new FormElement({
					"label": aReadings[i].Name
				}).addField( new Text({ 
					"text": new String(aReadings[i].Value) 
				})).addField( new Text({ 
					"text": aReadings[i].Time 
				}));
				oFormContainer.addFormElement(oFormElement);
			}
		},


		_createAttributes: function(oFormContainer, aAttributes) {
			oFormContainer.destroyFormElements();
			if (!aAttributes) return;
			
			for (var i=0, iL=aAttributes.length; i<iL; i++) {
				var oFormElement = new FormElement({
					"label": aAttributes[i].Name
				}).addField( new Text({ 
					"text": new String(aAttributes[i].Value)
				}));
				oFormContainer.addFormElement(oFormElement);				
			}			
		},


		_createInternals: function(oFormContainer, aInternals) {
			oFormContainer.destroyFormElements();
			if (!aInternals) return;
			
			for (var i=0, iL=aInternals.length; i<iL; i++) {
				var oFormElement = new FormElement({
					"label": aInternals[i].Name
				}).addField( new Text({ 
					"text": new String(aInternals[i].Value)
				}));
				oFormContainer.addFormElement(oFormElement);											
			}			
		},
		

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
					witdh: 400,
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
