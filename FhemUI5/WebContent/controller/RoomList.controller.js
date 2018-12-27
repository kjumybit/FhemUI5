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
	'de/kjumybit/fhem/controller/BaseController',
	'sap/m/GenericTile',
	'sap/m/TileContent',
	'sap/m/NumericContent',	
	'de/kjumybit/fhem/model/formatter',
	'de/kjumybit/fhem/model/grouper'
], function(jQuery, BaseController, GenericTile, TileContent, NumericContent, Formatter, Grouper) {
	"use strict";

	const _sComponent = "RoomList";	

	return BaseController.extend("de.kjumybit.fhem.controller.RoomList", {

		
		// init local members
		formatter: Formatter,
		grouper: Grouper,
			
		/**
		* Called when a controller is instantiated and its View controls (if available) are already created.
		* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		* @memberOf helloworld.Main
		*/
		onInit: function() {
	
			// register event handler called every time the detail view is displayed
			this.getView().addEventDelegate({
				onBeforeShow: this.onBeforeShow,
			}, this);			
			
			// register hook for initializations each time the view is displayed
			//this.getRouter().getRoute('RoomList').attachPatternMatched(this.onDisplay, this);
							
		},
	
		
		/**
		* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		* (NOT before the first rendering! onInit() is used for that one!).
		* @memberOf helloworld.Main
		*/
		onBeforeRendering: function() {
			
			jQuery.sap.log.debug("onBeforeRendering", null, _sComponent);	

			// set own navigation button
			let bMaster = !this.getSplitAppObj().isMasterShown();
			this.getRuntimeModel().setProperty('/header/masterBtnVisible', bMaster);

			// hide master button
			this.hideDefaultMasterButton();

			// call hook at view creation time
			this.onDisplay();
		},
	
		
		/**
		 * Own hook called each time the view is displayed
		 */
		onDisplay: function() {
						
		},
		
		
		/** 
		 * Triggered before displaying the view when Split Container navigation is used.
		 * 
		 * @param {object} oData Payload of the navigation.
		 */
		onBeforeShow: function (oData) {
			this.onDisplay();

			// create tiles 
			this._createTiles();
		},


		/** ================================================================================
		 *  App event handler
		 ** ================================================================================ */

		
		/**
		 * Handles press on a tile.
		 * Navigate to the device list view, filtered by the room assigned to the selected
		 * tile.
		 * The room ID is stored in the subheader property of the tile.
		 * 
		 * @param {object} oEvent Tile press event parameter
		 */
		onTilePress: function (oEvent) {
			
			let oTile = oEvent.getSource();

			this.getSplitAppObj().toDetail(this.getDetailPageId("DeviceListView"), "show", { 
				room: oTile.getSubheader()
			}); 

			//let oRouter = this.getRouter();			
			//oRouter.navTo("DeviceList", {
			//	"query": {
			//		"room": oTile.getSubheader()
			//	}
			//}); 				
		},
				
		
		/** ================================================================================
		 *  Private functions
		 ** ================================================================================ */
		
		
		/**
		 * Create Tile controls for all Fhem rooms. Add properties
		 * - room name
		 * - most severe status (error, waring, info)
		 * - icon
		 * - number of devices
		 */
		//TODO: replace "Beschreibung" and numeric content
		_createTiles: function() {
						
			var aRooms = this.getFhemModel().getRoomSet();
			
			for (var i = 0, iL = aRooms.length; i < iL; i++) {
				var sRoom = aRooms[i];
				var oTile = new GenericTile("roomList_" + sRoom, {
					header: 'Beschreibung',
					subheader: sRoom
				});
				var oContent = new TileContent().setContent(
						new NumericContent({
							icon: 'sap-icon://line-charts',
							value: i,
							valueColor: ((i % 2)? 'Error': 'Good') 
						}));
				oTile.addTileContent(oContent);
				oTile.attachPress(this.onTilePress, this);
				oTile.addStyleClass("sapUiSmallMarginEnd");
				oTile.addStyleClass("sapUiSmallMarginBottom");
				oTile.placeAt(this.byId("TileRoomList"));
			}
			
		},
		
			
	});
});
