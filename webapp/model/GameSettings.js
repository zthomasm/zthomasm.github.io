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
                    { key: "SAPBASICS_LH", text: "1, SAP Fiori Basics Leaning Hub" },                       // done
                    { key: "SAPUI5_LH", text: "2, SAPUI5 Learning Hub" },                                   // done    
                    { key: "SAPUI5A_LH", text: "3, SAPUI5 Advanced Learning Hub" },                         // done
                    { key: "SAPFECAPV4_LH", text: "4, SAP Fiori Elements Learning Hub" },                   // done
                    { key: "SAPFEV4RAP_LH", text: "5, SAP Fiori Elements V4 RAP Service Learning Hub" },    // done
                    { key: "SAPF_LH", text: "6, Fiori Learning Hub" },                                      // done
                    // Dumps
                    { key: "DUMP1", text: "Dump, P2P" },
                    { key: "DUMP2", text: "Dump, Certshero" },
                    { key: "DUMP3", text: "Dump, XY" },
                    { key: "DUMP_COLL", text: "Dump, Collection" },
                    // AI
                    { key: "DUMP_AI", text: "Questions from AI based on Dumps" }
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);