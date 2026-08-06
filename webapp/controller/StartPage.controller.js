sap.ui.define([
    "learninggame/controller/BaseController",

    // Utils
    "learninggame/utils/BeforeStartingGame",
    "learninggame/utils/BeforeStartingStudy",
    "learninggame/utils/SnowHelper",
    "learninggame/utils/ValidateHelper",
    "learninggame/utils/AuthHelper"


], function (BaseController, BeforeStartingGame, BeforeStartingStudy, SnowHelper, ValidateHelper, AuthHelper) {
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

            const sModel = "GameSettingsFIORI";
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

        onPressBeforeStartGameSPANISH() {
            console.log("onPressBeforeStartGameSPANISH");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "SPANISH");

            const sModel = "GameSettingsSPANISH";
            const sMode = "gameMode";
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartShowAllQuestions_FIORI() {
            console.log("onPressBeforeStartShowAllQuestions_FIORI");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "FIORI");

            const sModel = "GameSettingsFIORI";
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

        onPressBeforeStartShowAllQuestions_SPANISH() {
            console.log("onPressBeforeStartShowAllQuestions_SPANISH");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "SPANISH");

            const sModel = "GameSettingsSPANISH";
            const sMode = "showAllQuestions";
            BeforeStartingGame.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartStudyISTQBFV4() {
            console.log("onPressBeforeStartStudyISTQBFV4");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "ISTQBFV4");

            const sModel = "GameSettingsISTQBFV4";
            const sMode = "studyMode";
            BeforeStartingStudy.openBeforeStartDialog(this, sModel, sMode);
        },

        onPressBeforeStartStudySPANISH() {
            console.log("onPressBeforeStartStudySPANISH");
            const oTopicModel = this.getOwnerComponent().getModel("TopicModel");
            oTopicModel.setProperty("/activeTopic", "SPANISH");

            const sModel = "GameSettingsSPANISH";
            const sMode = "studyMode";
            BeforeStartingStudy.openBeforeStartDialog(this, sModel, sMode);
        },


        onPressAddQuestion() {
            this.getOwnerComponent().getRouter().navTo("RouteAddQuestion");
        },

        onLogInPress: async function () {
            if (!this._pLoginDialog) {
                this._pLoginDialog = this.loadFragment({
                    name: "learninggame.fragment.LogInDialog"
                });
            }

            const oDialog = await this._pLoginDialog;
            oDialog.open();
        },

        onLoginDialogConfirm: async function () {
            console.log("onLoginDialogConfirm");

            const oDialog = await this._pLoginDialog;

            const sUsername = this.byId("inputUser").getValue();
            const sApiKey = this.byId("inputPassword").getValue();

            const oUserSettingsModel = this.getOwnerComponent().getModel("userSettings");
            const oAllUsersModel = this.getOwnerComponent().getModel("allUsers");

            const bOk = await ValidateHelper.validateLogin(
                oUserSettingsModel,
                oAllUsersModel,
                sUsername,
                sApiKey
            );

            if (!bOk) {
                // hier gerne MessageBox / Toast
                sap.m.MessageToast.show("Login fehlgeschlagen.");
                return; // Dialog offen lassen oder schließen, wie du möchtest
            }

            AuthHelper.saveSessionFromModel(oUserSettingsModel);

            sap.m.MessageToast.show("Login erfolgreich.");
            oDialog.close();
        },

        onLoginDialogCancel: async function () {
            console.log("onLoginDialogCancel");

            const oDialog = await this._pLoginDialog;
            oDialog.close();
        },

        onLogOutPress: function () {
            const oUserSettingsModel = this.getOwnerComponent().getModel("userSettings");

            AuthHelper.clearSession();

            oUserSettingsModel.setProperty("/sUsername", "");
            oUserSettingsModel.setProperty("/sApiKey", "");
            oUserSettingsModel.setProperty("/sApiKeyHashed", "");
            oUserSettingsModel.setProperty("/bUserIsLoggedIn", false);

            sap.m.MessageToast.show("Logout erfolgreich.");
        },

        onDebugModePress: function () {
            const oUserSettingsModel = this.getOwnerComponent().getModel("userSettings");
            const oAllUsersModel = this.getOwnerComponent().getModel("allUsers"); // falls du mitsehen willst

            const oUserSettingsData = oUserSettingsModel.getData();
            const oAllUsersData = oAllUsersModel.getData();

            console.group("DebugMode: Current Models");
            console.log("userSettings:", oUserSettingsData);
            console.log("allUsers:", oAllUsersData);
            console.groupEnd();
        }
    });
});