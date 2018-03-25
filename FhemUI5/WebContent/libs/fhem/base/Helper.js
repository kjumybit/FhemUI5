/**
 * Status helper functions
 *  
 */
sap.ui.define([
	'jquery.sap.global',
],
	function(jQuery) {
	"use strict";

	/**
	 * ChartModelFactory
	 * 
	 * @static
	 * @namespace
	 */
	var Helper = {};
	
	
	/**
	 * Get array index of property value of an JSON object in an array
	 * @param sProperty the name of an object property 
	 * @param value the property value
	 * @param aArray an array of JSON objects
	 * @returns iIndex the array index o fthe frist object with mathich property value
	 *                 or -1, if no object has been found
	 */
	 Helper.getArrayIndex = function (sProperty, value, aArray) {
		let index = -1;
		for (let i=0, iL=aArray.length; i<iL; i++) {
			let o = aArray[i];
			if (o[sProperty] && o[sProperty] == value) {
				index = i;
				break;
			}
		}
		return index;
	};
	

	return Helper;

}, /* bExport= */ true);