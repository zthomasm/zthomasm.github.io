sap.ui.define([
    "sap/ui/core/UIComponent",
    "learninggame/model/models",
    "learninggame/model/GameSettings"
], (UIComponent, models, GameSettings) => {
    "use strict";

    return UIComponent.extend("learninggame.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            const oGameSettingsModel = GameSettings.createSettingsForGameModel();
            this.setModel(oGameSettingsModel, "GameSettings");

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});