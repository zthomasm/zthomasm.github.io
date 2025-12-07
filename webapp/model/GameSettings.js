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
                selectedTopics: [],
                availableTopics: [
                    // Learning Hub
                    { key: "SAPBASICS_LH", text: "1, SAP Fiori Basics Leaning Hub" },
                    { key: "SAPUI5_LH", text: "2, SAPUI5 Learning Hub" },
                    { key: "SAPUI5A_LH", text: "3, SAPUI5 Advanced Learning Hub" },
                    { key: "SAPFE_LH", text: "4, SAP Fiori Elements Leaning Hub" },
                    { key: "SAPV4S_LH", text: "5, SAP Fiori Elements V4 Service Leaning Hub" },
                    { key: "SAPF_LH", text: "6, Fiori Learning Hub" },
                    // Dumps
                    { key: "DUMP1", text: "Dump, P2P" },
                    { key: "DUMP2", text: "Dump, Certshero" },
                    { key: "DUMP3", text: "Dump, XY" },
                    { key: "DUMP_COLL", text: "Dump, Collection" }
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);