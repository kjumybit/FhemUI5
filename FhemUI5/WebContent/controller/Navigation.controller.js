sap.ui.define([
	"de/kjumybit/fhem/controller/BaseController",
	"de/kjumybit/fhem/libs/Settings",	
	"jquery.sap.global",	
	"sap/ui/model/json/JSONModel",	
	"sap/tnt/NavigationList",
	"sap/tnt/NavigationListItem",
	"de/kjumybit/fhem/service/FhemService"	
], function(BaseController, Settings, jQuery, JSONModel, NavigationList, NavigationListItem, FhemService) {
	"use strict";

	const _sComponent = "Navigation";
	
	return BaseController.extend("de.kjumybit.fhem.controller.Navigation", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf helloworld.Main
		 */
		onInit: function() {
		
			jQuery.sap.log.debug("onInit", null, _sComponent);
			
			// call the base component's init function
			BaseController.prototype.onInit.apply(this, arguments);

		},

		
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf helloworld.Main
		 */
		onBeforeRendering: function() {

			jQuery.sap.log.debug("onBefore", null, _sComponent);
			
			this.oRuntimeModel = this.getRuntimeModel();
            this.oSettings = this.getSettings(); 
            this.oNavModel = this.getModel("sideNavigation");
            
			// connect to Fhem backend server and get metadata model
			if ( this.oSettings.isComplete() ) {				
				this._createFhemModel(this.oSettings);

	            //TODO: re-design event based depending in Fhem metadate changed
	            var oSideNavCtrl = this.getView().byId("sideNavigation");           
    				            
				oSideNavCtrl.setModel(this.oNavModel);
	            
	            // create item aggregation: requires Navigation List
				var oNavigationListTemplate = this._createNavigationList();
				
	            // bind item aggregation
				oSideNavCtrl.setItem(oNavigationListTemplate);
	            	            
			}
								
		},

		
		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */

		
		/**
		 * Handle press on Settings button. Display app settings dialog. 
		 */
		onPressSettings: function(oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("settingsDlg");
			
			if (!oDialog) {
				// create dialog via fragment factory (provide 'this' to enable callback handlers
				oDialog = sap.ui.xmlfragment(oView.getId(), "de.kjumybit.fhem.view.SettingsDialog", this);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}

			oDialog.open();		
		},
		
		
		/**
		 * Handle close settings dialog.
		 * - Save settings properties and
		 * - (Re-) connect to the Fhem service.
		 *  
		 */
		onPressCloseSettingsDlg: function(oEvent) {
			oEvent.getSource().getParent().close();

			if ( this.oSettings.isComplete() ) {
				this.oSettings.save();
				// (re) connect to Fhem backend server and get metadata model				
				this._createFhemModel(this.oSettings);
			}
		},
		

		/**
		 * Handles item selection in navigation list on level 1 
		 * (overview, devices, rooms, ...)
		 * 
		 * @parameter oEvent ..,
		 * @parameter oEvent.getSource() ... Navigation List Item (Level 1)   
		 */
		onNavItemSelect: function(oEvent) {
			
			var oRouter = this.getRouter();
			var oItem = oEvent.getParameters("item");
			if (!oItem) return;
			
			// get model binding of selected navigation item
			var oBindingContext = oEvent.getSource().getBindingContext('sideNavigation');
			if (!oBindingContext) return;
			
			// get view name of item
			var oItemProperty = oBindingContext.getProperty();
			if (oItemProperty.view) {
				oRouter.navTo(oItemProperty.view, true);
			}
		},
		

		/**
		 * Handles sub item selection in navigation list on level 2 
		 * (group, device, room, device type, ...) and selected sub item
		 * 
		 * item			target view
		 *  
		 * group		device list filtered by group
		 * device		device details 
		 * room			device list filtered by room
		 * device type	device list filtered by device type
		 * 
		 * @parameter oEvent ..,
		 * @parameter oEvent.getSource() ... Navigation List Item (Level 2)   
		 */
		onNavSubItemSelect: function(oEvent) {
			
			var oRouter = this.getRouter();
			var oItem = oEvent.getParameters("item");
			if (!oItem) return;
			
			// get model binding of selected navigation item
			let oNavItem = oEvent.getSource();
			let oBindingContext = oNavItem.getBindingContext('sideNavigation');
			if (!oBindingContext) return;
			
			// determine target view from navigation model for parent item 
			var oParentItem = oNavItem.getParent();
			var oParentProperty = oParentItem.getBindingContext('sideNavigation').getProperty();
			var oItemProperty = oBindingContext.getProperty();
								
			if (oParentProperty.detailView.view) {
				// and prepare item ID as navigation parameter "deviceID" or as query parameter)				
				let mParameter = {};
				
				if (oParentProperty.detailView.parameter) {
					// use item ID as parameter value (in detail views)
					mParameter[oParentProperty.detailView.parameter] = oItemProperty.itemId;					
				} else if (oParentProperty.detailView.query) {
					// use item ID as query parameter value in device list
					mParameter.query = {};
					mParameter.query[oParentProperty.detailView.query] = oItemProperty.itemId;
				}
				
				oRouter.navTo(oParentProperty.detailView.view, mParameter, true);  // no history				
			}

		},
		
		
		/**
		 * Handles page Back button press
		 * Hide navigation view (master page)
		 */
		onPressNavigationBack: function(oEvent) {
			//TODO
			this.getOwnerComponent()._oApp.setMode("HideMode");
			this.getOwnerComponent()._oApp.hideMaster();
		},

		
		/** ================================================================================
		 *  Private functions
		 ** ================================================================================ */

		
		/**
		 * Create navigation list item template with binding to model "sideNavigation" for
		 * - main items: /appNavTree/dynamicItems(navItemID)
		 * - sub items:  /appNavTree/dynamicItems/items(itemId)
		 * 
		 * @return {sap/tnt/NavigationList} the navigation list
		 */
		_createNavigationList: function() {
			
			var oNavigationListTemplate = new NavigationList({
				items: {
					template: new NavigationListItem({
						text: '{sideNavigation>navItemID}',
						items: {
							template: new NavigationListItem({
								text: '{sideNavigation>itemId}',
								select: [this.onNavSubItemSelect, this],								
							}),
							path: 'sideNavigation>items',
							templateShareable: "false"					//avoids framework warning
						},
						expanded: false,
						select: [this.onNavItemSelect, this],
						icon: "sap-icon://fhem/hm_ccu"
					}),
					path: 'sideNavigation>/appNavTree/dynamicItems',      //no curly brackets here!
					templateShareable: "false"
				},
				width: "auto"
			});
			
			return oNavigationListTemplate;
		},
						
		
		/**
		 * Establish connection to Fhem backend server.
		 * An existing connection is closed before.
		 * 
		 * @param {oSettings}
		 */
		//TODO: check for connection change
		_createFhemModel : function (oSettings) {
			
			let mSettings = oSettings.getModel().getProperty("/");			
			let fhemModel = this.getFhemModel();
			
			if (fhemModel) {
				// close existing connection
				fhemModel.disconnect();
			}
			
			// create new Fhem model and connect to backend
			fhemModel = new FhemService({
				"host": mSettings.server.host, 
				"port": mSettings.server.port
			});

			// register client handler
			fhemModel.attachMetaDataLoaded(null, this._onMetaDataLoaded.bind(this), this);
			fhemModel.attachMetaDataLoadFailed(null, this._onErrorFhemConnection.bind(this), this);
			fhemModel.attachConnectionClosed(null, this._onFhemDisconnect.bind(this), this);


			// local testing 
			/*
			oModel.loadData("model/fhemJsonList2.json");
			this.setModel(oModel, "Fhem" );  
			this._setSideNavModelfromFhem();			
			*/
			
			this.setFhemModel(fhemModel);
		},

		
		_onFhemConnection : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},

		
		_onErrorFhemConnection : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},
		
		
		_onFhemDisconnect : function(oEvent) {
			this._setRuntimeFhemConnectionState(false);
		},

		
		/**
		 * Handle Fhem metadata 
		 * Set & update local models
		 * - Side navigation model 
		 */
		//TODO create sideNavigation if required
		_onMetaDataLoaded : function(oEvent) {
			
			this._setRuntimeFhemConnectionState(true);			
			
			/*
			let oMetaModel = this.getFhemMetaModel();
			let oFhem = this.getFhemModel(); 
			oMetaModel.setData(oFhem.getServiceMetadata());
			oMetaModel.refresh();
			*/

			// oMetaModel.loadData("model/fhemJsonList2.json"); // local testing
  
			let oFhem = this.getFhemModel();
			this._setSideNavModelfromFhem(oFhem);
		},
		
		
		/**
		 * update Fhem connection state in runtime model 
		 */
		_setRuntimeFhemConnectionState: function( bConnected ) {					
			this.oRuntimeModel.setProperty("/fhemConnection/isConnected", bConnected);
		},
		
		
		/**
		 * Set sideNavigation model with Fhem metadata
		 * - Groups (TODO)
		 * - Rooms
		 * - Device Types
		 * - Device Sub Types
		 * 
		 *  @params {oFhem}  //TODO
		 */
		_setSideNavModelfromFhem: function(oFhem) {
			
			var oFhemData = oFhem.getServiceMetadata();
			var oNavModel = this.getModel("sideNavigation");
			var oNavItems = oNavModel.getProperty("/appNavTree/dynamicItems");
			
			// Iterate over all main navigation items (Fhem categories). If a main navigation item contais 
			// a reference to a Fhem metadeta property then add corresponding Fhem items as sub item.
			for (var i=0, iL=oNavItems.length; i<iL; i++ ) {
				if (oNavItems[i].fhemModelRef.setName) {
					
					oNavItems[i].items = [];	
					var aFhemItems = oFhemData[oNavItems[i].fhemModelRef.setName];
					if (!aFhemItems) continue;
					
					for (var j=0, jL=aFhemItems.length; j<jL; j++) {
						oNavItems[i].items.push({
							"itemId": (oNavItems[i].fhemModelRef.nameProperty ? aFhemItems[j][oNavItems[i].fhemModelRef.nameProperty] : aFhemItems[j] ) 
						});
					}
				}
			}
			// update navigation model
			oNavModel.setProperty("/appNavTree/dynamicItems", oNavItems);
		},

		
	});
});
