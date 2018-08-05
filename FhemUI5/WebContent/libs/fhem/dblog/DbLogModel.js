/**
 * Model for a Fhem data base logging device
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/model/ClientModel',
	'de/kjumybit/fhem/core'
],
	function(jQuery, ClientModel, FhemCore) {
	"use strict";


	/**
	 * Load and instantiate new DbLog Model for a Fhem data source identified with {sName} from configuration.
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model 
	 * @returns {de.kjumybit.fhem.dblog.DbLogModel} oModel The model or undefined, if not found.
	 * @private
	 */
	//TODO: rework
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


	/**
	 * Get DbLog Model for Fhem data source identified by {sName} in the charting configuration file.
	 * 
	 * @param {string} sName the name of the Fhem data source in the configuration model 
	 * @returns {de.kjumybit.fhem.dblog.DbLogModel} oModel The model or undefined, if not found.
	 * @private
	 */
	//TODO: rework	
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
	//TODO: rework	
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
	 * @param {object} mSettings Settings object
	 * @param {String} mSettings.logDevice Name of Fhem DbLog Device   
	 * @param {String} mSettings.gevice Name of Fhem Device
	 * @param {String} mSettings.reading Name of Device Reading  
	*/
	var DbLogModel = ClientModel.extend("de.kjumybit.fhem.dblog.DbLogModel", /** @lends de.kjumybit.fhem.dblog.DbLogModel.prototype */ {
		
		/**
		 * 
		 */
		constructor: function(mSettings) {
			ClientModel.apply(this, arguments);

			this._mSettings = mSettings;
		},	
		
	
		/**
		 * 
		 */
		metadata: {
			
			// methods
			publicMethods : [
				"load"
			],					
			
			// events
			events: {
				"changed": {}
			}								
		},
						
	});
		

	/**
	 * Load data set for device reading in time interval defined in <code>mSettings</code>.
	 * 
	 * @param {object} mSettings Settings object
	 * @param {String} mSettings.from intervall start date and time
	 * @param {String} mSettings.to intervall end date and time
	 * @param {String} mSettings.success callback function <code>success(oDbLogData)</code> on success
	 * @param {String} mSettings.error callback function <code>error(oError)</code> on error
	 * @public 
	 */
	DbLogModel.prototype.load = function(mSettings) {

		jQuery.sap.log.info(this + " - DbLog request sent: " + this._mSettings.device + ":" + this._mSettings.reading);

		let oFhemService = FhemCore.getFhemService();

		oFhemService.callDbLogQuery(this._mSettings.logDevice, {
			from: { 
				date: mSettings.from.date,
				time: mSettings.from.time
			},
			to: {
					date: mSettings.to.date,
					time: mSettings.to.time
			},
			device: this._mSettings.device, 
			reading: this._mSettings.reading,
			success: mSettings.success,
			error: mSettings.error
		});

	};

	return DbLogModel;
	
}, /* bExport= */ true);