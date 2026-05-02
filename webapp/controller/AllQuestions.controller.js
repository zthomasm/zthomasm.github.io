sap.ui.define([
    "learninggame/controller/BaseController",
    "sap/ui/model/json/JSONModel",

    // Utils
    "learninggame/utils/QuestionHelper",
    "learninggame/utils/CleanupHelper",
], function (BaseController, JSONModel, QuestionHelper, CleanupHelper) {
    "use strict";

    return BaseController.extend("learninggame.controller.AllQuestions", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteAllQuestions").attachPatternMatched(this._onRouteMatched, this);

        },

        _onRouteMatched: function () {
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

            this.oTopicModel = oTopicModel;
            this.oGameSettings = this.getOwnerComponent().getModel(sGameSettingsModelName);

            if (!this.oGameSettings.getProperty("/selectedSingleTopic")) {
                this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                return;
            }

            if (!this.oGameSettings.getProperty("/settingsAreSet")) {
                this.getOwnerComponent().getRouter().navTo("RouteStartPage");
                return;
            }

            this._loadAllQuestions();

        },

        _loadAllQuestions: function () {
            const sSingleTopic = this.oGameSettings.getProperty("/selectedSingleTopic");
            console.log("Lade ALLE Fragen für Topic:", sSingleTopic);

            const oQuizModel = new JSONModel();
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            const sActiveTopic = oTopicModel.getProperty("/activeTopic");
            const sJsonPath = oTopicModel.getProperty(`/topics/${sActiveTopic}/jsonPath`);

            oQuizModel.loadData(sJsonPath);

            oQuizModel.attachRequestCompleted(() => {
                const oData = oQuizModel.getData();
                if (!oData || !oData.results) return;

                let aAllQuestions = oData.results;
                aAllQuestions = QuestionHelper.filterQuestionsByTopics(aAllQuestions, [sSingleTopic]);

                const aAllTopicQuestions = QuestionHelper.transformQuestionsToModel(aAllQuestions);

                const oModel = new JSONModel({ questions: aAllTopicQuestions });
                this.getView().setModel(oModel, "quiz");

                this._createAllQuestionsDisplay();
            });
        },

        _createAllQuestionsDisplay: function () {
            const oContainer = this.byId("allQuestionsContainerVBox");
            const aQuestions = this.getView().getModel("quiz").getProperty("/questions");

            aQuestions.forEach((q, index) => {
                // ← QuestionHelper.createQuestionPanel nutzen, ABER visible: true statt index === 0
                const oPanel = QuestionHelper.createQuestionPanel(q, index);
                oPanel.setVisible(true);  // ← ALLE SICHTBAR machen!

                // ← Press-Handler attached
                oPanel._oBtnConfirm.attachPress(() => this._onConfirmQuestion(q, oPanel));
                oPanel._oBtnAskGPT.attachPress(() => this._openHelpOfAI(q));

                oContainer.addItem(oPanel);
            });
        },

        _onConfirmQuestion: function (oQuestion, oPanel) {
            // ← QuestionHelper.evaluateAnswer nutzen
            // const nCorrectThisQuestion = QuestionHelper.evaluateAnswer(oQuestion, oPanel._aAnswerControls);
            const oEvalResult = QuestionHelper.evaluateAnswer(oQuestion, oPanel._aAnswerControls);

            // ← QuestionHelper.createSolutionDisplay nutzen
            const oVBoxSolution = oPanel._oVBoxSolutionBelow;
            QuestionHelper.createSolutionDisplay(oQuestion, oVBoxSolution);


            // AI Button
            const oAIModel = this.getOwnerComponent().getModel("AIModels");
            const sSelectedKey = oAIModel.getProperty("/selectedAI");
            const sAIName = oAIModel.getProperty("/availableAI").find(a => a.key === sSelectedKey)?.text || sSelectedKey;

            const oBtnAskAI = new sap.m.Button({
                text: `Panel kopieren und bei ${sAIName} nachfragen`,
                icon: "sap-icon://locate-me-2",
                type: "Transparent",
                press: () => this._openHelpOfAI(oQuestion)
            }).addStyleClass("sapUiSmallMarginTop");

            oVBoxSolution.addItem(oBtnAskAI);

            // Button deaktivieren
            oPanel._oBtnConfirm.setEnabled(false);

            if (oEvalResult.isFullyCorrect) {
                oPanel.addStyleClass("panelCorrect");
            } else {
                oPanel.addStyleClass("panelWrong");
            }


            // console.log(`Frage ${oQuestion.QuestionID}: ${nCorrectThisQuestion}/${oQuestion.AmountOfTrueAnswers} korrekt`);
            console.log(`Frage ${oQuestion.QuestionID}: ${oEvalResult.isFullyCorrect ? "✅ RICHTIG" : "❌ FALSCH"}`);
        },

        _openHelpOfAI: function (oQuestion) {
            // ← QuestionHelper.generatePrompt nutzen
            const bTCA = this.oGameSettings.getProperty("/bTCA");
            const currentAI = this.getOwnerComponent().getModel("AIModels").getProperty("/selectedAI");
            const prompt = QuestionHelper.generatePrompt(oQuestion, false);

            navigator.clipboard.writeText(prompt).then(() => {
                sap.m.MessageToast.show(`Prompt kopiert! Öffne ${currentAI}...`);
                // ← QuestionHelper.getAIUrl nutzen
                window.open(QuestionHelper.getAIUrl(currentAI), "_blank");
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteStartPage");
        },

        onAfterRendering: function () {
            const oScrollContainer = this.byId("allQuestionsContainer");
            if (oScrollContainer && oScrollContainer.getDomRef()) {
                this._scrollElement = oScrollContainer.getDomRef();
                this._scrollElement.addEventListener("scroll", this._onScroll.bind(this));
            }
        },

        _onScroll: function () {
            const oProgress = this.byId("scrollProgress");
            if (!this._scrollElement || !oProgress) return;

            const scrollTop = this._scrollElement.scrollTop;
            const scrollHeight = this._scrollElement.scrollHeight;
            const clientHeight = this._scrollElement.clientHeight;

            const progress = Math.min(scrollTop / (scrollHeight - clientHeight), 1);
            oProgress.setPercentValue(progress * 100);
        }




    });
});
