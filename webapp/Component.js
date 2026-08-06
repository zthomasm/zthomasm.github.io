sap.ui.define([
    "sap/ui/core/UIComponent",
    "learninggame/model/models",
    "learninggame/model/GameSettings",
    "learninggame/model/UserSettings",
    "learninggame/utils/AuthHelper",
    "learninggame/utils/OfflineSyncHelper"
], (UIComponent, models, GameSettings, UserSettings, AuthHelper, OfflineSyncHelper) => {
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

            const oBasicSettings = GameSettings.basicSettings();
            this.setModel(oBasicSettings, "basicSettings");

            const oUserSettings = UserSettings.userSettings();
            this.setModel(oUserSettings, "userSettings");

            const oAllUsers = UserSettings.allUsers();
            this.setModel(oAllUsers, "allUsers");

            const oAdminSettings = UserSettings.adminSettings();
            this.setModel(oAdminSettings, "adminSettings");

            const oTimer = GameSettings.optionalfunctionTimer();
            this.setModel(oTimer, "Timer");

            const oTopicModel = GameSettings.createTopicModel();
            this.setModel(oTopicModel, "TopicModel");

            const oGameSettingsModel1 = GameSettings.createSettingsForModelsFIORI();
            this.setModel(oGameSettingsModel1, "GameSettingsFIORI");

            const oGameSettingsModel2 = GameSettings.createSettingsForModelsABAP();
            this.setModel(oGameSettingsModel2, "GameSettingsABAP");

            const oGameSettingsModel3 = GameSettings.createSettingsForModelsISTQBFV4();
            this.setModel(oGameSettingsModel3, "GameSettingsISTQBFV4");

            const oGameSettingsModel4 = GameSettings.createSettingsForModelsSPANISH();
            this.setModel(oGameSettingsModel4, "GameSettingsSPANISH");

            const oBundleofAIModels = GameSettings.bundleofAIModels();
            this.setModel(oBundleofAIModels, "AIModels");

            AuthHelper.loadSessionIntoModel(oUserSettings);
            OfflineSyncHelper.initSync(oUserSettings);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});