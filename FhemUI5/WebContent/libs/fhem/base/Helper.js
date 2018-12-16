/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([
	'jquery.sap.global',
],
	function(jQuery) {
	"use strict";

	/**
	 *  Helper functions
	 * 
	 * @static
	 * @namespace
	 */
	var Helper = {};
	
	
	/**
	 * Get array index of property value of an JSON object in an array
	 * 
	 * @param {string} sProperty the name of an object property 
	 * @param {any} value the property value
	 * @param {any[]} aArray an array of JSON objects
	 * @returns {number} iIndex the array index o fthe frist object with mathich property value
	 *                    or -1, if no object has been found
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