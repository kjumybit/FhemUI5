/** 
 * FhemUI5 App
 * 
 * @author kjumybit
 * @license MIT
 * @version 0.1
 * 
 */
sap.ui.define([
	"de/kjumybit/fhem/controller/BaseController",
	"jquery.sap.global",	
	"sap/tnt/NavigationList",
	"sap/tnt/NavigationListItem",
	"de/kjumybit/fhem/service/FhemService"	
], function(BaseController, jQuery, NavigationList, NavigationListItem, FhemService) {

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

			this.fhemModel = this.getFhemModel();

			// register client handler
			this.fhemModel.attachMetaDataLoaded(null, this._onMetaDataLoaded.bind(this), this);
			this.fhemModel.attachMetaDataLoadFailed(null, this._onErrorFhemConnection.bind(this), this);
			this.fhemModel.attachConnectionClosed(null, this._onFhemDisconnect.bind(this), this);
			
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
		 * Handles page Back button press
		 * Hide navigation view (master page)
		 * 
		 * @param {object} oEvent Button event
		 */
		onPressNavigationBack: function(oEvent) {

			this._closeMasterView(true);
		},


		/**
		 * Handles press on button "Settings"
		 * Open Settings view as detail page.
		 * Replace current detail view but don't close master view.
		 * 
		 * @param {object} oEvent Button event
		 */		
		onPressSettings: function(oEvent) {

			var sPageId = "SettingsView";

			jQuery.sap.log.info("Navigate to settings view " + sPageId, null, _sComponent);

			// replace current detail view with new detail in navigation container for detail pages
			this.getSplitAppObj().toDetail(this.getDetailPageId(sPageId)); 

		},


		/**
		 * Handles item selection in navigation list on level 1 
		 * (overview, devices, rooms, ...)
		 * 
		 * @param {object} oEvent Navigation item select event
		 */
		onNavItemSelect: function(oEvent) {
			
			//var oRouter = this.getRouter();
			var oItem = oEvent.getParameters("item");
			if (!oItem) return;
			
			// get model binding of selected navigation item
			var oBindingContext = oEvent.getSource().getBindingContext('sideNavigation');
			if (!oBindingContext) return;
			
			// get view name of item
			var oItemProperty = oBindingContext.getProperty();
			if (oItemProperty.view) {				
				//oRouter.navTo(oItemProperty.view, true);

				jQuery.sap.log.info("Navigate to detail view " + oItemProperty.view, null, _sComponent);
			
				// replace current detail view with new detail in navigation container for detail pages
				this.getSplitAppObj().toDetail(this.getDetailPageId(oItemProperty.view), "show"); 
	
				this._closeMasterView(false);
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
		 * 
		 * @param {object} oEvent Sub item select event
		 */
		/*
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
		*/
		
		
		/** ================================================================================
		 *  Private functions
		 ** ================================================================================ */

		/**
		 * On Phones there is always only one view visible. The current master view mus be replaced
		 * by a detail view. 
		 * - the detail view must have been loaded by the router (or on bootstrap)
		 * - if we navigate to a new detail view, it is already set by the <code>onNavItemPress</code>.
		 * - if we go back to the current (last) detail view  by <code>onPressNavigationBack</code> we have 
		 *   request a navigation
		 * 
		 * OpenUI5 Docu:
		 * - hideMaster() and showMaster: 
		 *   Used to hide/show the master page when in ShowHideMode and the device is in portrait mode.
		 * 
		 * @param {boolean} bBackToDetailView Navigate to current detail view 
		 */
		_closeMasterView: function(bBackToDetailView) {

			let oApp = this.getSplitAppObj();

			jQuery.sap.log.info("Close master view", null, _sComponent);

			// enable Master Button on Detail Views
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', true);

			switch (this.getViewMode()) {
				case this.ViewMode.full:
					// hide master view 
					oApp.setMode("HideMode"); 
					break;
				case this.ViewMode.overlay:
					// hide master view 
					oApp.setMode("HideMode"); 
					break;					
				case this.ViewMode.single:
					// if called from navigation item, the new target detail view is loaded, but 
					// not active, so do a navigation only if triggerd by the navigation back button			
					if (bBackToDetailView) {
						// navigate to (current) detail view (replace master view)
						// getPreviousPage() returns a detail view as we have have even one master view
						let oDetailView = oApp.getPreviousPage();
						jQuery.sap.log.info("Navigate to previous page " + oDetailView.getId(), null, _sComponent);
						oApp.toDetail(oDetailView.getId()); 	
					}					
					break;
				default:					
			}

			// keep default master button invisible
			this.hideDefaultMasterButton();			
		},

		
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
						/*
						items: {
							template: new NavigationListItem({
								text: '{sideNavigation>itemId}',
								select: [this.onNavSubItemSelect, this],								
							}),
							path: 'sideNavigation>items',
							templateShareable: "false"					//avoids framework warning
						},
						*/
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
			
			// create new Fhem model and connect to backend
			this.fhemModel.connect({
				"host": mSettings.server.host, 
				"port": mSettings.server.port
			});

			// local testing 
			/*
			oModel.loadData("model/fhemJsonList2.json");
			this.setModel(oModel, "Fhem" );  
			this._setSideNavModelfromFhem();			
			*/			
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
		 * 
		 * @param {object} oEvent Fhem event
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
  
			this._setSideNavModelfromFhem(this.fhemModel);
		},
		
		
		/**
		 * update Fhem connection state in runtime model 
		 * 
		 * @param {boolean} bConnected Connected to Fhem Service
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
		 *  @param {object} oFhem Fhem Service model
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
