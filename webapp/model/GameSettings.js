sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        createSettingsForGameModel: function() {
            return new JSONModel({
                // 
                settingsAreSet: false,
                numberOfQuestions: 5,
                selectedTopics: ["SAPUI5 Basics", "Fiori Architecture", "KI"],
                availableTopics: [
                    { key: "SAPUI5 Basics", text: "SAPUI5 Basics" },
                    { key: "Fiori Architecture", text: "Fiori Architecture" },
                    { key: "SAPUI5 Controls", text: "SAPUI5 Controls" },
                    { key: "KI", text: "Von KI erstellt" }
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);