sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        createSettingsForGameModel: function() {
            return new JSONModel({
                // 
                numberOfQuestions: 10,
                selectedTopics: ["KI", "LearningHub", "Mitarbeiter"],
                availableTopics: [
                    { key: "KI", text: "KI-Fragen" },
                    { key: "LearningHub", text: "Learning Hub" },
                    { key: "Mitarbeiter", text: "Mitarbeiterfragen" }
                    ]

            });
        }
    }
}










);