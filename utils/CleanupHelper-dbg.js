sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        cleanupGameView: function(oController) {
            // ← ALLES reinigen!
            const oContainer = oController.byId("quizContainerVBox") || oController.byId("allQuestionsContainerVBox");
            if (oContainer) {
                oContainer.removeAllItems();
            }
            
            // Progress Footer leeren
            const oFooter = oController.byId("footerProgress");
            if (oFooter) {
                oFooter.removeAllItems();
            }
            
            // Arrays leeren
            oController._questionControls = [];
            
            // Quiz-Model löschen
            oController.getView().setModel(null, "quiz");
            
            console.log("✅ Cleanup komplett!");
        },
        
        resetSettings: function(oGameSettings) {
            oGameSettings.setProperty("/correctAnswersCount", 0);
            oGameSettings.setProperty("/settingsAreSet", false);
            oGameSettings.setProperty("/selectedTopics", []);
            oGameSettings.setProperty("/selectedSingleTopic", null);
        }
    };
});
