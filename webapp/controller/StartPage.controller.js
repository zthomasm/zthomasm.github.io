sap.ui.define([
    "learninggame/controller/BaseController",
    
    // Utils
    "learninggame/utils/BeforeStartingGame",
    "learninggame/utils/SnowHelper",


], function (BaseController, BeforeStartingGame, SnowHelper) {
    "use strict";

    return BaseController.extend("learninggame.controller.StartPage", {
        onInit() {
            this._oSettingsModel = this.getOwnerComponent().getModel("GameSettings");


            const bSnowEffect = true;
            const aWinterMonths = [12, 1, 2]; // Wintermonate 12, 01, 02

            if (bSnowEffect && SnowHelper.isWinterMonth(aWinterMonths)) {
                
                // Delegate für beforeHide/ beforeShow auf die View hängen
                this.getView().addEventDelegate({
                    onBeforeHide: function () {
                        SnowHelper.stopSnow(this);
                    }.bind(this),
                    onBeforeShow: function () {
                        // Falls du beim Zurücknavigieren wieder Schnee willst:
                        SnowHelper.startSnow(this);
                    }.bind(this)
                });
            }
                
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