sap.ui.define([
	'jquery.sap.global',
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"	
], function (jquery, Controller, JSONModel) {
		"use strict";

		const _sComponent = "BaseController";		
		
		return Controller.extend("de.kjumybit.fhem.controller.BaseController", {
			
			/**
			 * 
			 */
			onInit: function() {
			
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		
			},
				
							
			onExit : function () {
				if (this._oFhemConnPopover) {
					this._oFhemConnPopover.destroy();
				}
			},


			/**
			 * Handle press on Menue button at detail views.
			 * Show navigation view (master view)
			 * 
			 * @param {object} oEvent Button press event
			 */			
			onMenuBtnPress: function(oEvent) {
				let oApp = this.getSplitAppObj();
				oApp.setMode("ShowHideMode");

				let oMasterBtn = this.getOwnerComponent().getRootControl().byId('app-MasterBtn');
				if (oMasterBtn) { oMasterBtn.setVisible(false); }

				//jquery(".sapMSplitContainerMasterBtn").attr("hidden", "true");
				
				//oApp.showMaster();
				//oApp.toMaster('Navigation');
				//this.getRouter().navTo('Navigation');

			},


			/**
			 * Handle press on button for Fhem Connection within the default footer.
			 * Displays a popover dialog with adhoc actions and  options.
			 * 
			 * @param {object} oEvent Button press event
			 */
			handlePressBtnConnected: function(oEvent) {

				var oView = this.getView();
				var oDialog = oView.byId("connectionDlg");
				
				if (!oDialog) {
					// giving the view ID as fragment ID will allow calling this.byId(…) in the view’s controller 
					// to retrieve controls inside the fragment.
					// create dialog via fragment factory (provide 'this' to enable callback handlers
					oDialog = sap.ui.xmlfragment(oView.getId(), "de.kjumybit.fhem.view.FhemConnectionActions", this);
					// connect dialog to view (models, lifecycle)
					oView.addDependent(oDialog);
				}

				oDialog.openBy(oEvent.getSource());	
			},


			/**
			 * Fhem Connection Dialog
			 * Handle change switch for Fhem Event Update
			 * Enable or Disable Fhem Event updated in Fhem Model
			 * 
			 * @param {object} oEvent Button press event
			 */
			onChangeFhemEventUpdate: function(oEvent) {
				this.getFhemModel().setEnabledEventUpdate( oEvent.getSource().getState() );
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
				if (Array.isArray(aArray)) {
					for (var i=0, iL=aArray.length; i<iL; i++) {
						var o = aArray[i];
						if (o[sProperty] && o[sProperty] === value) {
							index = i;
							break;
						}
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
				return this.getComponentModel('Fhem');	
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


			/**
			 * Get Split App object
			 * 
			 * @returns {sap/m/SplitApp} Split App object
			 */
			getSplitAppObj : function() {
				// get Split App control 
				var oApp = this.getOwnerComponent().getRootControl().byId('app');
				if (!oApp)  {
					jQuery.sap.log.error("SplitApp object can't be found");
				}
				return oApp;
			}
	

		});

	}
);