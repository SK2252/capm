sap.ui.define([
    "sap/ui/core/ComponentContainer"
], function (ComponentContainer) {
    "use strict";

    // Initialize the application
    new ComponentContainer({
        name: "ccep.sustainability.dashboard",
        settings: {
            id: "ccep.sustainability.dashboard"
        },
        async: true
    }).placeAt("app-container");
});
