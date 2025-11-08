sap.ui.define([
  "learninggame/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function(BaseController, JSONModel, MessageToast) {
  "use strict";

  return BaseController.extend("learninggame.controller.GameWizard", {

    onInit: function() {
        console.log("OnInit GameWizard")
        this.oGameSettings = this.getOwnerComponent().getModel("GameSettings");


        const bIsSet = this.oGameSettings.getProperty("/settingsAreSet");
        if (!bIsSet) {
          this.getOwnerComponent().getRouter().navTo("RouteStartPage");
        };

        // Quiz-Daten vorbereiten
        this._prepareQuiz();

    },

    onShowSettings: function() {
      // this.oModel = this.getOwnerComponent().getModel("GameSettings");
      // console.log(this.oModel);
      // console.log(this.getOwnerComponent().getModel("GameSettings"))
    
    console.log("GameSettings:", this.oGameSettings.getData());
    const oData = this.oGameSettings.getProperty("/numberOfQuestions");
    console.log(oData);
    
    },

    onShowSettingsAfterChange: function() {

      // const oModel = this.getOwnerComponent().getModel("GameSettings");
      this.oGameSettings.setProperty("/numberOfQuestions", 3);
      const oDataNew = this.oGameSettings.getProperty("/numberOfQuestions");
      console.log(oDataNew);

    },

    _prepareQuiz: function() {
            const aAllQuestions = this._getQuestionsFromService(); // mock service call oder OData
            const nQuestions = this.oGameSettings.getProperty("/numberOfQuestions");
            const selectedTopics = this.oGameSettings.getProperty("/selectedTopics");

            // Pool nach Topic filtern
            const aPool = aAllQuestions.filter(q => selectedTopics.includes(q.QuestionTopicArea));

            // Zufällige Fragen auswählen
            const aRandomQuestions = this._getRandomItems(aPool, nQuestions);

            const aQuizQuestions = aRandomQuestions.map(q => ({
                QuestionID: q.QuestionID,
                QuestionText: q.QuestionText,
                AmountOfTrueAnswers: q.AmountOfTrueAnswers,
                feedbackShown: false,
                Answers: ["A","B","C","D","E","F"]
                    .map(key => ({
                        key,
                        text: q["Answer"+key],
                        correct: q["Answer"+key+"_boolean"],
                        selected: false,
                        feedback: ""
                    }))
                    .filter(a => a.text) // leere Antworten entfernen
                    .sort(() => Math.random() - 0.5)
            }));

            const oQuizModel = new JSONModel({ currentStep: 0, questions: aQuizQuestions });
            this.getView().setModel(oQuizModel, "quiz");
        },

        _getRandomItems: function(array, n) {
            const shuffled = array.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, n);
        },

        _getQuestionsFromService: function() {
            // Hier OData-Call oder Mock-Daten
            return [
                {
                    QuestionID: 1,
                    QuestionText: "Welche Programmiersprache wird hauptsächlich für SAPUI5/Fiori verwendet?",
                    AnswerA: "JavaScript", AnswerA_boolean: true,
                    AnswerB: "Python", AnswerB_boolean: false,
                    AnswerC: "Java", AnswerC_boolean: false,
                    AnswerD: "C++", AnswerD_boolean: false,
                    AnswerE: "", AnswerE_boolean: false,
                    AnswerF: "", AnswerF_boolean: false,
                    AmountOfTrueAnswers: 1,
                    QuestionTopicArea: "SAPUI5 Basics"
                },
                {
                    QuestionID: 2,
                    QuestionText: "Welche Dateien sind typisch in einem SAPUI5-Projekt enthalten?",
                    AnswerA: "Component.js", AnswerA_boolean: true,
                    AnswerB: "manifest.json", AnswerB_boolean: true,
                    AnswerC: "package-lock.json", AnswerC_boolean: false,
                    AnswerD: "styles.css", AnswerD_boolean: false,
                    AnswerE: "", AnswerE_boolean: false,
                    AnswerF: "", AnswerF_boolean: false,
                    AmountOfTrueAnswers: 2,
                    QuestionTopicArea: "Fiori Architecture"
                }
                // weitere Fragen …
            ];
        },

        onCheckAnswer: function(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("quiz");
            const aAnswers = oContext.getProperty("Answers");
            let nCorrectThisQuestion = 0;

            aAnswers.forEach(ans => {
                if (ans.selected === ans.correct) {
                    ans.feedback = "richtig";
                    if (ans.correct) nCorrectThisQuestion++;
                } else {
                    ans.feedback = "falsch";
                }
            });

            oContext.setProperty("Answers", aAnswers);
            oContext.setProperty("feedbackShown", true);

            // Score im GameSettings-Model hochzählen
            const nTotalCorrect = nCorrectThisQuestion === oContext.getProperty("AmountOfTrueAnswers") ?
                this.oGameSettings.getProperty("/correctAnswersCount") + 1 :
                this.oGameSettings.getProperty("/correctAnswersCount");

            this.oGameSettings.setProperty("/correctAnswersCount", nTotalCorrect);
        },

        onNextStep: function(oEvent) {
            const wizard = this.byId("wizard");
            wizard.nextStep();
        }
  
  
  });
});
