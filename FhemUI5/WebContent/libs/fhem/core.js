/**
 * Initialize fhem service library and provides core functions  
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	'de/kjumybit/fhem/service/FhemService'	
],
	function(jQuery, FhemService) {
	"use strict";

	/**
	 * Core functions
	 * 
	 * @static
	 * @namespace
	 */
	var core = {};
	
	// private static properties
	var _oMyComponent = null;
	var _oChartModel = null;		// charting configuration JSON Model
	
	var _aDbLogModels = [];			

	
	// ===============
	// private section
	// ===============
	
	/**
	 * Load configuration from manifest and or JSON models.
	 */
	var _loadConfiguration = function() {

		// get chart configuration model
		_oChartModel = _oMyComponent.getModel('chartConfig');

	};
		
	
	/**
	 * Initialize library
	 * Set global models: 
	 * - <code>Charts</code>
	 * - <code>Fhem</code>
	 * 
	 * @param {sap.ui.core.Component} oComponent The SAPUI5 app component
	 * @returns {boolean} The core Fhem library has been initialized successfully
	 * @public
	 */
	 core.init = function (oComponent) {
		 //TODO

		 _oMyComponent = oComponent; 
		 _loadConfiguration();

		//sap.ui.require(['de/kjumybit/fhem/service/FhemService'], function(FhemService) {
		_oMyComponent.setModel(new FhemService(), "Fhem");		
		//});

		sap.ui.require(['de/kjumybit/fhem/chart/ChartModel'], function(ChartModel) {
			_oMyComponent.setModel(new ChartModel(), "Charts");		
		});

		return true;
	};

	
	/**
	 * Get Fhem Service
	 *  
	 * @returns {de.kjumybit.fhem.service.FhemService} Fhem backend service
	 * @public
	 */
	core.getFhemService = function () {
		return _oMyComponent.fhemModel;
	};
	

	/**
	 * Get Chart Model
	 *  
	 * @returns {de.kjumybit.fhem.chart.ChartModel} Chart Model
	 * @public
	 */
	core.getChartModel = function () {
		return _oMyComponent.getModel("Charts");		
	};

	
	/**
	 * Get Chart configuration Model (Meta Model)
	 * 
	 * @param {string} sName Model name
	 * @returns {sap.ui.model.JSONModel} oModel Chart configuration model
	 * @public
	 */
	core.getChartMetaModel = function (sName) {
		return _oChartModel;
	};
			
	
	return core;

}, /* bExport= */ true);