sap.ui.define([
    "learninggame/controller/BaseController",
    "learninggame/utils/BeforeStartingGame"

], function (BaseController, BeforeStartingGame) {
    "use strict";

    return BaseController.extend("learninggame.controller.StartPage", {
        onInit() {
            this._oSettingsModel = this.getOwnerComponent().getModel("GameSettings");

        },

        onPressBeforeStartGame() {
            sap.m.MessageToast.show("onPressBeforeStartGame wird gestartet");
            BeforeStartingGame.openBeforeStartDialog(this);
        },

        onPressAddQuestion() {
            this.getOwnerComponent().getRouter().navTo("RouteAddQuestion");
        }
    });
});