sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        basicSettings: function() {
            return new JSONModel({
                // 
                bLaunchpad: false,
                sUser: "",
                sDevice: "",

            })
        },

        optionalfunctionTimer: function() {
            return new JSONModel({
                // 
                bAllowTimer: true,
                bTimerActivated: false,
                sValueOfTimer: "00:00:00",
                iValueInSeconds: 0,

            })
        },

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
                        bShowOnStartPage: false,
                        jsonPath: "/model/QuestionsFiori.json",
                    },
                    ABAP: {
                        key: "ABAP",
                        text: "ABAP",
                        bShowOnStartPage: false,
                        jsonPath: "/model/QuestionsABAP.json",
                    },
                    ISTQBFV4: {
                        key: "ISTQBFV4",
                        text: "ISTQB Foundation V4.0",
                        bShowOnStartPage: true,
                        jsonPath: "/model/QuestionsISTQBFV4.json",
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
                numberOfQuestions: 10,
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
                numberOfQuestions: 10,
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
        },

        createSettingsForModelsISTQBFV4: function() {
            return new JSONModel({
                // 
                sMode: "",
                settingsAreSet: false,
                bTCA: true,                 // TellCorrectAnswerToAI
                numberOfQuestions: 10,
                singleTopic: "",
                selectedTopics: [],
                availableTopics: [
                    // X
                    { key: "CTFL40_SET_A_v2_2_de", text: "ISTQB CTFL40 SET A v2.2 (Deutsch)" },         // ab ID 1101   // done
                    { key: "CTFL40_SET_B_v1_3_3_de", text: "ISTQB CTFL40 SET B v1.3.3 (Deutsch)" },     // ab ID 1201   // done
                    { key: "CTFL40_SET_C_v2_3_0_de", text: "ISTQB CTFL40 SET C v2.3.0 (Deutsch)" },     // ab ID 1301   // done
                    { key: "CTFL40_SET_D_v1_5_0_de", text: "ISTQB CTFL40 SET D v1.5.0 (Deutsch)" },     // ab ID 1401   // done
                    { key: "CTFL40_SET_E_v1_3_de", text: "ISTQB CTFL40 SET E v1.3 (Deutsch)" },         // ab ID 1501   // done
                    { key: "CTFL_SET_F_v1_2_de", text: "ISTQB CTFL SET F v1.2 (Deutsch)" },             // ab ID 1601
                    ],
                correctAnswersCount: 0

            });
        }


    }
}










);