/**
 * Model for a Fhem data base logging device
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	"sap/ui/model/ClientModel"
],
	function(jQuery, ClientModel) {
	"use strict";

	/**
	 * @param {object} mSettings Settings object
	 * @param {String} mSettings.sLogDevice Name of Fhem DbLog Device   
	 * @param {String} mSettings.sDevice Name of Fhem Device
	 * @param {String} mSettings.sReading Name of Device Reading  
	*/
	var DbLogModel = ClientModel.extend("de.kjumybit.fhem.dblog.DbLogModel", /** @lends de.kjumybit.fhem.dblog.DbLogModel.prototype */ {


		/**
		 * 
		 */
		constructor: function(mSettings, oFhemService) {
			ClientModel.apply(this, arguments);
			
			/**
			 * Fhem service
			 */
			this._oFhemService = oFhemService;			
			this._mSettings = mSettings;

		},	
		
	
		/**
		 * 
		 */
		metadata: {
			
			// methods
			publicMethods : [
				"shiftBackward",
				"shiftForward",
				"extendBackward",
				"extendForward",
				"zoomIn",
				"zoomOut",
				"load"
			],					
			
			// events
			events: {
				"changed": {}
			}								
		},
						
	});
		
	
	// =========
	// statics
	// =========
	const DUR_M = 60 * 1000;
	const DUR_H = DUR_M * 60;
	const DUR_D = DUR_H * 24; 
	const DUR_W = DUR_D * 7; 

	return DbLogModel;
	
}, /* bExport= */ true);