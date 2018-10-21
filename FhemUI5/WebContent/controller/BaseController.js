sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"	
], function (Controller, JSONModel) {
		"use strict";

		const _sComponent = "BaseController";		
		
		return Controller.extend("de.kjumybit.fhem.controller.BaseController", {
			
			/**
			 * 
			 */
			onInit: function() {
			
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		
			},
						
			
			/**
			 * Get array index of property value of an JSON object in an array
			 * @param {string} sProperty the name of an object property 
			 * @param {object} value the property value
			 * @param {object[]} aArray an array of JSON objects
			 * @return {number} iIndex the array index o fthe frist object with mathich property value
			 *                   or -1, if no object has been found
			 */
			getArrayIndex: function (sProperty, value, aArray) {
				var index = -1;
				for (var i=0, iL=aArray.length; i<iL; i++) {
					var o = aArray[i];
					if (o[sProperty] && o[sProperty] == value) {
						index = i;
						break;
					}
				}
				return index;
			},
									
			
			/**
			 * Set & Get Fhem service model from component property
			 * 
			 * @returns {de.kjumybit.fhem.service.FhemService} Fhem Service
			 */
			getFhemModel: function () {
				return this.getOwnerComponent().fhemModel;
				//TODO: use model name <Fhem>
				// return this.getComponentModel('Fhem');	
			},
			

			setFhemModel: function (oFhemModel) {
				this.getOwnerComponent().fhemModel = oFhemModel;
				// (re)set Fhem Service Model
				jQuery.sap.log.debug("Set Fhem service model", null, _sComponent);	
				this.getOwnerComponent().setModel(oFhemModel, 'Fhem');
			},

			
			/**
			 * Get JSON Model for Fhem metadata
			 * @returns {sap.ui.model.json.JSONModel} JSON Model with Fhem metadata
			 */
			getFhemMetaModel: function () {
				let oModel = this.getOwnerComponent().getModel('fhemMetaData');
				if (!oModel) {
					jQuery.sap.log.debug("Create new Fhem metadata model", null, _sComponent);					
					oModel = new JSONModel();
					this.getOwnerComponent().setModel(oModel, 'fhemMetaData');
				}
				return oModel;
			},
							
			
			/**
			 * Get settings object.
			 * 
			 * @return {oSettings} [de.kjumybit.fhem.libs.Settings]
			 */
			getSettings: function () {
				return this.getOwnerComponent().oSettings;			
			},
			
			
			getRuntimeModel: function() {
				return this.getOwnerComponent().getModel('runtime');	
			},
			
			
			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @return {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			
			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @return {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
				return this.getView().getModel(sName);
			},

			
			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @return {sap.ui.model.Model} the model instance
			 */
			getComponentModel : function (sName) {
				return this.getOwnerComponent().getModel(sName);
			},

			
			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @return {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			
			/**
			 * Getter for the resource bundle.
			 * @public
			 * @return {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

		});

	}
);