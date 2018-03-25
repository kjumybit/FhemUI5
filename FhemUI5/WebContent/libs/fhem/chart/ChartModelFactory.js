/**
 * Factory to return a chart model for a specific basic chart type.
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	'./ChartModel'	
],
	function(jQuery, ChartModel) {
	"use strict";


	/**
	 * ChartModelFactory
	 * 
	 * @static
	 * @namespace
	 */
	var ChartModelFactory = {};
	
	
	/**
	 * Returns a concrete builder instance for a specific basic chart type
	 * defined by Chart.js.
	 *  
	 * @param {String} sChartId Chart ID in the configuration model
	 *   
	 * @returns {de.kjumybit.fhem.chart.ChartModel} The base chart model or a derived class of it.
	 */
	ChartModelFactory.createModel = function(sChartId, oController) {
		
		let oModel = oController.getModel('chartConfig');
		let mChart = oModel.getProperty('/charts/' + sChartId);
		let mDataSource = oModel.getProperty('/fhemDataSources');
		
		// prepare data sources
		let aDatasets = mChart.chartjs.chartData.datasets;
		
		aDatasets.forEach(function(mDataset){
			
			//TODO: get Fhem Data, current map local test data only
			if (mDataSource[mDataset.fhemDataSource].localData) {
				mDataset.data = mDataSource[mDataset.fhemDataSource].localData.slice(0);
			} else {
				//TODO: exceptions
			}
		});
			
		
		// create and return chart model
		let oChartModel = new ChartModel({
			sChart: sChartId,
			sChartType: mChart.chartjs.chartType,
			oChartOptions: mChart.chartjs.options
		});		
		oChartModel.setProperty("/chartData", mChart.chartjs.chartData);
		return oChartModel;
	}


	return ChartModelFactory;

}, /* bExport= */ true);