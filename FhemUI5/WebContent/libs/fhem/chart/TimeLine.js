/**
 * 
 *  
 */
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/base/ManagedObject',
	'moment'	
],
	function(jQuery, ManagedObject, moment) {
	"use strict";


	/** 
	 * Time units
	 */
	var unit = {
		HOUR: "hour",
		DAY: "day",
		WEEK: "week",
		MONTH: "month"
	};


	/** 
	 * Parse date specification <code>sDateSpec</code> and return a date value as <code>moments<code> object.
	 * @param {string} sDateSpec Date specification
	 * @returns {moments} Date value
	 * @private
	 */
	var getDate = function(sDateSpec) {
		let oDate = undefined;

		switch (sDateSpec) {
			case 'todayStart':				
				oDate = moment().startOf('day');
				break;
			case 'todayNow':
				oDate = moment();			
				break;			
			case 'todayEnd':
				oDate = moment().endOf('day');
				break;
			default:
				//TODO: throw exception
				break;
		}
		return oDate;
	};


	var adjustStartDate = function(oFromDate, sResolution) {
		let oAllignedDate = oFromDate;
		switch (sResolution) {
			case unit.HOUR:
				oAllignedDate = oFromDate.startOf('hour');
				break;
			case unit.DAY:
				oAllignedDate = oFromDate.startOf('day');
				break;
			case unit.WEEK:
				oAllignedDate = oFromDate.startOf('isoWeek');
				break;
			case unit.MONTH:
				oAllignedDate = oFromDate.startOf('month');
				break;		
			default:
				break;
		};
		return oAllignedDate;
	};


	var adjustToDate = function(oFromDate, oToDate, sResolution, nSize) {
		let oAllignedDate = oToDate;
		switch (sResolution) {
			case unit.HOUR:
				oAllignedDate = oToDate.add(nSize, 'h').endOf('hour');
				break;
			case unit.DAY:
				oAllignedDate = oToDate.add(nSize, 'd').endOf('day');
				break;
			case unit.WEEK:
				oAllignedDate = oToDate.add(nSize, 'w').endOf('isoWeek');
				break;
			case unit.MONTH:
				oAllignedDate = oToDate.add(nSize, 'M').endOf('month');
				break;
			default:
				break;
		};
		return oAllignedDate;
	};


	/**
	 * Constructor for a new TimeLine instance.
	 *  
	 * @class
	 * Time interval to control time series charts
	 *
	 * A <code>TimeLine</code> controls the size and resolution as well as the view port of a time scale in a chart.
	 * The resolution is defined by a time unit. It can be on eo fthe following: 
	 * <ul>
	 * <li><code>TimeLine.unit.HOUR</code></li>
	 * <li><code>TimeLine.unit.DAY</code></li>
	 * <li><code>TimeLine.unit.WEEK</code></li>
	 * <li><code>TimeLine.unit.MONTH</code></li>
	 * </ul>
	 * The view port defines the start time and end time of the time interval
	 * 
	 * @extends sap.ui.model.ManagedObject
	 *
	 * @author 
	 * @version 
	 *
	 * @param {object} mSettings Initial time base definition
	 * @param {moment} mSettings.fromKey Key for start time of time interval
	 * @param {moment} mSettings.toKey Key for end time of time interval
	 * @param {string} mSettings.resolution Time unit representing the resolution of the time scale
	 * @param {number} mSettings.size The value of the resolution (time unit) which defines the size of the time scale.
	 * @constructor
	 * @public
	 * @alias de.kjumybit.fhem.chart.TimeLine"
	 */

	var TimeLine = ManagedObject.extend("de.kjumybit.fhem.chart.TimeLine", /** @lends de.kjumybit.fhem.chart.TimeLine.prototype */ {	
		
		constructor: function(mSettings) {

			ManagedObject.apply(this, arguments);

			this.oFromDateOrig = getDate(mSettings.fromKey);
			this.oToDateOrig = getDate(mSettings.toKey);

			// set properties
			//this.setResolution(mSettings.resolution);
			//this.setSize(mSettings.size);

			this.setFromDate(adjustStartDate(this.oFromDateOrig, this.resolution));
			this.setToDate(adjustToDate(this.oFromDate, this.oToDateOrig, this.resolution, this.size));
		},

		metadata: {			
			// properties
			properties: {
				fromDate: {
					type: 'object'
				},
				toDate: {
					type: 'object'
				},
				resolution: {
					type: 'string',
					defaultValue: unit.DAY
				},
				size: {
					type: 'int',
					defaultValue: 1					
				  },					
			},

			// methods
			publicMethods : [
				"reset"
			],					
		}

	});

	
	return TimeLine;
	
}, /* bExport= */ true);