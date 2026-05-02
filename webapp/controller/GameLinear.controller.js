sap.ui.define([
    "learninggame/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/CheckBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Panel",

    // Utils
    "learninggame/utils/QuestionHelper",
    "learninggame/utils/CleanupHelper",
    "learninggame/utils/Timer",

], function (BaseController, JSONModel, MessageToast, VBox, HBox, CheckBox, Text, Button, Panel, QuestionHelper, CleanupHelper, Timer) {
    "use strict";

    return BaseController.extend("learninggame.controller.GameLinear", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteGameLinear").attachPatternMatched(this._onRouteMatched, this);
            // oRouter.getRoute("RouteGameLinear").attachPatternMatched(this._cleanupAndInit, this);
        },

        _onRouteMatched: function () {
            // ← JEDESMAL wenn Route matched!
            CleanupHelper.cleanupGameView(this);


            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            const sActiveTopic = oTopicModel.getProperty("/activeTopic");

            let sGameSettingsModelName;
            switch (sActiveTopic) {
                case "FIORI":
                    sGameSettingsModelName = "GameSettingsFIORI";
                    break;
                case "ABAP":
                    sGameSettingsModelName = "GameSettingsABAP";
                    break;
                case "ISTQBFV4":
                    sGameSettingsModelName = "GameSettingsISTQBFV4";
                    break;
                default:
                    console.error("Unbekanntes Topic:", sActiveTopic);
                    this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                    return;
            }

            this.oGameSettings = this.getOwnerComponent().getModel(sGameSettingsModelName);
            this.oTopicModel = oTopicModel;

            // this.oGameSettings = this.getOwnerComponent().getModel("GameSettings");

            if (!this.oGameSettings.getProperty("/settingsAreSet")) {
                this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                return;
            }

            this.oGameSettings.setProperty("/correctAnswersCount", 0);

            this._prepareQuiz()
                .then(() => this._createLinearSteps())
                .catch(err => console.error("Fehler beim Quiz vorbereiten:", err));
        },

        onBeforeRendering: function () {

        },

        _prepareQuiz: function () {
            return new Promise((resolve, reject) => {
                console.log("_prepareQuiz STARTED");
                console.log("GameSettings Data:", this.oGameSettings.getData());
                const oQuizModel = new JSONModel();

                const sActiveTopic = this.oTopicModel.getProperty("/activeTopic");
                const sJsonPath = this.oTopicModel.getProperty(`/topics/${sActiveTopic}/jsonPath`);

                console.log("Loading from:", sJsonPath);
                oQuizModel.loadData(sJsonPath);

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
                    aAllQuestions = QuestionHelper.filterQuestionsByTopics(aAllQuestions, selectedTopics);

                    const available = aAllQuestions.length;
                    if (available < nQuestions) {
                        console.warn(`Nur ${available}/${nQuestions} Fragen verfügbar!`);
                        MessageToast.show(`Nur ${available}/${nQuestions} Fragen für "${selectedTopics}" verfügbar!`);
                    }

                    // Fragen mischen
                    aAllQuestions = QuestionHelper.shuffleQuestions(aAllQuestions);

                    // N Fragen auswählen
                    const aRandomQuestions = aAllQuestions.slice(0, nQuestions);
                    console.log("Nach Shuffle & Slice:", aRandomQuestions.map(q => q.QuestionID));
                    console.log("First Question before mapping:", JSON.stringify(aRandomQuestions[0], null, 2));

                    // Antworten zufällig sortieren
                    const aQuizQuestions = QuestionHelper.transformQuestionsToModel(aRandomQuestions);


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
                    } catch (e) {
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

        _createLinearSteps: function () {
            const oContainer = this.byId("quizContainerVBox");
            if (!oContainer) {
                console.error("Container Control nicht gefunden!");
                return;
            }

            const aQuestions = this.getView().getModel("quiz").getProperty("/questions");
            this._questionControls = [];

            const bHintEnabled = this.oGameSettings.getProperty("/bHintEnabled");

            aQuestions.forEach((q, index) => {

                // Helper
                const oPanel = QuestionHelper.createQuestionPanel(q, index, bHintEnabled);

                oPanel._oBtnConfirm.attachPress(() => this.onCheckAnswerLinear(q, oPanel._aAnswerControls, oPanel, index));
                oPanel._oBtnAskGPT.attachPress(() => this._openHelpOfAI(q));

                oContainer.addItem(oPanel);
                this._questionControls.push(oPanel);
            });

            this._updateFooterProgress();

            // Timer starten
            const oTimerModel = this.getOwnerComponent().getModel("Timer");
            if (oTimerModel.getProperty("/bTimerActivated")) {
                const iTotalSeconds = oTimerModel.getProperty("/iValueInSeconds") * aQuestions.length;
                Timer.startTimer(oTimerModel, iTotalSeconds);
            }
        },

        onCheckAnswerLinear: function (oQuestion, aAnswerControls, oStepPanel, currentIndex) {

            // const nCorrectThisQuestion = QuestionHelper.evaluateAnswer(oQuestion, aAnswerControls);
            const oEvalResult = QuestionHelper.evaluateAnswer(oQuestion, aAnswerControls);


            // Lösungsvorschau unter der Frage
            const oVBoxSolution = oStepPanel._oVBoxSolutionBelow;
            QuestionHelper.createSolutionDisplay(oQuestion, oVBoxSolution);


            // --- AI Button unter der Lösung einfügen ---
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
            // if (nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers) {
            //     const nTotalCorrect = this.oGameSettings.getProperty("/correctAnswersCount") + 1;
            //     this.oGameSettings.setProperty("/correctAnswersCount", nTotalCorrect);
            // }

            if (oEvalResult.isFullyCorrect) {
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

            // if (nCorrectThisQuestion === oQuestion.AmountOfTrueAnswers) {
            //     oStepPanel.addStyleClass("panelCorrect");
            // } else {
            //     oStepPanel.addStyleClass("panelWrong");
            // }

            if (oEvalResult.isFullyCorrect) {
                oStepPanel.addStyleClass("panelCorrect");
                // QuestionHelper.showPlusOneAnimation();
            } else {
                oStepPanel.addStyleClass("panelWrong");
            }

            oStepPanel.data("question", oQuestion);
            this._updateFooterProgress();
        },

        _openHelpOfAI: function (oQuestion) {

            // const oGameSettings = this.getOwnerComponent().getModel("GameSettings");
            // const sActiveTopic = this.oTopicModel.getProperty("/activeTopic");
            // const sGameSettingsModelName = sActiveTopic === "FIORI" ? "GameSettings" : "GameSettingsABAP";
            // const oGameSettings = this.getOwnerComponent().getModel(sGameSettingsModelName);


            const bTCA = this.oGameSettings.getProperty("/bTCA");
            const currentAI = this.getOwnerComponent().getModel("AIModels").getProperty("/selectedAI");
            const prompt = QuestionHelper.generatePrompt(oQuestion, bTCA);

            navigator.clipboard.writeText(prompt).then(() => {
                sap.m.MessageToast.show(`Prompt kopiert! Öffne ${currentAI}...`);
                window.open(QuestionHelper.getAIUrl(currentAI), "_blank");
            });


        },

        _updateFooterProgress: function () {
            const oFooter = this.byId("footerProgress");
            const oText = this.byId("footerPercentText");
            if (!oFooter) return;

            QuestionHelper.updateFooterProgress(oFooter, this._questionControls, this.oGameSettings, oText);

        },

        onNavBack: function () {
            if (this.oGameSettings) {
                CleanupHelper.resetSettings(this.oGameSettings);
            }
            this.getOwnerComponent().getRouter().navTo("RouteStartPage");
        },

        onShowTimerPopover: function (oEvent) {
            const oButton = oEvent.getSource();
            const oGameLinearController = this;

            if (!this._oTimerPopover) {
                sap.ui.require(["sap/ui/core/Fragment"], (Fragment) => {
                    const oView = this.getView();
                    this._oTimerPopover = Fragment.load({
                        id: oView.getId(),
                        name: "learninggame.fragment.TimerPopover",
                        controller: {
                            onPauseTimer: () => {
                                const oTimerModel = this.getOwnerComponent().getModel("Timer");
                                Timer.pauseTimer(oTimerModel);
                            },

                            onResumeTimer: () => {
                                const oTimerModel = this.getOwnerComponent().getModel("Timer");
                                Timer.resumeTimer(oTimerModel);
                            },

                            onClosePopover: () => {
                                oGameLinearController._oTimerPopover.close();
                            }
                        }
                    }).then((oPopover) => {
                        oView.addDependent(oPopover);
                        oGameLinearController._oTimerPopover = oPopover;
                        oPopover.openBy(oButton);
                    });
                });
            } else {
                this._oTimerPopover.openBy(oButton);
            }
        },





    });
});
