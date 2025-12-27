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
        
        onBeforeRendering: function() {

        },

        _sanitizeText: function(text) {
            if (!text) return "";
            return text
                .replace(/\$/g, "S|")           // $ → S
                .replace(/@/g, "(at)")          // @ → at
                .replace(/#/g, "(HASHTAG)")     // # → -
                .replace(/\{/g, "((")           // { → (
                .replace(/\}/g, "))")           // } → )
                .replace(/\*/g, "•");           // * → •
        },

        _prepareQuiz: function() {
            return new Promise((resolve, reject) => {
                console.log("_prepareQuiz STARTED");
                console.log("GameSettings Data:", this.oGameSettings.getData());
                const oQuizModel = new JSONModel();

                oQuizModel.loadData("/model/QuestionsFiori.json"); // #zchange, muss generisch werden

                oQuizModel.attachRequestCompleted(() => {
                    console.log("QuestionsFiori.json LOADED");
                    const oData = oQuizModel.getData();
                    if (!oData || !oData.results) return reject("Keine Fragen vorhanden");

                    let aAllQuestions = oData.results;
                    const nQuestions = this.oGameSettings.getProperty("/numberOfQuestions") || 3;
                    const selectedTopics = this.oGameSettings.getProperty("/selectedTopics") || [];

                    // console.log("Filter Start:", { 
                    //     totalQuestions: aAllQuestions.length, 
                    //     nQuestions, 
                    //     selectedTopics 
                    // });

                    // Nach Themen filtern
                    if (selectedTopics.length > 0) {
                        aAllQuestions = aAllQuestions.filter(q => selectedTopics.includes(q.QuestionTopicArea));
                        console.log(`${aAllQuestions.length} Fragen nach Filter`);
                    }

                    const available = aAllQuestions.length;
                    if (available < nQuestions) {
                    console.warn(`Nur ${available}/${nQuestions} Fragen verfügbar!`);
                    MessageToast.show(`Nur ${available}/${nQuestions} Fragen für "${selectedTopics}" verfügbar!`);
                    }

                    // Fragen mischen
                    for (let i = aAllQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [aAllQuestions[i], aAllQuestions[j]] = [aAllQuestions[j], aAllQuestions[i]];
                    }

                    // N Fragen auswählen
                    const aRandomQuestions = aAllQuestions.slice(0, nQuestions);
                    console.log("Nach Shuffle & Slice:", aRandomQuestions.map(q => q.QuestionID));
                    console.log("First Question before mapping:", JSON.stringify(aRandomQuestions[0], null, 2));

                    // Antworten zufällig sortieren
                    const aQuizQuestions = aRandomQuestions.map(q => ({
                        QuestionID: q.QuestionID,
                        QuestionText: this._sanitizeText(q.QuestionText),
                        AmountOfTrueAnswers: q.AmountOfTrueAnswers,
                        QuestionTopicArea: q.QuestionTopicArea,
                        Answers: ["A","B","C","D","E","F"]
                            .map(key => ({
                                key,
                                text: this._sanitizeText(q["Answer"+key]),
                                correct: q["Answer"+key+"_boolean"],
                                selected: false
                            }))
                            .filter(a => a.text)
                            .sort(() => 0.5 - Math.random())
                    }));

                    const oModel = new JSONModel({ questions: aQuizQuestions });
                    console.log("Quiz Questions IDs:", aQuizQuestions.map(q => q.QuestionID));
                    console.log("Model vor setModel:", {
                    questions: aQuizQuestions.length,
                    firstQuestion: aQuizQuestions[0],
                    dataStructure: JSON.stringify(aQuizQuestions[0], null, 2)
                    });

                    console.log("Try-Catch START");
                    try {
                        this.getView().setModel(oModel, "quiz");
                        console.log("✅ setModel SUCCESSFUL");
                    } catch(e) {
                        console.error("❌ setModel FAILED:", e.message, e);
                        reject(e);
                        return;
                    }
                    
                    console.log("About to resolve()");
                    resolve();
                    console.log("After resolve() call");
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
                // Zusatz---
                // ← NEUER CODE: Info-Button Box (ID + TopicArea)
                const oInfoBox = new HBox({
                    alignItems: "Center",
                    justifyContent: "End",  // ← Ganz rechts!
                    width: "100%",
                });

                const oBtnID = new Button({
                    text: `ID: ${q.QuestionID}`,
                    enabled: false,
                    type: "Default"
                });
                oBtnID.addStyleClass("sapUiTinyMarginEnd");

                const oBtnTopic = new Button({
                    text: `${q.QuestionTopicArea}`,  // ← Aktuell das KÜRZEL
                    enabled: false,
                    type: "Default"
                });

                oInfoBox.addItem(oBtnID);
                oInfoBox.addItem(oBtnTopic);
                // Zusatz Ende---


                // Fragetext
                const oQuestionText = new Text({ text: q.QuestionText, wrapping: true });
                oQuestionText.addStyleClass("sapUiMediumMarginBottom");

                // VBox für Fragetext + Anzahl korrekter Antworten
                const oVBoxQuestionInfo = new VBox({ width: "100%" });
                oVBoxQuestionInfo.addItem(oQuestionText);
                const oTextAnswers = new Text({
                    text: `Anzahl korrekter Antworten: ${q.AmountOfTrueAnswers}`,
                    wrapping: true
                });
                oTextAnswers.addStyleClass("sapUiSmallMarginTop sapUiEmphasizedText");
                oVBoxQuestionInfo.addItem(oTextAnswers);

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

                const oBtnAskGPT = new Button({
                    text: "Bei Perplexity nachfragen",
                    icon: "sap-icon://message-information",
                    press: () => this._openHelpOfAI(q)
                });
                oBtnAskGPT.addStyleClass("sapUiSmallMarginBottom sapUiMediumMarginBegin");

                // VBox für Lösungsvorschau
                const oVBoxSolution = new VBox();
                oVBoxSolution.setVisible(false);
                oVBoxSolution.addStyleClass("sapUiSmallMarginTop sapUiMediumMarginBeginEnd");

                // Neue Panel
                const oPanel = new Panel({
                    headerText: `Frage ${index + 1}`,
                    expandable: false,
                    width: "100%",
                    content: [
                        oVBoxQuestionInfo,
                        oVBoxUser,
                        new HBox({ items: [oBtnConfirm] }),
                        oInfoBox,
                        oVBoxSolution
                    ],
                    visible: index === 0
                });


                oPanel.addStyleClass("sapUiLargeMarginBottom customCardPanel");
                oPanel._oVBoxSolutionBelow = oVBoxSolution;

                oContainer.addItem(oPanel);
                this._questionControls.push(oPanel);
            });
        },

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

            // Lösungsvorschau unter der Frage
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

            // --- AI Button unter der Lösung einfügen ---
            const currentAI = this.getOwnerComponent().getModel("AIModels").getProperty("/selectedAI");
            const currentAIName = this.getOwnerComponent().getModel("AIModels").getProperty("/availableAI").find(item => item.key === this.getOwnerComponent().getModel("AIModels").getProperty("/selectedAI")).text;
            const oBtnAskGPT = new sap.m.Button({
                text: `Panel kopieren und bei ${currentAIName} nachfragen`,
                icon: "sap-icon://locate-me-2",
                type: "Transparent",
                press: () => this._openHelpOfAI(oQuestion)
            });
            oBtnAskGPT.addStyleClass("sapUiSmallMarginTop");

            oVBoxSolution.addItem(oBtnAskGPT);

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

            if (nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers) {
                oStepPanel.addStyleClass("panelCorrect");
            } else {
                oStepPanel.addStyleClass("panelWrong");
            }

            oStepPanel.data("question", oQuestion);
            this._updateFooterProgress();
        },

        _openHelpOfAI: function(oQuestion) {
            // Prompt generieren
            let prompt = "Bitte erkläre mir folgende Prüfungsfrage:\n\n";
            prompt += "Frage:\n" + oQuestion.QuestionText + "\n\n";
            prompt += "Es gibt anscheinend " + oQuestion.AmountOfTrueAnswers + " richtige Antwort(en).\n\n";

            prompt += "Antwortmöglichkeiten:\n";

            const oGameSettings = this.getOwnerComponent().getModel("GameSettings");
            const bTCA = oGameSettings.getProperty("/bTCA");

            if (bTCA) { 
                oQuestion.Answers.forEach(a => {
                    prompt += `- ${a.text} (${a.correct ? "RICHTIG" : "FALSCH"})\n`;
                });
            } else {
                oQuestion.Answers.forEach(a => {
                    prompt += `- ${a.text} \n`;
                });
            }

            prompt += "\nBitte erkläre mir ausführlich, warum die Antworten so sind. Also warum sie richtig oder falsch sind. Versuche ggf. am Ende ein Anwendungsbeispiel anzuhängen. Antworte unvoreingenommen.";

            // Kopieren + Perplexity  öffnen
            const currentAI = this.getOwnerComponent().getModel("AIModels").getProperty("/selectedAI");
            navigator.clipboard.writeText(prompt).then(() => {
                sap.m.MessageToast.show(`Prompt kopiert! Öffne ${currentAI}...`);
                window.open(this._getAIUrl(currentAI), "_blank");
            });
        },

        _getAIUrl: function(aiKey) {
            const URLCollection = {
                "AI01": "https://chat.openai.com",  // ChatGPT
                "AI02": "https://gemini.google.com", // Gemini  
                "AI03": "https://www.perplexity.ai", // Perplexity
                "AI04": "https://chat.mistral.ai"    // Mistral
            };
            return URLCollection[aiKey];
        },

        _updateFooterProgress: function() {
            const oFooter = this.byId("footerProgress");
            if (!oFooter) return;

            oFooter.removeAllItems();

            this._questionControls.forEach(panel => {
                let dotClass = "footerProgressDot";

                const solutionVisible = panel._oVBoxSolutionBelow.getVisible();
                if (solutionVisible) {
                    // Prüfen ob die Frage richtig war
                    let nCorrect = 0;
                    const oQuestion = panel.data("question"); // optional setzen bei _createLinearSteps
                    oQuestion.Answers.forEach(a => { if (a.selected === a.correct && a.correct) nCorrect++; });

                    if (nCorrect === oQuestion.AmountOfTrueAnswers) dotClass += " correct";
                    else dotClass += " wrong";
                }

                const dot = new sap.m.Text({ text: "●" }); // Unicode Punkt
                dot.addStyleClass(dotClass);
                oFooter.addItem(dot);
            });

            // --- Prozentanzeige rechts im Footer ergänzen ---
            const nTotal = this._questionControls ? this._questionControls.length : 0;
            const nCorrectTotal = this.oGameSettings.getProperty("/correctAnswersCount") || 0;

            let sText = "";
            if (nTotal > 0) {
                const percent = Math.round((nCorrectTotal / nTotal) * 100);
                sText = nCorrectTotal + " / " + nTotal + " (" + percent + "%)";
            } else {
                sText = "0 / 0 (0%)";
            }

            // Spacer + Text ans Toolbar-Ende setzen
            const oSpacer = new sap.m.ToolbarSpacer();
            const oPercentText = new sap.m.Text({ text: sText });
            oPercentText.addStyleClass("footerProgressPercent");

            oFooter.addItem(oSpacer);
            oFooter.addItem(oPercentText);

        }





    });
});
