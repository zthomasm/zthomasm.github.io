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
        const stepTitle = `Frage ${index + 1}`;

        const oStep = new WizardStep({
            title: stepTitle,
            id: "step" + q.QuestionID,
            visible: index === 0 // nur erste Frage sichtbar
        });

        // Frage Text
        const oQuestionText = new Text({ text: q.QuestionText, wrapping: true });
        oStep.addContent(oQuestionText);

        // VBox für Benutzer-Checkboxen
        const oVBoxUser = new VBox({ class: "sapUiSmallMarginTop" });
        const aAnswerControls = q.Answers.map(ans => new CheckBox({
            text: ans.text,
            selected: ans.selected,
            enabled: true
        }));
        aAnswerControls.forEach(cb => oVBoxUser.addItem(cb));
        oStep.addContent(oVBoxUser);

        // Bestätigen Button
        const oBtnConfirm = new Button({
            text: "Bestätigen",
            press: () => this.onCheckAnswerLinear(q, aAnswerControls, oBtnConfirm, oStep, index, aQuestions)
        });
        oStep.addContent(new HBox({ items: [oBtnConfirm], class: "sapUiSmallMarginTop" }));

        // VBox für Richtige Antworten (erst nach Bestätigung sichtbar)
        const oVBoxSolutionBelow = new VBox({ class: "sapUiSmallMarginTop" });
        oVBoxSolutionBelow.setVisible(false);
        oStep.addContent(oVBoxSolutionBelow);

        oStep._oVBoxSolutionBelow = oVBoxSolutionBelow;

        oWizard.addStep(oStep);
    });

    console.log("WizardSteps erfolgreich erstellt!");
}
,


onCheckAnswerLinear: function(oQuestion, aAnswerControls, oBtnConfirm, oStep, currentIndex, aQuestions) {
    let nCorrectThisQuestion = 0;

    // User-Auswahl auswerten
    oQuestion.Answers.forEach((ans, i) => {
        const oCheckBox = aAnswerControls[i];
        ans.selected = oCheckBox.getSelected();
        oCheckBox.setEnabled(false);

        if (ans.selected === ans.correct) {
            oCheckBox.addStyleClass("sapUiTextSuccess");
        } else {
            oCheckBox.addStyleClass("sapUiTextError");
        }

        if (ans.correct && ans.selected) nCorrectThisQuestion++;
    });

    // Richtige Antworten untereinander anzeigen
    const oVBoxSolution = oStep._oVBoxSolutionBelow;
    oVBoxSolution.removeAllItems();
    oVBoxSolution.addItem(new Text({ text: "Richtige Antworten:" }));
    oQuestion.Answers.forEach(ans => {
        const oSolutionCheckBox = new CheckBox({
            text: ans.text,
            selected: ans.correct,
            enabled: false
        });
        if (ans.correct) oSolutionCheckBox.addStyleClass("solutionCorrect");
        else oSolutionCheckBox.addStyleClass("solutionWrong");
        oVBoxSolution.addItem(oSolutionCheckBox);
    });
    oVBoxSolution.setVisible(true);

    // Score hochzählen
    if (nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers) {
        const nTotalCorrect = this.oGameSettings.getProperty("/correctAnswersCount") + 1;
        this.oGameSettings.setProperty("/correctAnswersCount", nTotalCorrect);
    }

    // Bestätigen Button deaktivieren
    oBtnConfirm.setEnabled(false);

    // Nächsten Step sichtbar machen
    const oWizard = this.byId("quizWizard");
    const nextStep = aQuestions[currentIndex + 1];
    if (nextStep) {
        const oNextStepControl = oWizard.getSteps().find(s => s.getId() === "step" + nextStep.QuestionID);
        if (oNextStepControl) oNextStepControl.setVisible(true);
    }
}







    });
});
