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
			zoomLevel: "h1"
		},
		day : {
			zoomLevel: "d1"			
		},
		week : {
			zoomLevel: "w1"						
		},
		month : {
			zoomLevel: "M1"						
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
	 * Zoom levels of the time intervall.
	 * The zoom level defines the size of the time intervall.
	 * The <code>up.value</code> is the time difference in <code>up.unit</code>
	 * to the new date from and date to value of time interval on the next upper 
	 * zoom level.
	 */
	var ZOOMLEVELS = [
		{ id: "m30", unit: "m", size: 30, up: { value: 15, unit: "m" },
			shiftDistance: {
				short: { value: 15, unit: "m" },
				long:  { value: 30, unit: "m" }
			}
		},
		{ id: "h1", unit: "h", size: 1, up: { value: 30, unit: "m" },
			shiftDistance: {
				short: { value: 30, unit: "m" },
				long:  { value: 1, unit: "h" }
			}
		},
		{ id: "h2", unit: "h", size: 2, up: { value: 1, unit: "h" },
			shiftDistance: {
				short: { value: 1, unit: "h" },
				long:  { value: 2, unit: "h" }
			}
		},
		{ id: "h4", unit: "h", size: 4, up: { value: 2, unit: "h" },
			shiftDistance: {
				short: { value: 2, unit: "h" },
				long:  { value: 4, unit: "h" }
			}
		},
		{ id: "h8", unit: "h", size: 8, up: { value: 4, unit: "h" },
			shiftDistance: {
				short: { value: 4, unit: "h" },
				long:  { value: 8, unit: "8" }
			}
		},
		{ id: "h16", unit: "h", size: 16, up: { value: 4, unit: "h" },
			shiftDistance: {
				short: { value: 8, unit: "h" },
				long:  { value: 16, unit: "h" }
			}
		},
		{ id: "d1", unit: "d", size: 1, up: { value: 12, unit: "h" },
			shiftDistance: {
				short: { value: 12, unit: "h"},
				long:  { value: 1, unit: "d"}
			}
		},
		{ id: "d2", unit: "d", size: 2, up: { value: 1, unit: "d" },
			shiftDistance: {
				short: { value: 1, unit: "d"},
				long:  { value: 2, unit: "d"}
			}
		},
		{ id: "d4", unit: "d", size: 4, up: { value: 2, unit: "d" },
			shiftDistance: {
				short: { value: 2, unit: "d"},
				long:  { value: 4, unit: "d"}
			}
		},												
		{ id: "w1", unit: "w", size: 1, up: { value: 3, unit: "d" },
			shiftDistance: {
				short: { value: 3, unit: "d"},
				long:  { value: 7, unit: "d"}
			}
		},
		{ id: "w2", unit: "w", size: 2, up: { value: 7, unit: "d" },
			shiftDistance: {
				short: { value: 7, unit: "d"},
				long:  { value: 14, unit: "d"}
			}
		},
		{ id: "M1", unit: "M", size: 1, up: { value: 15, unit: "d" }, 
			shiftDistance: {
				short: { value: 15, unit: "d"},
				long:  { value: 1, unit: "M"}
			}
		},
		{ id: "M2", unit: "M", size: 2, 
			shiftDistance: {
				short: { value: 1, unit: "M"},
				long:  { value: 2, unit: "M"}
			}
		}
	];


	var getIndexOfZoomLevelId = function(sZoomLevel) {
		return ZOOMLEVELS.findIndex( function(zoomLevel) {
			return zoomLevel.id === sZoomLevel;
		});
	};


	var getZoomLevelForTimeUnit = function(sTimeUnit) {
		return UNIT[sTimeUnit].zoomLevel;
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
			
			this.setZoomLevel(getZoomLevelForTimeUnit(mSettings.resolution));
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
				zoomLevel: {
					type: 'string',
					defaultValue: 'd1'
				}
			},

			// methods
			publicMethods : [
				"getZoomSteps", "reset", "shift", "zoom"
			]
		}

	});


	/** 
	 * Zoom out (enlarge) or Zoom in (reduce) the size of time interval. 
	 * The size of the time intervall is doubled or halved while the middle 
	 * of the current time interval is not changed.
	 * The resolution cannot exceed a minimum or maximum value (size).
	 * 
	 * @param {TimeLine.ZommAction} sZoomAction Zoom action
	 * @public
	 */
	TimeLine.prototype.zoom = function(sZoomAction) {
		let sZoomLevel = this.getZoomLevel();
		let iCurrZoom = getIndexOfZoomLevelId (sZoomLevel);
		let iNewZoom = iCurrZoom;
		
		if ( sZoomAction === TimeLine.ZoomAction.Out ) {
			iNewZoom++
		}  else {
			 iNewZoom--
		};

		// check min / max resolution (zoom level)
        if (iNewZoom < 0 || iNewZoom >= ZOOMLEVELS.length) {
			return;
		}

		// get time shift and new resolution of the new interval
		let oCurrZoomLevel = ZOOMLEVELS[iCurrZoom]; 
		let oNewZoomLevel = ZOOMLEVELS[iNewZoom];


		// set new date from & date to value of time intervall
		let oFromDate = this.getFromDate();

		if (sZoomAction === TimeLine.ZoomAction.Out) {
			//	enlarge time intervall
			oFromDate.subtract(oCurrZoomLevel.up.value, oCurrZoomLevel.up.unit); 	
		} else {
			// reduce time intervall
			oFromDate.add(oNewZoomLevel.up.value, oNewZoomLevel.up.unit);			
		};

		let oToDate = oFromDate.clone();
		oToDate.add(oNewZoomLevel.size, oNewZoomLevel.unit);

		jQuery.sap.log.info(this + " - zoom: level " + oNewZoomLevel.id + " [" + oFromDate.format("DD.MM. HH:mm:ss") + "," + oToDate.format("DD.MM. HH:mm:ss") + "]");

		// update properties
		this.setZoomLevel(oNewZoomLevel.id);
		this.setFromDate(oFromDate);
		this.setToDate(oToDate);
	};   


	/** 
	 * Get zoom levels of the time intervall.
	 * 
	 * @returns {any[]} Zoom levels
	 * @public
	 */
	TimeLine.getNumberOfZoomLevels = function() {
		return ZOOMLEVELS.length;
	};   


	/** 
	 * Get definition of current zoom level.
	 * 
	 * @returns {object} Zoom level definition data
	 * @private
	 */
	TimeLine.prototype._getCurrentZoomLevel = function() {
		let sZoomLevel = this.getZoomLevel();
		let iCurrZoom = getIndexOfZoomLevelId (sZoomLevel);
		return ZOOMLEVELS[iCurrZoom]; 
	};   


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
		let oZoomLevel = this._getCurrentZoomLevel();
		let oShiftDistance = oZoomLevel.shiftDistance;

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
		oToDate.add(oZoomLevel.size, oZoomLevel.unit);

		jQuery.sap.log.info(this + " - shift: level " + oZoomLevel.id + " [" + oFromDate.format("DD.MM. HH:mm:ss") + "," + oToDate.format("DD.MM. HH:mm:ss") + "]");

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


	/**
	 * Zoom in or Zoom out the interval
	 */
	TimeLine.ZoomAction = {
		In: "in",
		Out: "out"
	};


	return TimeLine;
	
}, /* bExport= */ true)