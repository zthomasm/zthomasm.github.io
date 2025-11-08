sap.ui.define([
    "learninggame/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/WizardStep",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/m/Button"
], function(BaseController, JSONModel, MessageToast, WizardStep, HBox, VBox, CheckBox, Text, Button) {
    "use strict";

    return BaseController.extend("learninggame.controller.GameWizard", {

        onInit: function() {
            console.log("GameWizard.onInit gestartet");

            this.oGameSettings = this.getOwnerComponent().getModel("GameSettings");

            if (!this.oGameSettings.getProperty("/settingsAreSet")) {
                console.warn("Settings nicht gesetzt – zurück zur StartPage");
                this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                return;
            }

            if (!this.oGameSettings.getProperty("/correctAnswersCount")) {
                this.oGameSettings.setProperty("/correctAnswersCount", 0);
            }

            this._prepareQuiz()
                .then(() => this._createWizardSteps())
                .catch(err => console.error("Fehler beim Quiz vorbereiten:", err));
        },

        onShowSettings: function() {
            console.log("GameSettings aktuell:", this.oGameSettings.getData());
        },

        onShowSettingsAfterChange: function() {
            this.oGameSettings.setProperty("/numberOfQuestions", 3);
            console.log("GameSettings nach Änderung:", this.oGameSettings.getData());
        },

        _prepareQuiz: function() {
            console.log("Starte Laden der Fragen aus JSON...");
            return new Promise((resolve, reject) => {
                const oQuizModel = new JSONModel();
                oQuizModel.loadData("/model/FioriQuestions.json");

                oQuizModel.attachRequestCompleted(() => {
                    console.log("FioriQuestions.json geladen:", oQuizModel.getData());
                    const oData = oQuizModel.getData();

                    if (!oData || !oData.results) {
                        console.error("Keine Fragen gefunden!");
                        reject("Keine Fragen im JSON");
                        return;
                    }

                    let aAllQuestions = oData.results;
                    const nQuestions = this.oGameSettings.getProperty("/numberOfQuestions") || 3;
                    const selectedTopics = this.oGameSettings.getProperty("/selectedTopics") || [];

                    console.log("Gefiltert nach Topics:", selectedTopics);

                    if (selectedTopics.length > 0) {
                        aAllQuestions = aAllQuestions.filter(q => selectedTopics.includes(q.QuestionTopicArea));
                    }

                    console.log("Gefilterte Fragen:", aAllQuestions);

                    const aRandomQuestions = this._getRandomItems(aAllQuestions, nQuestions);
                    console.log("Zufällige Auswahl:", aRandomQuestions);

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
                            .filter(a => a.text)
                            .sort(() => Math.random() - 0.5)
                    }));

                    console.log("Quiz Questions vorbereitet:", aQuizQuestions);
                    const oModel = new JSONModel({ currentStep: 0, questions: aQuizQuestions });
                    this.getView().setModel(oModel, "quiz");
                    console.log("QuizModel gesetzt!");
                    resolve();
                });

                oQuizModel.attachRequestFailed(err => {
                    console.error("Fehler beim Laden von FioriQuestions.json:", err);
                    reject(err);
                });
            });
        },

        _getRandomItems: function(array, n) {
            return array.sort(() => 0.5 - Math.random()).slice(0, n);
        },

        _createWizardSteps: function() {
            console.log("WizardSteps werden erstellt...");
            const oWizard = this.byId("quizWizard");
            if (!oWizard) {
                console.error("Wizard Control nicht gefunden!");
                return;
            }

            const aQuestions = this.getView().getModel("quiz").getProperty("/questions");
            console.log("Fragen für Wizard:", aQuestions);

            aQuestions.forEach((q, index) => {
                const stepTitle = ["Erste Frage", "Zweite Frage", "Dritte Frage"][index] || `Frage ${index+1}`;

                const oStep = new WizardStep({
                    title: stepTitle,
                    id: "step" + q.QuestionID
                });

                // Frage Text
                const oQuestionText = new Text({ text: q.QuestionText, wrapping: true });
                oStep.addContent(oQuestionText);

                // Hinweis: wie viele Antworten richtig sind
                const oInfo = new Text({ text: `Richtige Antworten: ${q.AmountOfTrueAnswers}`, wrapping: true, class: "sapUiSmallMarginTop" });
                oStep.addContent(oInfo);

                // Antworten
                const aAnswerControls = q.Answers.map(ans => new CheckBox({
                    text: ans.text,
                    selected: ans.selected,
                    enabled: true
                }));

                const oVBoxAnswers = new VBox({ items: aAnswerControls, class: "sapUiSmallMarginTop" });
                oStep.addContent(oVBoxAnswers);

                // Bestätigen Button
                const oBtnConfirm = new Button({
                    text: "Bestätigen",
                    press: () => this.onCheckAnswer(q, aAnswerControls, oBtnConfirm, oWizard)
                });
                oStep.addContent(new HBox({ items: [oBtnConfirm], class: "sapUiSmallMarginTop" }));

                oWizard.addStep(oStep);
            });

            console.log("WizardSteps erfolgreich erstellt!");
        },

        onCheckAnswer: function(oQuestion, aAnswerControls, oBtnConfirm, oWizard) {
            console.log("CheckAnswer für Frage:", oQuestion.QuestionID);

            let nCorrectThisQuestion = 0;

            oQuestion.Answers.forEach((ans, i) => {
                const oCheckBox = aAnswerControls[i];
                if (ans.selected === ans.correct) {
                    ans.feedback = "richtig";
                    oCheckBox.setEnabled(false);
                    nCorrectThisQuestion++;
                    oCheckBox.addStyleClass("sapUiTextSuccess");
                } else {
                    ans.feedback = "falsch";
                    oCheckBox.setEnabled(false);
                    oCheckBox.addStyleClass("sapUiTextError");
                }
            });

            oQuestion.feedbackShown = true;
            this.getView().getModel("quiz").refresh();

            // Score hochzählen
            const nTotalCorrect = nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers ?
                this.oGameSettings.getProperty("/correctAnswersCount") + 1 :
                this.oGameSettings.getProperty("/correctAnswersCount");

            this.oGameSettings.setProperty("/correctAnswersCount", nTotalCorrect);
            console.log("Aktueller Score:", nTotalCorrect);

            // Button deaktivieren
            oBtnConfirm.setEnabled(false);

            // Automatisch zum nächsten Step
            oWizard.nextStep();
        }


    });
});
