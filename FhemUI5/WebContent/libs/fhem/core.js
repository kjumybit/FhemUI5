/**
 * Initialize library and provides core functions  
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	"./dblog/DbLogModel"	
],
	function(jQuery, DbLogModel) {
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
	var _oDataSources = null;		// DbLog Data Source configuration data
	var _oCharts = null;			// charts configuration data
	
	var _aDbLogModels = [];			
	
	/**
	 * Initialize library
	 * 
	 * @public
	 */
	 core.Init = function (oComponent) {
		 //TODO

		 _oMyComponent = oComponent; 
		 _loadConfiguration();
		 
		return true;
	};

	
	/**
	 * Get Fhem Service
	 *  
	 * @returns {de.kjumybit.fhem.service.FhemService) oFhemService Fhem backend service
	 * @public
	 */
	 core.getFhemService = function () {
		return _oMyComponent.fhemModel;
	};
	
	
	/**
	 * Get DbLog Model for Fhem data source
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model 
	 * @returns {de.kjumybit.fhem.dblog.DbLogModel} oDbLogModel
	 * @public
	 */
	 core.getDbLogModel = function (sName) {
		 //TODO
		return undefined;
	};
	

	/**
	 * Set DbLog Model for Fhem data source
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model
	 * @param {de.kjumybit.fhem.dblog.DbLogModel} oDbLogModel Instance of a DbLogModel
	 * 
	 * @returns {boolean} bSuccess Model has been added successfully.  
	 * @public
	 */
	 core.setDbLogModel = function (sName, oDbLogModel) {
		 //TODO
		return true;
	};


	/**
	 * Get Chart configuration Model (Meta Model)
	 *  
	 * @returns {sap.ui.model.JSONModel} oModel Chart configuration model
	 * @public
	 */
	 core.getChartMetaModel = function (sName) {
		return _oChartModel;
	};
	
	
	// ===============
	// private section
	// ===============
	
	/**
	 * Load configuration from manifest and or JSON models.
	 */
	var _loadConfiguration = function() {
		
		// get chart configuration model
		_oChartModel = _oMyComponent.getModel('chartConfig');
		_oDataSources = _oChartModel.getProperty("/fhemDataSources");
		_oCharts =  _oChartModel.getProperty("/charts");
	};
	
	
	/**
	 * Get DbLog Model for Fhem data source identified by {sName} in the charting configuration file.
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model 
	 * @returns {de.kjumybit.fhem.dblog.DbLogModel} oModel The model or undefined, if not found.
	 * @private
	 */
	var _getDbLogModel = function(sName) {
		jQuery.sap.assert(typeof sName === "string" && !/^(undefined|null)?$/.test(sName), "sName must be a string");
		
		if (!_aDbLogModels[sName] && _loadDbLogModel(sName)) {
			// load & instantiate new model from configuration
			_aDbLogModels[sName] = _loadDbLogModel(sName);
		}
		
		return this.oModels[sName];
	};
	
	
	/**
	 * Set DbLog Model {oModel} for Fhem data source within the component identified by {sName} 
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model
	 * @param {de.kjumybit.fhem.dblog.DbLogModel} oModel the model to be set or <code>null</code> or <code>undefined</code>
	 * 
	 * @returns {boolean} bSuccess Model has been added successfully.  
	 * @private
	 */
	var _setDbLogModel = function(sName, oModel) {
		
		jQuery.sap.assert(oModel == null || oModel instanceof Model, "oModel must be an instance of de.kjumybit.fhem.dblog.DbLogModel, null or undefined");
		jQuery.sap.assert(typeof sName === "string" && !/^(undefined|null)?$/.test(sName), "sName must be a string or omitted");
		
		if (!oModel && this.oModels[sName]) {
			delete this.oModels[sName];
		} else if ( oModel && oModel !== this.oModels[sName] ) {
			//TODO: handle null!
			this.oModels[sName] = oModel;
		} // else nothing to do
		return true;
	};
 	
	
	/**
	 * Load and instantiate new DbLog Model for a Fhem data source identified with {sName} from configuration.
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model 
	 * @returns {de.kjumybit.fhem.dblog.DbLogModel} oModel The model or undefined, if not found.
	 * @private
	 */
	var _loadDbLogModel = function(sName) {
		
		let oModel = undefined;
		let oFhemService = _oMyComponent.getFhemModel();
		let oDataSource = _oDataSources[sName];
		
		if (oDataSource) {
			oModel = new DbLogModel({
				sLogDevice: oDataSource.logDevice,
				sDevice: oDataSource.device,	
				sReading: oDataSource.reading
			}, oFhemService);			
		}
		
		return oModel;		
	};
	
	
	return core;

}, /* bExport= */ true);