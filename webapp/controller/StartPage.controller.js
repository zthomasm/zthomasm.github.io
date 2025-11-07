sap.ui.define([
    "learninggame/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("learninggame.controller.StartPage", {
        onInit() {
        },

        onPressBeforeStartGame() {
            sap.m.MessageToast.show("onPressBeforeStartGame wird gestartet");
            this.getOwnerComponent().getRouter().navTo("RouteBeforeStartingGame")
        }
    });
});