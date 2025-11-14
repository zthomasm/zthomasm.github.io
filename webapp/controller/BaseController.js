sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/library",
    "sap/m/MessageToast",
    "sap/m/Label",
    // Models
    "learninggame/model/GameSettings",
    "learninggame/model/ResultsOfGame"
], function (Controller, library, MessageToast, Label, GameSettings, ResultsOfGame) {
    "use strict";

    return Controller.extend("learninggame.controller.BaseController", {
        onInit() {
        },

        onDebug(oModel) {
            console.log(oModel);
        }


    });
});