/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([ 
	"sap/ui/core/UIComponent", 
	"sap/ui/Device", 
	"jquery.sap.global",
	"de/kjumybit/fhem/core",
	"de/kjumybit/fhem/model/models",
	"sap/ui/model/json/JSONModel",	
	"sap/ui/core/IconPool",
	"de/kjumybit/fhem/libs/Settings",
	"de/kjumybit/fhem/service/FhemService"
], function(UIComponent, Device, jQuery, fhem, Models, JSONModel, IconPool, Settings, FhemService) {
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

			//TODO					
			jQuery.sap.log.setLevel(jQuery.sap.log.Level.DEBUG);
			jQuery.sap.log.debug("init: before Super.apply()", null, 'Component');

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			jQuery.sap.log.debug("init: after Super.apply()", null, 'Component');

			// create the views based on the url/hash
			this.getRouter().initialize();

			// initialize component runtime state model
			this.setModel(Models.createRuntimeModel(), "runtime");
			
			// set the device model
			this.setModel(Models.createDeviceModel(), "device");
			
			// set the local app configuration model
			this.oSettings = new Settings(); 
			this.setModel(this.oSettings.getModel(), "settings" );
			
			this._registerFhemIcons();
			
			// initialize own library
			fhem.init(this);		// TODO

			jQuery.sap.log.debug("init: finished", null, 'Component');			
		},
		
						
		
		/**
		 * Register custom Fhem icon font at SAPUI5 core
		 */
		_registerFhemIcons: function() {
			//TODO: implement a generic algorithm
			IconPool.addIcon("din_rail_housing", "fhem", "fhem", "\e900");
			IconPool.addIcon("door", "fhem", "fhem", "\e931");			
			IconPool.addIcon("door_open", "fhem", "fhem", "\e932");
			IconPool.addIcon("hm_cc_rt_dn", "fhem", "fhem","\e933");
			IconPool.addIcon("hm_ccu", "fhem", "fhem","\e934");
			IconPool.addIcon("hm-dis-wm55", "fhem", "fhem","\e935");
			IconPool.addIcon("hm_keymatic", "fhem", "fhem","\e936");
			IconPool.addIcon("hm_lan", "fhem", "fhem","\e937");
			IconPool.addIcon("it_network", "fhem", "fhem","\e938");
			IconPool.addIcon("it_router", "fhem", "fhem","\e939");
			IconPool.addIcon("it_wifi", "fhem", "fhem","\e93a");
			IconPool.addIcon("measure_power", "fhem", "fhem","\e93b");
			IconPool.addIcon("measure_power_meter", "fhem", "fhem","\e93c");
			IconPool.addIcon("measure_voltage", "fhem", "fhem","\e93d");
			IconPool.addIcon("measure_water_meter", "fhem", "fhem","\e93e");
			IconPool.addIcon("message_light_intensity", "fhem", "fhem","\e93f");
		},

		/**
		 * The content density adapts itself based on the device type
		 * @returns {string} sContentDensityClass Content Density Class
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