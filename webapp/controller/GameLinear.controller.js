sap.ui.define([
    "learninggame/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Panel"
], function(BaseController, JSONModel, MessageToast, VBox, HBox, CheckBox, Text, Button, Panel) {
    "use strict";

    return BaseController.extend("learninggame.controller.GameLinear", {

        onInit: function() {
            this.oGameSettings = this.getOwnerComponent().getModel("GameSettings");

            if (!this.oGameSettings.getProperty("/settingsAreSet")) {
                this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                return;
            }

            if (!this.oGameSettings.getProperty("/correctAnswersCount")) {
                this.oGameSettings.setProperty("/correctAnswersCount", 0);
            }

            this._prepareQuiz()
                .then(() => this._createLinearSteps())
                .catch(err => console.error("Fehler beim Quiz vorbereiten:", err));
        },

        _prepareQuiz: function() {
            return new Promise((resolve, reject) => {
                const oQuizModel = new JSONModel();
                oQuizModel.loadData("/model/FioriQuestions.json");

                oQuizModel.attachRequestCompleted(() => {
                    const oData = oQuizModel.getData();
                    if (!oData || !oData.results) return reject("Keine Fragen im JSON");

                    let aAllQuestions = oData.results;
                    const nQuestions = this.oGameSettings.getProperty("/numberOfQuestions") || 3;
                    const selectedTopics = this.oGameSettings.getProperty("/selectedTopics") || [];

                    // Nach Themen filtern
                    if (selectedTopics.length > 0) {
                        aAllQuestions = aAllQuestions.filter(q => selectedTopics.includes(q.QuestionTopicArea));
                    }

                    // Fragen zufällig mischen
                    aAllQuestions = aAllQuestions.sort(() => 0.5 - Math.random());

                    // N Fragen auswählen
                    const aRandomQuestions = aAllQuestions.slice(0, nQuestions);

                    // Antworten zufällig sortieren
                    const aQuizQuestions = aRandomQuestions.map(q => ({
                        QuestionID: q.QuestionID,
                        QuestionText: q.QuestionText,
                        AmountOfTrueAnswers: q.AmountOfTrueAnswers,
                        Answers: ["A","B","C","D","E","F"]
                            .map(key => ({
                                key,
                                text: q["Answer"+key],
                                correct: q["Answer"+key+"_boolean"],
                                selected: false
                            }))
                            .filter(a => a.text)
                            .sort(() => 0.5 - Math.random())
                    }));

                    const oModel = new JSONModel({ questions: aQuizQuestions });
                    this.getView().setModel(oModel, "quiz");

                    resolve();
                });

                oQuizModel.attachRequestFailed(err => reject(err));
            });
        },

        _createLinearSteps: function() {
    const oContainer = this.byId("quizContainerVBox");
    if (!oContainer) {
        console.error("Container Control nicht gefunden!");
        return;
    }

    const aQuestions = this.getView().getModel("quiz").getProperty("/questions");
    this._questionControls = [];

    aQuestions.forEach((q, index) => {
        // Fragetext
        const oQuestionText = new Text({ text: q.QuestionText, wrapping: true });
        oQuestionText.addStyleClass("sapUiMediumMarginBottom");

        // VBox für Fragetext + Anzahl korrekter Antworten
        const oVBoxQuestionInfo = new VBox({ width: "100%" });
        oVBoxQuestionInfo.addItem(oQuestionText);
        oVBoxQuestionInfo.addItem(new Text({
            text: `Anzahl korrekter Antworten: ${q.AmountOfTrueAnswers}`,
            wrapping: true,
            class: "sapUiSmallMarginTop sapUiEmphasizedText"
        }));

        // VBox für Nutzerantworten (Checkboxen)
        const oVBoxUser = new VBox({ width: "100%" });
        oVBoxUser.addStyleClass("sapUiMediumMarginBottom sapUiMediumMarginBeginEnd");

        const aAnswerControls = q.Answers.map(ans => {
            const cb = new CheckBox({ text: ans.text, selected: ans.selected, enabled: true });
            cb.addStyleClass("sapUiTinyMarginBottom");
            return cb;
        });
        aAnswerControls.forEach(cb => oVBoxUser.addItem(cb));

        // Bestätigen Button
        const oBtnConfirm = new Button({
            text: "Bestätigen",
            type: "Emphasized",
            press: () => this.onCheckAnswerLinear(q, aAnswerControls, oPanel, index)
        });
        oBtnConfirm.addStyleClass("sapUiSmallMarginBottom sapUiMediumMarginBegin");

        // VBox für Lösungsvorschau
        const oVBoxSolution = new VBox();
        oVBoxSolution.setVisible(false);
        oVBoxSolution.addStyleClass("sapUiSmallMarginTop sapUiMediumMarginBeginEnd");

        // Panel für die Frage
        const oPanel = new Panel({
            headerText: `Frage ${index + 1}`,
            expandable: false,
            width: "100%",
            content: [
                oVBoxQuestionInfo, // Fragetext + Info untereinander
                oVBoxUser,
                new HBox({ items: [oBtnConfirm] }),
                oVBoxSolution
            ],
            visible: index === 0
        });
        oPanel.addStyleClass("sapUiLargeMarginBottom customCardPanel");
        oPanel._oVBoxSolutionBelow = oVBoxSolution;

        oContainer.addItem(oPanel);
        this._questionControls.push(oPanel);
    });
}

,

onCheckAnswerLinear: function(oQuestion, aAnswerControls, oStepPanel, currentIndex) {
    let nCorrectThisQuestion = 0;

    // Nutzer-Antworten auswerten und einfärben
    oQuestion.Answers.forEach((ans, i) => {
        const oCheckBox = aAnswerControls[i];
        ans.selected = oCheckBox.getSelected();
        oCheckBox.setEnabled(false);

        // Farbliche Markierung:
        // Grün = Nutzer hat es richtig gemacht (ankreuzen oder nicht ankreuzen)
        // Rot = Nutzer hat es falsch gemacht
        if ((ans.selected && ans.correct) || (!ans.selected && !ans.correct)) {
            oCheckBox.addStyleClass("sapUiTextSuccess"); // grün
        } else {
            oCheckBox.addStyleClass("sapUiTextError");   // rot
        }

        // Zähler für komplett richtige Antworten
        if (ans.selected === ans.correct && ans.correct) {
            nCorrectThisQuestion++;
        }
    });

    // Lösungsvorschau unter der Frage (optional)
    const oVBoxSolution = oStepPanel._oVBoxSolutionBelow;
    oVBoxSolution.removeAllItems();
    oVBoxSolution.addItem(new Text({ text: "Richtige Antworten:" }));

    oQuestion.Answers.forEach(ans => {
        const oSolutionCheckBox = new CheckBox({
            text: ans.text,
            selected: ans.correct,
            enabled: false
        });

        // Gleiche Logik für die Lösungsvorschau
        if ((ans.selected && ans.correct) || (!ans.selected && !ans.correct)) {
            oSolutionCheckBox.addStyleClass("solutionCorrect");
        } else {
            oSolutionCheckBox.addStyleClass("solutionWrong");
        }

        oVBoxSolution.addItem(oSolutionCheckBox);
    });
    oVBoxSolution.setVisible(true);

    // Gesamtanzahl der korrekten Antworten aktualisieren
    if (nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers) {
        const nTotalCorrect = this.oGameSettings.getProperty("/correctAnswersCount") + 1;
        this.oGameSettings.setProperty("/correctAnswersCount", nTotalCorrect);
    }

    // Bestätigen Button deaktivieren
    oStepPanel.getContent().forEach(item => {
        if (item instanceof HBox) item.getItems().forEach(btn => btn.setEnabled(false));
    });

    // Nächste Frage sichtbar machen
    const nextStep = this._questionControls[currentIndex + 1];
    if (nextStep) {
        nextStep.setVisible(true);
    } else {
        // Letzte Frage beantwortet → Messenger-Toast
        const nCorrect = this.oGameSettings.getProperty("/correctAnswersCount");
        const nTotal = this._questionControls.length;
        MessageToast.show(`Du hast ${nCorrect} von ${nTotal} richtig beantwortet!`);
    }
}



    });
});
