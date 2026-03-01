sap.ui.define([
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",

  // Utils
  "learninggame/utils/Timer",

], function(Fragment, MessageToast, Timer) {
  "use strict";

  return {
    /**
     * Öffnet den "Bevor du startest"-Dialog.
     * @param {sap.ui.core.mvc.Controller} oController - Der aufrufende Controller (z. B. StartPage)
     */

    openBeforeStartDialog: function(oController, sTopicModelName, sMode) {
      const oView = oController.getView();
      const oModel = oController.getOwnerComponent().getModel(sTopicModelName);

      oView.setModel(oModel, "topicModel");
      oModel.setProperty("/sMode", sMode);

      const sDialogId = "beforeStartingDialog";

      if (oController.byId(sDialogId)) {
        oController.byId(sDialogId).destroy();
      } 

      // Falls der Dialog noch nicht existiert → lazy load
      // if (!oController._pBeforeStartDialog) {
        oController._pBeforeStartDialog = Fragment.load({
          id: oView.getId(),
          name: "learninggame.fragment.BeforeStartingGame",
          controller: {

            onSliderChange: function(oEvent) {
              var iValue = oEvent.getParameter("value");
              oModel.setProperty("/numberOfQuestions", iValue);
              console.log("Slider changed to " + iValue);

              // Timer
              this._updateTimerCalculation();
            },

            onChangeTimePicker: function(oEvent) {
              this._updateTimerCalculation();
            },

            _updateTimerCalculation: function() {
                const iValue = oModel.getProperty("/numberOfQuestions");
                const oTimerModel = oView.getModel("Timer");
                const sTimer = oTimerModel.getProperty("/sValueOfTimer");
                const iSecondsPerQuestion = Timer.calculateTimePerQuestion(iValue, sTimer);
                oTimerModel.setProperty("/iValueInSeconds", iSecondsPerQuestion);
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
              const sMode = oModel.getProperty("/sMode");


              const oTimerModel = oView.getModel("Timer");
                if (oTimerModel.getProperty("/bTimerActivated")) {
                  const sTimer = oTimerModel.getProperty("/sValueOfTimer");
                  const iSeconds = this._parseTimeToSeconds(sTimer);
                  
                  if (iSeconds === 0 || !sTimer || sTimer === "00:00:00") {
                      MessageToast.show("Bitte geben Sie eine gültige Zeit ein");
                      return;
                  }
              }


              switch (sMode) {
                // CASE
                case "showAllQuestions":
                  const sSingleTopic = oModel.getProperty("/singleTopic")
                  if (!sSingleTopic) {
                    MessageToast.show("Bitte ein Thema auswählen.");
                    return;
                  }
                  oModel.setProperty("/selectedSingleTopic", sSingleTopic);
                  break;
                
                case "gameMode":
                  const aSelTopics = oModel.getProperty("/selectedTopics") || [];
                  if (aSelTopics.length === 0) {
                    MessageToast.show("Bitte mindestens ein Thema auswählen.");
                    return;
                  }
                  break;
                default:
                  break;
              }

              // const aSelTopics = oModel.getProperty("/selectedTopics") || [];
              //   if (aSelTopics.length === 0) {
              //     MessageToast.show("Bitte mindestens ein Thema auswählen.");
              //     return;
              //   }
            
              oView.byId("beforeStartingDialog").close();
              
              const oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
              
              switch (sMode) {
                case "showAllQuestions":
                  console.log("BeforeRouteAllQuestions");
                  oModel.setProperty("/settingsAreSet", true);
                  oRouter.navTo("RouteAllQuestions");
                  break;
                case "gameMode":
                  console.log("BeforeRouteGameLinear");
                  oModel.setProperty("/settingsAreSet", true);
                  oRouter.navTo("RouteGameLinear");
                  break;
              
                default:
                  break;
              }
            },

            _parseTimeToSeconds: function(sTimeString) {
                var aParts = sTimeString.split(":");
                return parseInt(aParts[0], 10) * 3600 + 
                      parseInt(aParts[1], 10) * 60 + 
                      parseInt(aParts[2], 10);
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
      // }

      oController._pBeforeStartDialog.then(function(oDialog) {
        oDialog.open();
      });
      
    }
  };
});
