/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([
	'sap/m/GroupHeaderListItem'
], function(GroupHeaderListItem) {
	
	"use strict";

	var grouper = {
			
			/**
			 * TODO 
			 */
			getDeviceSetGroupHeader: function (oGroup){
				return new GroupHeaderListItem( {
					title: oGroup.key,
					upperCase: false
				} );
			}	};
	
	return grouper;

}, /* bExport= */ true);