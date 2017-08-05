sap.ui.define([
	"de/kjumybit/fhem/controller/BaseController",
	"sap/tnt/NavigationList",
	"sap/tnt/NavigationListItem"
], function(BaseController, NavigationList, NavigationListItem) {
	"use strict";

	return BaseController.extend("de.kjumybit.fhem.controller.Navigation", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf helloworld.Main
		 */
		onInit: function() {
			
            var oNavModel = this.getModel("sideNavigation");
            var oSideNavCtrl = this.getView().byId("sideNavigation");
			oSideNavCtrl.setModel(oNavModel);
            
            // create item aggregation: requires Navigation List
			var oNavigationListTemplate = this._createNavigationList();
			
            // bind item aggregation
			oSideNavCtrl.setItem(oNavigationListTemplate);
			
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf helloworld.Main
		 */
//		onBeforeRendering: function() {
//
//		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf helloworld.Main
		 */
//		onAfterRendering: function() {
//
//		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf helloworld.Main
		 */
//		onExit: function() {
//
//		},

		
		/**
		 * Create navigation list items
		 * @returns {sap/tnt/NavigationList} the navigation list
		 */
		_createNavigationList: function() {
			
			var oNavigationListTemplate = new NavigationList({
				items: {
					template: new NavigationListItem({
						text: '{sideNavigation>navItemID}',
						items: {
							template: new NavigationListItem({
								text: '{sideNavigation>itemId}'
							}),
							path: 'sideNavigation>items',
							templateShareable: "false"					//avoids framework warning
						},
						expanded: false
					}),
					path: 'sideNavigation>/appNavTree/dynamicItems',      //no curly brackets here!
					templateShareable: "false"
				}
			});
			
			return oNavigationListTemplate;
		},
		
		
		/**
		 * Handles item selection in navigation list depending on 
		 * item level (overview, devices, rooms) and item 
		 */
		onNavItemSelect: function(item) {
			var oRouter = this.getRouter();
			
			//TODO: Testing: it works
			oRouter.navTo("overview");
		},
		
	
		/**
		 * Handles page Back button press
		 * Hide navigation view (master page)
		 */
		onPressMasterBack: function() {
			//TODO
		}
		
	});
});
