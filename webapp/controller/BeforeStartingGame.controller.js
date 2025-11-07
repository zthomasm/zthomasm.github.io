sap.ui.define([
  "learninggame/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function(BaseController, JSONModel, MessageToast) {
  "use strict";

  return BaseController.extend("learninggame.controller.BeforeStartingGame", {

    onInit: function() {
      // Settings Model aus Component holen
      this._oSettingsModel = this.getOwnerComponent().getModel("GameSettings");

      // Default Topics, falls leer
      var aSelectedTopics = this._oSettingsModel.getProperty("/selectedTopics");
      var aAvailTopics = this._oSettingsModel.getProperty("/availableTopics");
      if (!aSelectedTopics || aSelectedTopics.length === 0) {
        this._oSettingsModel.setProperty("/selectedTopics", aAvailTopics.map(t => t.key));
      }

      // Default Creators
      var aCreators = this._oSettingsModel.getProperty("/selectedCreators");
      if (!aCreators || aCreators.length === 0) {
        this._oSettingsModel.setProperty("/selectedCreators", ["ALL"]);
      }
    },

    onSliderChange: function(oEvent) {
      var iValue = oEvent.getParameter("value");
      this._oSettingsModel.setProperty("/numberOfQuestions", iValue);
    },

    onSelectAllTopics: function() {
      var aAvailTopics = this._oSettingsModel.getProperty("/availableTopics");
      this._oSettingsModel.setProperty("/selectedTopics", aAvailTopics.map(t => t.key));
    },

    onDeselectAllTopics: function() {
      this._oSettingsModel.setProperty("/selectedTopics", []);
    },

    onStartGamePress: function() {
      var aSelTopics = this._oSettingsModel.getProperty("/selectedTopics") || [];
      if (aSelTopics.length === 0) {
        MessageToast.show("Bitte mindestens ein Thema auswählen.");
        return;
      }

      // Navigation zur Game View (Wizard)
      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.navTo("game"); // Route 'game' im Manifest anlegen
    }

  });
});
