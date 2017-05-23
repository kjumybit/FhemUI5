sap.ui.define([ 
	"sap/ui/core/UIComponent", 
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel", 
	"de/kjumybit/fhem/model/models" 
], function(UIComponent, Device, JSONModel, models) {
			"use strict";

			return UIComponent.extend("de.kjumybit.fhem.Component", {

				metadata : {
					manifest : "json"
				},

				/**
				 * The component is initialized by UI5 automatically during the
				 * startup of the app and calls the init method once.
				 * 
				 * @public
				 * @override
				 */
				init : function() {

					// call the base component's init function
					UIComponent.prototype.init.apply(this, arguments);

					// create the views based on the url/hash
					this.getRouter().initialize();

					// set the device model
					this.setModel(models.createDeviceModel(), "device");

					// set the local app configuration model
					this.setModel(models.createAppSettingsModel(), "settings");

					// set own components (models etc.)
					jQuery.sap.require("MyNamespace.Module");
					this.myService = new MyNamespace.Module.Service();

				},

				/**
				 * The content density adapts itself based on the device type
				 */
				getContentDensityClass : function() {
					if (!this._sContentDensityClass) {
						if (!sap.ui.Device.support.touch) {
							this._sContentDensityClass = "sapUiSizeCompact";
						} else {
							this._sContentDensityClass = "sapUiSizeCozy";
						}
					}
					return this._sContentDensityClass;
				}
			});
		})