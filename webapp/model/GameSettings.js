sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        createSettingsForGameModel: function() {
            return new JSONModel({
                // 
                settingsAreSet: false,
                numberOfQuestions: 1,
                selectedTopics: ["SAPUI5 Basics", "Fiori Architecture"],
                availableTopics: [
                    { key: "SAPUI5 Basics", text: "SAPUI5 Basics" },
                    { key: "Fiori Architecture", text: "Fiori Architecture" },
                    { key: "SAPUI5 Controls", text: "SAPUI5 Controls" }
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);