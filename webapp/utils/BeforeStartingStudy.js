sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",

    // Utils
    "learninggame/utils/Timer",

], function (Fragment, MessageToast, Timer) {
    "use strict";

    return {
        /**
         * Öffnet den "Bevor du startest"-Dialog.
         * @param {sap.ui.core.mvc.Controller} oController - Der aufrufende Controller (z. B. StartPage)
         */

        openBeforeStartDialog: function (oController, sTopicModelName, sMode) {
            const oView = oController.getView();
            const oModel = oController.getOwnerComponent().getModel(sTopicModelName);

            oView.setModel(oModel, "topicModel");
            oModel.setProperty("/sMode", sMode);

            const sDialogId = "beforeStartingDialogStudy";

            if (oController.byId(sDialogId)) {
                oController.byId(sDialogId).destroy();
            }

            // Falls der Dialog noch nicht existiert → lazy load
            // if (!oController._pBeforeStartDialog) {
            oController._pBeforeStartDialog = Fragment.load({
                id: oView.getId(),
                name: "learninggame.fragment.BeforeStartingStudy",
                controller: {

                    onSelectAllTopics: function () {
                        const aAvail = oModel.getProperty("/availableTopics");
                        oModel.setProperty("/selectedTopics", aAvail.map(t => t.key));
                        var iValueOfSelectedTopics = oModel.getProperty("/selectedTopics");
                        console.log(iValueOfSelectedTopics);
                    },

                    onDeselectAllTopics: function () {
                        oModel.setProperty("/selectedTopics", []);
                        console.log(oModel.getProperty("/selectedTopics", []));
                    },

                    onCancelDialog: function () {
                        oView.byId("beforeStartingDialogStudy").close();
                    },

                    onConfirmDialog: function () {
                        const sMode = oModel.getProperty("/sMode");

                        switch (sMode) {
                            // CASE
                            case "studyMode":
                                const aSelTopics = oModel.getProperty("/selectedTopics") || [];
                                if (aSelTopics.length === 0) {
                                    MessageToast.show("Bitte mindestens ein Thema auswählen.");
                                    return;
                                }
                                break;
                            default:
                                break;
                        }

                        oView.byId("beforeStartingDialogStudy").close();

                        const oRouter = sap.ui.core.UIComponent.getRouterFor(oController);

                        switch (sMode) {
                            case "studyMode":
                                console.log("BeforeRouteGameLinear");
                                oModel.setProperty("/settingsAreSet", true);
                                oRouter.navTo("RouteGameLinear");
                                break;

                            default:
                                break;
                        }
                    },

                    onDebug: function () {
                        // console.log(oModel.getProperty("/selectedTopics", []));;

                        const oModel = oView.getModel("GameSettings");
                        const aSel = oModel.getProperty("/selectedTopics");
                        console.log("DEBUG aktuelles GameSettings Model:", oModel.getData());
                        console.log("DEBUG aktuell ausgewählte Topics:", aSel);
                    }
                }

            }).then(function (oDialog) {
                oView.addDependent(oDialog);
                return oDialog;
            });
            // }

            oController._pBeforeStartDialog.then(function (oDialog) {
                oDialog.open();
            });

        }
    };
});
