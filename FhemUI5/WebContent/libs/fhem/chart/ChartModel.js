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
	'./ChartPropertyBinding',
	'../dblog/DbLogModel',
	'./TimeLine',
	'moment'
],
	function(jQuery, ClientModel, Context, FhemCore, ChartPropertyBinding, DbLogModel, TimeLine, moment) {
	"use strict";

	// statics
	
	var _sComponent = "de.kjumybit.fhem.chart.ChartModel";

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
	 * A single chart is accessed using an <code>ID</code> and 
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

			// model data (defined in superclass ClientModel)
			this.oData = {
				chartCtrl: {
					zoomLevel: {
						count: TimeLine.getNumberOfZoomLevels(),
						position: 7
					}		
				}			
			};

			//TODO: a list of DbLog Models is required, depending on the number of Fhem data soruces
			//TODO: initialize with default values: check binding update

			this._oMetaModel = null;
			this.setDefaultBindingMode("OneWay");
			
			_init();
		},	
		
		metadata: {			
			// methods
			publicMethods : [
				"getType", "getData", "getOptions", "getChartsForDevice", "getChart", "shiftBack", "shiftForth", "shiftBackLong", "shiftForthLong",
				"zoomIn", "zoomOut"
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
	 * 	   chartCtrl: {
	 *        time: TimeLine
	 *     } 
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
		//TODO; use own Class <code>DataSourceBinding</code> to DbLogModel
		oChart = {
			chartName: sChart,
			chartType: oChartConf.chartjs.chartType,
			chartOptions: oChartConf.chartjs.options,
			chartData: oChartConf.chartjs.chartData,
			chartCtrl: {
				time: new TimeLine(oChartConf.control.time),
			},
			dataSourceBinding: []
		}
		
		this.oData[sChart] = oChart;
		
		//TODO retrieve initial data
		this._loadDataSets(oChart);

		return oChart;
	};


	/** Returns definition for Fhem data source <code>sFhemDataSource</code> 
	 * 
	 * @param {string} sFhemDataSource Name of the data source
	 * @return {object} Data source definition or undefined
	 * @private
	 */
	ChartModel.prototype._getFhemDataSource = function(sFhemDataSource) {
		//TODO check valid Fhem data source
		//TODO use DbLogModel
		return _oDataSources[sFhemDataSource];
	};


	/**
	 * Retrieve data sets from Fhem backend for a Chart {oChart} and inform all bound UI controls.
	 * 
	 * @param {object} oChart Chart definition of a single chart in the chart configuration 
	 * @private 
	 */
	ChartModel.prototype._loadDataSets = function(oChart) {
						
		// retrieve time series data (datasets) from backend for all data sets 
		let that = this;
		let pDataLoaded = oChart.chartData.datasets.map(function(oDataSet) {
			// return promise
			return that._loadDataSet(oDataSet, oChart.chartCtrl.time);
		}.bind(that));
		
		Promise.all(pDataLoaded).then(function (aData) {
			jQuery.sap.log.info("loadDataSets: processing " + aData.length + " data sets", null, _sComponent);

			aData.forEach(function(oData) {
				//Hint: Use setProperty Or force update
				oData.dataSet.data = oData.dbLogData.data.map( function(oReading) { 
					return { "t": oReading.TIMESTAMP, "y": Number(oReading.VALUE) };
				});										
			})

		}).catch(function(error) {
			jQuery.sap.log.error("loadDataSets: " + error, null, _sComponent);			
			// TODO: raise Error

		}).then(function() {
			// force update bindings

			let oAxes = oChart.chartOptions.scales.xAxes[0];
			oAxes.scaleLabel = oAxes.scaleLabel || { };
			let oFromDate = oChart.chartCtrl.time.getFromDate();
			let oToDate = oChart.chartCtrl.time.getToDate();

			oAxes.scaleLabel.display = true;
			oAxes.scaleLabel.labelString = oFromDate.format("DD.MM. HH:mm") + " - " + oToDate.format("DD.MM. HH:mm");

			that.checkUpdate(true);
		});
								
	};
	

	/**
	 * Retrieve data from backend for data set <code>oDataSet</code>
	 * 
	 * @param {object} oDataSet Dataset of a chart 
	 * @param {de.kjumybit.fhem.chart.TimeLine} oTimeLine Time intervall for data points
	 * @returns {promises} DbLog backend request
	 * @private 
	 */
	ChartModel.prototype._loadDataSet = function(oDataSet, oTimeLine) {

		let oMyDataSet = oDataSet;
		let oMyTimeLine = oTimeLine;

		// let oFhem = FhemCore.getFhemService();
		//TODO: create & save DataSourceBinding
		let oFhemDS = this._getFhemDataSource(oDataSet.fhemDataSource);
		let oDbLog = new DbLogModel({
			"logDevice": oFhemDS.logDevice,
			"device": oFhemDS.device,
	        "reading": oFhemDS.reading
		});

		return new Promise(function(resolve, reject) {

			let oFromDate = oMyTimeLine.getFromDate();
			let oToDate = oMyTimeLine.getToDate();

			oDbLog.load({
				from: { 
					date: oFromDate.format("YYYY-MM-DD"),
					time: oFromDate.format("HH:mm:ss")
				},
				to: {
						date: oToDate.format("YYYY-MM-DD"),
						time: oToDate.format("HH:mm:ss")
				},
				success: function(oDbLogData) { 
					//TODO: use new class
					resolve( { dataSet: oMyDataSet, dbLogData: oDbLogData } ) 
				},
				error: reject				
			});

			/*
			oFhem.callDbLogQuery(oFhemDS.logDevice, {
				from: { 
					date: moment().format("YYYY-MM-DD"),
					time: "00:00:00"
				},
				to: {
						date: moment().format("YYYY-MM-DD"),
						time: moment().format("HH:MM:SS")
				},
				device: oFhemDS.device, 
				reading: oFhemDS.reading,
				success: function(oDbLogData) { 
					//TODO: use new class
					resolve( { dataSet: oMyDataSet, dbLogData: oDbLogData } ) 
				},
				error: reject
			});
			*/
		});
	};

	/**
	 * Get chart 
	 * @param {string} sChart Chart ID
	 * @returns {object} Chart object
	 */
	ChartModel.prototype.getChart = function(sChart) {
		return this._getChart(sChart);
	};
	

	/**
	 * Shift time interval back
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.shiftBack = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.shift(TimeLine.ShiftAction.BackShort);
		this._loadDataSets(oChart);
	};


	/**
	 * Shift time interval forth
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.shiftForth = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.shift(TimeLine.ShiftAction.ForthShort);
		this._loadDataSets(oChart);
	};


	/**
	 * Shift time interval back using a long distance
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.shiftBackLong = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.shift(TimeLine.ShiftAction.BackLong);
		this._loadDataSets(oChart);
	};


	/**
	 * Shift time interval forth using a long distance
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.shiftForthLong = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.shift(TimeLine.ShiftAction.ForthLong);
		this._loadDataSets(oChart);
	};


	/**
	 * Zoom in resp. scale down the time interval.
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.zoomIn = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.zoom(TimeLine.ZoomAction.In);

		// update local model
		let oZoomLevel = this.oData.chartCtrl.zoomLevel;
		if (oZoomLevel.position > 0) {
			oZoomLevel.position--;
		}

		this.setProperty('/chartCtrl/zoomLevel', oZoomLevel);
		this._loadDataSets(oChart);
	};


	/**
	 * Zoom out resp. scale up the time interval.
	 * @param {string} sChart Chart ID
	 */
	ChartModel.prototype.zoomOut = function(sChart) {
		let oChart = this._getChart(sChart);
		oChart.chartCtrl.time.zoom(TimeLine.ZoomAction.Out);

		// update local model
		let oZoomLevel = this.oData.chartCtrl.zoomLevel;
		if (oZoomLevel.position < (oZoomLevel.count - 1)) {
			oZoomLevel.position++;
		}

		this.setProperty('/chartCtrl/zoomLevel', oZoomLevel);		
		this._loadDataSets(oChart);
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
	 * 						"/chartCtrl/zoomLevel"
	 * @param {object} oValue an object in the format expected by the supported path
	 * 						"/<ChartID>/chartType"
	 * 						"/<ChartID>/chartOptions"
	 * 						"/<ChartID>/chartData"
	 * 						"/chartCtrl/zoomLevel" 
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

		if ( sChart === "chartCtrl" ) {
			
			let sSubProperty = (bIsRelative ? aPath[2] : aPath[3])

			switch (sProperty) {
			case "zoomLevel":
				this.oData.chartCtrl.zoomLevel[sSubProperty] = oValue;
				break;
			default:
				break;
			}

		} else {

			let oChart = this._getChart(sChart);
			//TODO: check valid chart

			// TODO: check type of oData or use specific data type
			switch (sProperty) {
			case "chartType":
				oChart.chartType = oValue;
				break;
			case "chartOptions":
				oChart.chartOptions = oValue;
				break;			
			case "chartData":
				// TODO: check type of oData or use specific data type
				oChart.chartData = oValue;
				break;
			default:
				return false;
			}
		
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

		if ( sChart === "chartCtrl" ) {
			let sSubProperty = (bIsRelative ? aPath[2] : aPath[3])
			switch (sProperty) {
			case "zoomLevel":
				oValue = this.oData.chartCtrl.zoomLevel[sSubProperty];
				break;
			default:
				break;
			}
		} else {

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
			case "chartCtrl":
				//***TODO		
				break;		
			default:
				break
			}
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