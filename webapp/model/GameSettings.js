sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        bundleofAIModels: function() {
            return new JSONModel({
                // 
                selectedAI: "AI03",
                availableAI: [
                    { key: "AI01", text: "ChatGPT" },
                    { key: "AI02", text: "Gemini" },
                    { key: "AI03", text: "Perplexity" },
                    { key: "AI04", text: "Mistral" },
                ]
            })
        },

        createTopicModel: function() {
            return new JSONModel({
                activeTopic: "",
                topics: {
                    FIORI: {
                        key: "FIORI",
                        text: "Fiori",
                        bShowOnStartPage: true,
                        jsonPath: "/model/QuestionsFiori.json",
                    },
                    ABAP: {
                        key: "ABAP",
                        text: "ABAP",
                        bShowOnStartPage: true,
                        jsonPath: "/model/QuestionsABAP.json",
                    }
                }
            });
        },

        createSettingsForModels: function() {
            return new JSONModel({
                // 
                sMode: "",
                settingsAreSet: false,
                bTCA: true,                 // TellCorrectAnswerToAI
                numberOfQuestions: 15,
                singleTopic: "",
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
                    { key: "DUMP_COLL", text: "Dump, Collection" },
                    // AI
                    { key: "DUMP_AI", text: "Questions from AI based on Dumps" }
                    ],
                correctAnswersCount: 0

            });
        },
        
        
        createSettingsForModelsABAP: function() {
            return new JSONModel({
                // 
                sMode: "",
                settingsAreSet: false,
                bTCA: true,                 // TellCorrectAnswerToAI
                numberOfQuestions: 15,
                singleTopic: "",
                selectedTopics: [],
                availableTopics: [
                    // X
                    { key: "0010", text: "1, XXX" },  
                    { key: "0020", text: "2, XXX" },  
                    { key: "0030", text: "3, XXX" },  
                    ],
                correctAnswersCount: 0

            });
        }
    }
}










);