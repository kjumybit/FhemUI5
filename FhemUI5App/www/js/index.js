
(function () {
    'use strict';

    var app = {
        
        // Application Constructor
        initialize: function() {
            this.bindEvents();
        },
        
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        bindEvents: function() {
            document.addEventListener('deviceready', this.onDeviceReady, false);
        },
        
        
        // deviceready Event Handler
        //
        // The scope of 'this' is the event. In order to call the 'receivedEvent'
        // function, we must explicitly call 'app.receivedEvent(...);'
        onDeviceReady: function() {
            sap.ui.getCore().attachInit(function() {
                new sap.m.Shell({
                    appWidthLimited: false,
                    app: new sap.ui.core.ComponentContainer({
                        height : "100%",
                        name : "de.kjumybit.fhem"
                    })
                }).placeAt("content");
            });
        },
    };

    app.initialize();

}());