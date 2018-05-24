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

	var UNIT = {
		hour : {
			short: "h",
			plural: "hours",
			shiftDistance: {
				short: { value: 30, unit: "minutes"},
				long:  { value: 1, unit: "hours"}
			}
		},
		day : {
			"short": "d",
			"plural": "days", 
			shiftDistance: {
				short: { value: 12, unit: "hours"},
				long:  { value: 1, unit: "days"}
			}
		},
		week : {
			short: "w",
			plural: "weeks",
			shiftDistance: {
				short: { value: 4, unit: "days"},
				long:  { value: 1, unit: "week"}
			}
		},
		month : {
			short: "M",
			plural: "months",
			shiftDistance: {
				short: { value: 15, unit: "days"},
				long:  { value: 1, unit: "months"}
			}
		}		
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
		let oAllignedDate = oFromDate.clone();
		switch (sResolution) {
			case unit.HOUR:
				oAllignedDate.add(nSize, 'h');
				break;
			case unit.DAY:
				oAllignedDate.add(nSize, 'd');
				break;
			case unit.WEEK:
				oAllignedDate.add(nSize, 'w');
				break;
			case unit.MONTH:
				oAllignedDate.add(nSize, 'M');
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
			this.sResolutionOrig = mSettings.resolution;
			this.nSizeOrig = mSettings.size;

			let oFromDate = adjustStartDate(this.oFromDateOrig, this.sResolutionOrig);
			this.setFromDate(oFromDate);
			this.setToDate(adjustToDate(oFromDate, this.oToDateOrig, this.sResolutionOrig, this.nSizeOrig));
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
				"reset", "shift", "zoomIn", "zoomOut"
			]
		}

	});

	
	/**
	 * Move the time interval back or forth depending on direction <code>sDirection</code>.
	 * The distance half of the current interval size. The resolution and size of the time 
	 * intervall is not changed.
	 * 
	 * @param {TimeLine.ShiftAction} sShiftAction Direction an distance for interval shift:
	 * @public
	 */
	TimeLine.prototype.shift = function(sShiftAction ) {

		let oFromDate = this.getFromDate();
		let nSize = this.getSize();
		let sResolution = this.getResolution();
		let oShiftDistance = UNIT[sResolution].shiftDistance;
		
		// shift start date of intervall
		switch (sShiftAction) {
			case TimeLine.ShiftAction.BackShort:
				// half interval size back 
				oFromDate.subtract(oShiftDistance.short.value, oShiftDistance.short.unit);							
				break;
			case TimeLine.ShiftAction.BackLong:
				// one interval size back
				oFromDate.subtract(oShiftDistance.long.value, oShiftDistance.long.unit);			
				break;
			case TimeLine.ShiftAction.ForthShort:
				// half interval size forth 			
				oFromDate.add(oShiftDistance.short.value, oShiftDistance.short.unit);							
				break;
			case TimeLine.ShiftAction.ForthLong:
				// one interval size forth			
				oFromDate.add(oShiftDistance.long.value, oShiftDistance.long.unit);			
				break;				
			default:
				break;
		}
		
		// add current interval size to new start date to get new end date of intervall
		let oToDate = oFromDate.clone();
		oToDate.add(nSize, UNIT[sResolution].plural);
		
		jQuery.sap.log.info(this + " - shift: [" + oFromDate.format("DD.MM. HH:mm:ss") + "," + oToDate.format("DD.MM. HH:mm:ss") + "]");

		this.setFromDate(oFromDate);
		this.setToDate(oToDate);
	};


	/** 
	 * Direction and distance for shifting the interval
	 * 
	 * @enum {string}
	 * @public
	 */
	TimeLine.ShiftAction = {
		BackShort: "backShort",
		BackLong: "backLong",
		ForthShort: "forthShort",
		ForthLong: "forthLong"
	};


	return TimeLine;
	
}, /* bExport= */ true);