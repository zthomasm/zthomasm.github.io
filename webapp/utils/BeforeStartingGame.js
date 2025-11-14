sap.ui.define([
  "sap/ui/core/Fragment",
  "sap/m/MessageToast"
], function(Fragment, MessageToast) {
  "use strict";

  return {
    /**
     * Öffnet den "Bevor du startest"-Dialog.
     * @param {sap.ui.core.mvc.Controller} oController - Der aufrufende Controller (z. B. StartPage)
     */
    openBeforeStartDialog: function(oController) {
      const oView = oController.getView();
      const oModel = oController.getOwnerComponent().getModel("GameSettings");

      // Falls der Dialog noch nicht existiert → lazy load
      if (!oController._pBeforeStartDialog) {
        oController._pBeforeStartDialog = Fragment.load({
          id: oView.getId(),
          name: "learninggame.fragment.BeforeStartingGame",
          controller: {

            onSliderChange: function(oEvent) {
                var iValue = oEvent.getParameter("value");
                oModel.setProperty("/numberOfQuestions", iValue);
                console.log("Slider changed to " + iValue)
            },

            onSelectAllTopics: function() {
              const aAvail = oModel.getProperty("/availableTopics");
              oModel.setProperty("/selectedTopics", aAvail.map(t => t.key));
              var iValueOfSelectedTopics = oModel.getProperty("/selectedTopics");
              console.log(iValueOfSelectedTopics);
            },

            onDeselectAllTopics: function() {
              oModel.setProperty("/selectedTopics", []);
              console.log(oModel.getProperty("/selectedTopics", []));
            },

            onCancelDialog: function() {
              oView.byId("beforeStartingDialog").close();
            },

            onConfirmDialog: function() {
              const aSelTopics = oModel.getProperty("/selectedTopics") || [];
              if (aSelTopics.length === 0) {
                MessageToast.show("Bitte mindestens ein Thema auswählen.");
                return;
            }
            
                oView.byId("beforeStartingDialog").close();
            
                oModel.setProperty("/settingsAreSet", true);

                const oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
                oRouter.navTo("RouteGameLinear");
                // this.getOwnerComponent().getRouter().navTo("RouteBeforeStartingGame");
            },

            onDebug: function() {
                // console.log(oModel.getProperty("/selectedTopics", []));;

                const oModel = oView.getModel("GameSettings");
                const aSel = oModel.getProperty("/selectedTopics");
                console.log("DEBUG aktuelles GameSettings Model:", oModel.getData());
                console.log("DEBUG aktuell ausgewählte Topics:", aSel);
            }
          }
        }).then(function(oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }

      oController._pBeforeStartDialog.then(function(oDialog) {
        oDialog.open();
      });
    }
  };
});
