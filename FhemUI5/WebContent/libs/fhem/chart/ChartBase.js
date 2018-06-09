sap.ui.define([
  'sap/ui/core/Control'
], function(Control) {
  'use strict';

  var CHART_CANVAS_NAME_PREFIX = 'chartJSCanvas';

  return Control.extend('de.kjumybit.fhem.chart.ChartBase', {
	  
    metadata: {
      properties: {
        width: {
          type: 'int',
          defaultValue: 400
        },
        height: {
          type: 'int',
          defaultValue: 400
        },
        responsive: {
          type: 'string',
          defaultValue: 'false'
        },
        maintainAspectRatio: {
          type: 'string',
          defaultValue: 'true'
        },
        chartType: {
          type: 'string',
          defaultValue: 'Line',
          bindable : "bindable"
        },
        data: {
          type: 'object', 
          bindable : "bindable"
        },
        options: {
          type: 'object', 
          bindable : "bindable"
        }
      },
      events: {
        update: {
          enablePreventDefault: true
        }
      }
    },

    
    /**
     * 
     */
    init: function() {
      this._newCustomChart = null;
    },

    
    /**
     * 
     */
    onBeforeRendering: function() {
      // set global property for responsiveness
      if (this.getResponsive() === "true") {
        Chart.defaults.global.responsive = true;
      } else {
        Chart.defaults.global.responsive = false;
      }

      // set global property for aspect ratio
      if (this.getMaintainAspectRatio() === "true") {
        Chart.defaults.global.maintainAspectRatio = true;
      } else {
        Chart.defaults.global.maintainAspectRatio = false;
      }
    },

    
    /**
     * 
     */
    onAfterRendering: function() {
      // Get the context of the canvas element we want to select
      var ctx = document.getElementById(CHART_CANVAS_NAME_PREFIX + this.getId()).getContext("2d");


        var chartType = this.getChartType().charAt(0).toLowerCase() + this.getChartType().slice(1);
        var chartData = this.getData();
        var chartOptions = this.getOptions();
       
        // hint: the Chart object stores a reference of chartData, but not for the chartOptions
        this._newCustomChart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: chartOptions
        });
    },

    
    /**
     * 
     */
    exit: function() {
      this._newCustomChart.destroy();
    },

    
    /**
     * 
     */
    renderer: function(oRm, oControl) {
      //var oBundle = oControl.getModel('i18n').getResourceBundle();
      var width = oControl.getWidth();
      var height = oControl.getHeight();

      //Create the control
      oRm.write('<div');
      oRm.writeControlData(oControl);
      oRm.addClass("chartJSControl");
      oRm.addClass("sapUiResponsiveMargin");
      oRm.writeClasses();
      oRm.write('>');

      oRm.write('<canvas id="' + CHART_CANVAS_NAME_PREFIX + oControl.getId() + '" width="' + width + '" height="' + height + '"></canvas>');

      oRm.write('</div>');
    },

    
    /**
     * Handles <code>update</code> event. 
     */
    update: function(oEvent) {
      this._update();
    },
    
        
    /**
     * Set chart type.
     */
    setChartType: function(sChartType) {
      this.setProperty("chartType", sChartType, true);
    },
    
    
    /**
     * Set chart options.
     * Hint: update the options member in the chart.js object.
     */
    setOptions: function(oOptions) {
      this.setProperty("options", oOptions, true);    	
      if (this._newCustomChart) {
        this._newCustomChart.options = oOptions;
      };
      this._update();  
    },
    
    
    /**
     * Set chart data with one or multipe data sets.
     */
    setData: function(oData) {
      this.setProperty("data", oData, true);
      this._update();    	
    },

   /**
    * update chart
    */
    _update: function() {
      // TODO: this._newCustomChart is not instantiated on Init of the control
      // the chart.js object should be implemented in constructor instead
      if (this._newCustomChart) {
        this._newCustomChart.update();
      }
      
    }
    
    
  });
});
