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
	"sap/ui/model/ClientModel",	
	'sap/ui/model/Context', 
	'de/kjumybit/fhem/core',
	'./ChartPropertyBinding'	
],
	function(jQuery, ClientModel, Context, FhemCore, ChartPropertyBinding) {
	"use strict";
		
	/**
	 * Constructor for a new ChartModel.
	 *  
	 * @class
	 * Model implementation for Charting data.
	 *
	 * A ChartModel is a class which holds data sets for Chart Controls. 
	 * It provide charting options and data sets which can be bound to properties of a chart control.
	 * Currentrly supported features:
	 * - Only the <code>/chartData"</code> property can be bound to charting control
	 * - All the properties are set by as constructor parameters or by the <code>setProperty</code> method.
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
		//TODO: Implement a single chart model for a set of charts (all charts in a config file)

		constructor: function(sChart) {
			
			ClientModel.apply(this, arguments);
			
			//TODO: a list of DbLog Models is required, depending on the number of Fhem data soruces

			// this._oDbLogModel =
			this.sChart = sChart;
			
			//TODO: check valid chart ID
			this.oChart = _oCharts[this.sChart];
			
			this.sChartType = this.oChart.chartjs.chartType;
			this.oOptions = this.oChart.chartjs.options;

			// model data (defined in by superclass ClientModel)
			// TODO: initialize with default values: check binding update
			this.oData = {
					"chartData": this.oChart.chartjs.chartData
			};
			this._oMetaModel = null;
			this.setDefaultBindingMode("OneWay");
						
			//TODO: create Fhem Data Source models						
			//TODO retrieve initial data			
			this._loadDataSets();
		},	
		
		metadata: {			
			// methods
			publicMethods : [
				"getType", "getData", "getOptions"				
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
	 * Retrieve data sets from Fhem backend and inform all bound UI controls.
	 * @private 
	 */
	ChartModel.prototype._loadDataSets = function() {
		//TODO: replace POC
		
		var fnSuccess = function (oData) {
			 
			let oChartData = this.oData.chartData; 
			
			oChartData.datasets[0].data = oData.data.map( function(oReading) { 
				return { "t": oReading.TIMESTAMP, "y": Number(oReading.VALUE) };
			});
										
			// update bindings
			this.checkUpdate();
		};
				
		
		let oFhem = FhemCore.getFhemService();
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
			 success: fnSuccess.bind(this),				    
			 error: function(oError) {
				 
			 }.bind(this)                      				
		});
		
								
	};
	
	
	/**
	 * Get chart type.
	 * 
	 * @public 
	 * @returns {string} The chart type. 
	 */
	ChartModel.prototype.getType = function() {
		return this.sChartType;
	};
	

	/**
	 * Get chart options.
	 * 
	 * @public 
	 * @returns {object} An bject with display option. 
	 */
	ChartModel.prototype.getOptions = function() {
		return this.oOptions;
	};


	/**
	 * Get chart data containing one or multiple data sets.
	 * 
	 * @public 
	 * @returns {object} A chart data object.  
	 */
	ChartModel.prototype.getData = function() {
		return this.oData.chartData;
	};

	
	
		
	/**
	 * Sets a new value for the given property <code>sPropertyName</code> in the model.
	 * If the model value changed all interested parties are informed.
	 *
	 * @param {string}  sPath path of the property to set
	 * 					Supported paths are: 
	 * 						"/chartData"
	 * @param {object} oValue an object in the format expected by the supported path
	 * 				   "/chartData"       
	 * @param {object} [oContext=null] the context which will be used to set the property
	 * 				   Not supported yet.
	 * @param {boolean} [bAsyncUpdate] whether to update other bindings dependent on this property asynchronously
	 * @return {boolean} true if the value was set correctly and false if errors occurred like the entry was not found.
	 * @public
	 */
	ChartModel.prototype.setProperty = function(sPath, oValue, oContext, bAsyncUpdate) {
		
		switch (sPath) {
		case "/chartData":
			// TODO: check type of oData or use specific data type
			this.oData.chartData = oValue;
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
		let oValue = null;
		
		switch (sPath) {
		case "/chartData":
			oValue = this.oData.chartData;
			break;
		default:
			break;
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
	
	
	return ChartModel;
	
}, /* bExport= */ true);