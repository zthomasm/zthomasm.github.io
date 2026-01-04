sap.ui.define([
    "learninggame/controller/BaseController",
    "learninggame/utils/BeforeStartingGame"

], function (BaseController, BeforeStartingGame) {
    "use strict";

    return BaseController.extend("learninggame.controller.StartPage", {
        onInit() {
            this._oSettingsModel = this.getOwnerComponent().getModel("GameSettings");

        },

        onPressBeforeStartGame() {
            console.log("onPressBeforeStartGame");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "FIORI");

            const sModel = "GameSettings";
            const sMode = "gameMode"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartGameABAP() {
            console.log("onPressBeforeStartGameABAP");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "ABAP");

            const sModel = "GameSettingsABAP";
            const sMode = "gameMode"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartGameISTQBFV4() {
            console.log("onPressBeforeStartGameISTQBFV4");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "ISTQBFV4");

            const sModel = "GameSettingsISTQBFV4";
            const sMode = "gameMode"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartShowAllQuestions_FIORI() {
            console.log("onPressBeforeStartShowAllQuestions_FIORI");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "FIORI");

            const sModel = "GameSettings";
            const sMode = "showAllQuestions"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartShowAllQuestions_ABAP() {
            console.log("onPressBeforeStartShowAllQuestions_ABAP");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "ABAP");

            const sModel = "GameSettingsABAP";
            const sMode = "showAllQuestions"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartShowAllQuestions_ISTQBFV4() {
            console.log("onPressBeforeStartShowAllQuestions_ISTQBFV4");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "ISTQBFV4");

            const sModel = "GameSettingsISTQBFV4";
            const sMode = "showAllQuestions"; 
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },


        onPressAddQuestion() {
            this.getOwnerComponent().getRouter().navTo("RouteAddQuestion");
        }
    });
});