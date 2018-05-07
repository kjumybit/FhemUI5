/**
 * A base chart model for Chart.js charts
 *  
 *
 * @namespace
 * @name de.kjumybit.fhem.chart
 * @public
 */

// Provides the Chart.js based model implementation
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/model/ClientModel',	
	'sap/ui/model/Context', 
	'de/kjumybit/fhem/core',
	'./ChartPropertyBinding'	
],
	function(jQuery, ClientModel, Context, FhemCore, ChartPropertyBinding) {
	"use strict";

	// statics
	
	/**
	 * the chart configuration 
	 */
	var _oCharts = null;
	var _oDataSources = null;
	var _bConfigLoadded = false;
	
	
	/**
	 * Initialize module.
	 * Load chart configuration.
	 * 
	 * @returns {boolean} Configuration loaded
	 */
	var _init = function() {
		
		let oModel = FhemCore.getChartMetaModel();
		
		if (oModel && !_bConfigLoadded) {
			_oCharts = oModel.getProperty('/charts');
			_oDataSources = oModel.getProperty('/fhemDataSources');
			_bConfigLoadded = true;
		}
		
		return _bConfigLoadded;
	};
		

	/**
	 * Constructor for a new ChartModel.
	 *  
	 * @class
	 * Model implementation for Charting data.
	 *
	 * A ChartModel is a class which holds metda data for a set of charts. 
	 * A sinle chart is accessed using an <code>ID</code> and 
	 * provides charting options and data sets which can be bound to properties of a chart control.
	 * 
	 * @extends sap.ui.model.ClientModel
	 *
	 * @author 
	 * @version 
	 *
	 * @param {string} sChart Name of the chart in the chart configuration 
	 * @constructor
	 * @public
	 * @alias de.kjumybit.fhem.chart.ChartModel"
	 */
	var ChartModel = ClientModel.extend("de.kjumybit.fhem.chart.ChartModel", /** @lends de.kjumybit.fhem.chart.ChartModel.prototype */ {

		constructor: function(sChart) {
			
			ClientModel.apply(this, arguments);

			// model data (defined in by superclass ClientModel)
			this.oData = {};

			//TODO: a list of DbLog Models is required, depending on the number of Fhem data soruces
			//TODO: initialize with default values: check binding update

			this._oMetaModel = null;
			this.setDefaultBindingMode("OneWay");
			
			_init();
		},	
		
		metadata: {			
			// methods
			publicMethods : [
				"getType", "getData", "getOptions", "getChartsForDevice"
			],					
		},
		
	});
		
	
	/**
	 * Dummy implementation for method defined by <code>ClientModel</code>
	 * Load chart configuration.
	 * @public 
	 */
	ChartModel.prototype.loadData = function() {
		// load configuration
		_init();		
	};
	

	/**
	 * <code>
	 * oChart: {
	 * 	   chartName: string,
	 *     chartType: string,
	 *     chartOptions: object,
	 *     chartData: object
	 * }
	 * </code>
	 * @param {string} sChart Chart ID
	 * @returns {object} Chart object
	 */
	ChartModel.prototype._getChart = function(sChart) {
		
		let oChart = this.oData[sChart];
		if (oChart) {
			return oChart;
		}

		//TODO: check valid chart ID
		let oChartConf = _oCharts[sChart];

		// initialize new oChart from configuration
		oChart = {
			chartName: sChart,
			chartType: oChartConf.chartjs.chartType,
			chartOptions: oChartConf.chartjs.options,
			chartData: oChartConf.chartjs.chartData
		}
		
		this.oData[sChart] = oChart;
		
		//TODO retrieve initial data			
		this._loadDataSets(oChart);

		return oChart;
	};


	/**
	 * Retrieve data sets from Fhem backend for a Chart {oChart} and inform all bound UI controls.
	 * 
	 * @param {object} oChart Chart definition of a single chart in the chart configuration 
	 * @private 
	 */
	ChartModel.prototype._loadDataSets = function(oChart) {
		//TODO: replace POC
		//TODO: use promises
		
		//var oThatChart = oChart; hint: not visible within getFnSuccess()

		// on success DBLog query
		var getFnSuccess = function (oDataSet) {
			
			let oMyDataSet = oDataSet;

			return function (oData) {
				//let oChartData = this.oData[oThatChart.chartName].chartData; 
			
				// get data set 
				//oChartData.datasets[0].data = oData.data.map( function(oReading) { 
				oMyDataSet.data = oData.data.map( function(oReading) { 
					return { "t": oReading.TIMESTAMP, "y": Number(oReading.VALUE) };
				});
										
				// update bindings
				this.checkUpdate();
			}.bind(this);
			
		}.bind(this);
				
		
		let oFhem = FhemCore.getFhemService();
		let oDataSet = this.oData[oChart.chartName].chartData.datasets[0]; 

		oFhem.callDbLogQuery("DB_Log_MariaDB", {
			from: { 
				date: "2018-03-03",
				time: "00:00:00"
			 },
			 to: {
					date: "2018-03-03",
					time: "23:59:59"
			 },
			 device: "KG_IZ_StromZaehler", 
			 reading: "energyTagesVerbrauch",
			 success: getFnSuccess.call(this, oDataSet),
			 error: function(oError) {
				 //TODO
			 }.bind(this)                      				
		});
		
								
	};
	

	/**
	 * Retrieve date from backend for data set <code>oDataSet</code>
	 * 
	 * @param {object} oDataSet Dataset of a chart 
	 * @returns {promises} DBLog backend request
	 * @private 
	 */
	ChartModel.prototype._loadDataSet = function(oDataSet) {


		return undefined;
	};

	
	/**
	 * Get chart type for chart {Chart ID}.
	 * 
	 * @param {string} sChart Chart ID
	 * @public 
	 * @returns {string} The chart type or undefined.
	 */
	ChartModel.prototype.getType = function(sChart) {
		let oChart = this._getChart(sChart);
		return oChart && oChart.chartType;
	};
	

	/**
	 * Get chart options for chart {Chart ID}.
	 * 
	 * @param {string} sChart Chart ID
	 * @public 
	 * @returns {object} Chart display options or undefined.
	 */
	ChartModel.prototype.getOptions = function(sChart) {
		let oChart = this._getChart(sChart);		
		return oChart && oChart.chartOptions;
	};


	/**
	 * Get chart data containing one or multiple data sets for chart {Chart ID}.
	 * 
	 * @param {string} sChart Chart ID
	 * @public 
	 * @returns {object} A chart data object.  
	 */
	ChartModel.prototype.getData = function(sChart) {
		let oChart = this._getChart(sChart);		
		return oChart && oChart.chartData;
	};

		
	/**
	 * Sets a new value for the given property <code>sPropertyName</code> in the model.
	 * If the model value changed all interested parties are informed.
	 *
	 * @param {string}  sPath path of the property to set
	 * 					Supported paths are: 
	 * 						"/<ChartID>/chartType"
	 * 						"/<ChartID>/chartOptions"
	 * 						"/<ChartID>/chartData"
	 * @param {object} oValue an object in the format expected by the supported path
	 * 						"/<ChartID>/chartType"
	 * 						"/<ChartID>/chartOptions"
	 * 						"/<ChartID>/chartData"
	 * @param {object} [oContext=null] the context which will be used to set the property
	 * 				   Not supported yet.
	 * @param {boolean} [bAsyncUpdate] whether to update other bindings dependent on this property asynchronously
	 * @return {boolean} true if the value was set correctly and false if errors occurred like the entry was not found.
	 * @public
	 */
	ChartModel.prototype.setProperty = function(sPath, oValue, oContext, bAsyncUpdate) {
		
		let bIsRelative = typeof sPath == "string" && !jQuery.sap.startsWith(sPath, "/")
		//TODO: currently no relative paths are supported

		let aPath = sPath.split("/");
		let sChart = (bIsRelative ? aPath[0] : aPath[1])   
		let sProperty = (bIsRelative ? aPath[1] : aPath[2])

		let oChart = this._getChart(sChart);
		//TODO: check valid chart

		// TODO: check type of oData or use specific data type
		switch (sProperty) {
		case "chartType":
			this.oData[sChart].chartType = oValue;
			break;
		case "chartOptions":
			this.oData[sChart].chartOptions = oValue;
			break;			
		case "chartData":
			// TODO: check type of oData or use specific data type
			this.oData[sChart].chartData = oValue;
			break;
		default:
			return false;
		}
		
		// don't force binding update
		this.checkUpdate(false, bAsyncUpdate);
		return true;		
	};

	
	/**
	 * Returns the value for the property with the given <code>sPropertyName</code>
	 *
	 * @param {string} sPath the path to the property
	 * 					Supported paths are: 
	 * 						"/chartData" 
	 * @param {sap.ui.model.Context} [oContext=null] the context which will be used to retrieve the property
	 * 				   Not supported yet. 
	 * @return {any} the value of the property
	 * @public
	 */
	ChartModel.prototype.getProperty = function(sPath, oContext) {

		let bIsRelative = typeof sPath == "string" && !jQuery.sap.startsWith(sPath, "/")
		//TODO: currently no relative paths are supported

		let aPath = sPath.split("/");
		let sChart = (bIsRelative ? aPath[0] : aPath[1])   
		let sProperty = (bIsRelative ? aPath[1] : aPath[2])
		let oValue = null;

		let oChart = this._getChart(sChart);
		//TODO: check valid chart

		// TODO: check type of oData or use specific data type
		
		switch (sProperty) {
		case "chartType":
			oValue = oChart.chartType;
			break;
		case "chartOptions":
			oValue = oChart.chartOptions;
			break;			
		case "chartData":
			oValue = oChart.chartData;
			break;
		default:
			break
		}
			
		return oValue;
	};
	
		
	/**
	 * @see sap.ui.model.Model.prototype.bindProperty
	 * The PropertyBinding is used to access single data values in the data model.
	 */
	ChartModel.prototype.bindProperty = function(sPath, oContext, mParameters) {
		var oBinding = new ChartPropertyBinding(this, sPath, oContext, mParameters);
		return oBinding;
	};
	
	/**
	 * Get list of chart IDs assigned to a Fhem device <code>sDevice</code>.
	 * @param {string} sDevice Device name
	 * @public 
	 * @returns {string[]} Charts assigned to the device <code>sDevice</code>
	 */
	ChartModel.prototype.getChartsForDevice = function(sDevice) {
		return Object.keys(_oCharts).filter(chart => _oCharts[chart].assignedDevices.includes(sDevice)) || [];
	};


	/**
	 * Sets the meta model associated with this model
	 *
	 * @private
	 * @param {sap.ui.model.MetaModel} oMetaModel the meta model associated with this model
	 */
	ChartModel.prototype._setMetaModel = function(oMetaModel) {
		this._oMetaModel = oMetaModel;
	};

	
	ChartModel.prototype.getMetaModel = function() {
		return this._oMetaModel;
	};
	

	return ChartModel;
	
}, /* bExport= */ true);