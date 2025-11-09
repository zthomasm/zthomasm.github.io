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
                selectedTopics: ["SAPUI5_LH", "SAPF_LH", "SAPFE_LH"],
                availableTopics: [
                    { key: "SAPUI5_LH", text: "1, SAPUI5 Learning Hub" },
                    { key: "SAPF_LH", text: "2, Fiori Learning Hub" },
                    { key: "SAPFE_LH", text: "3, SAP Fiori Elements Leaning Hub" },
                    { key: "SAPBASICS_LH", text: "4, SAP Fiori Basics Leaning Hub" },
                    { key: "SAPV4S_LH", text: "5, SAP Fiori Elements V4 Service Leaning Hub" },
                    { key: "SAPUI5A_LH", text: "6, SAPUI5 Advanced Learning Hub" },
                    { key: "KI", text: "Von KI erstellt" }
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);