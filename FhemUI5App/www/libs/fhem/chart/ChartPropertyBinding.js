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
	'sap/ui/model/ChangeReason', 
	'sap/ui/model/ClientPropertyBinding', 
	'sap/ui/model/ChangeReason'
],
	function(jQuery, ChangeReason, ClientPropertyBinding) {
	"use strict";

	/**
	 *
	 * @class
	 * Property binding implementation for Chart model
	 *
	 * @param {de.kjumybit.fhem.chart.ChartModel} oModel
	 * @param {string} sPath The following propterty paths are supported
	 * 						 "/chartData" 					
	 * @param {sap.ui.model.Context} oContext
	 * @param {object} [mParameters]
	 * @alias de.kjumybit.fhem.chart.ChartPropertyBinding
	 * @extends sap.ui.model.ClientPropertyBinding
	 */
	var ChartPropertyBinding = ClientPropertyBinding.extend("de.kjumybit.fhem.chart.ChartPropertyBinding");

	/**
	 * @see sap.ui.model.PropertyBinding.prototype.setValue
	 */
	ChartPropertyBinding.prototype.setValue = function(oValue){
		if (this.bSuspended) {
			return;
		}
		if (!jQuery.sap.equal(this.oValue, oValue)) {
			if (this.oModel.setProperty(this.sPath, oValue, this.oContext, true)) {
				this.oValue = oValue;
				this.getDataState().setValue(this.oValue);
				this.oModel.firePropertyChange({reason: ChangeReason.Binding, path: this.sPath, context: this.oContext, value: oValue});
			}
		}
	};

	/**
	 * Check whether this Binding would provide new values and in case it changed,
	 * inform interested parties about this.
	 *
	 * @param {boolean} bForceupdate
	 *
	 */
	ChartPropertyBinding.prototype.checkUpdate = function(bForceupdate){
		if (this.bSuspended && !bForceupdate) {
			return;
		}

		var oValue = this._getValue();
		if (!jQuery.sap.equal(oValue, this.oValue) || bForceupdate) {// optimize for not firing the events when unneeded
			this.oValue = oValue;
			this.getDataState().setValue(this.oValue);
			this.checkDataState();
			this._fireChange({reason: ChangeReason.Change});
		}
	};

	return ChartPropertyBinding;

});
